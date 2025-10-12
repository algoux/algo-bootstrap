import { v4 as uuidv4 } from 'uuid';
import got from 'got';
import { app, nativeTheme, screen } from 'electron';
import os from 'os';
import pTimeout from 'p-timeout';
import { appConf } from './store';
import { logMain } from './logger';

// @ref https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?hl=zh-cn&client_type=firebase#payload_device_info
interface DeviceInfo {
  category?: string;
  language?: string;
  screen_resolution?: string;
  operating_system?: string;
  operating_system_version?: string;
  model?: string;
  brand?: string;
  browser?: string;
  browser_version?: string;
}

// forked from electron-google-analytics4
class Analytics {
  private trackingId: string;
  private secretKey: string;
  private clientId: string | undefined;
  private sessionId: string | undefined;
  private customParams: Record<string, unknown> = {};
  private userProperties: Record<string, unknown> | null = null;
  private device: DeviceInfo;

  private baseURL = 'https://www.google-analytics.com/mp';
  private collectURL = '/collect';

  constructor(trackingId: string, secretKey: string, clientId?: string, sessionId?: string) {
    this.trackingId = trackingId;
    this.secretKey = secretKey;
    this.clientId = clientId;
    this.sessionId = sessionId;

    const platformMap: Record<string, string> = {
      darwin: 'MacOS',
      win32: 'Windows',
      linux: 'Linux',
    };
    const operatingSystem = platformMap[process.platform] || process.platform;

    let screenResolution: string | undefined;
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor;
      screenResolution = `${Math.round(width * scaleFactor)}x${Math.round(height * scaleFactor)}`;
    } catch (error) {
      // screen API may not be available during early initialization
      logMain.warn('[track.device] screen API failed:', error);
    }

    this.device = {
      category: 'desktop',
      language: app.getLocale(),
      screen_resolution: screenResolution,
      operating_system: operatingSystem,
      operating_system_version: os.release(),
      browser: 'Electron',
      browser_version: process.versions.electron,
    };
    logMain.info('[track.device]', this.device);
  }

  set(key: string, value: any) {
    if (value !== null) {
      this.customParams[key] = value;
    } else {
      delete this.customParams[key];
    }

    return this;
  }

  setParams(params?: Record<string, unknown>) {
    if (typeof params === 'object' && Object.keys(params).length > 0) {
      Object.assign(this.customParams, params);
    } else {
      this.customParams = {};
    }

    return this;
  }

  setUserProperties(upValue?: Record<string, unknown>) {
    if (typeof upValue === 'object' && Object.keys(upValue).length > 0) {
      this.userProperties = upValue;
    } else {
      this.userProperties = null;
    }

    return this;
  }

  event(eventName: string, params?: Record<string, unknown>) {
    const payload = {
      client_id: this.clientId,
      events: [
        {
          name: eventName,
          params: {
            session_id: this.sessionId,
            ...this.customParams,
            ...params,
          },
        },
      ],
      device: this.device,
    };

    if (this.userProperties) {
      Object.assign(payload, { user_properties: this.userProperties });
    }

    return got.post(
      `${this.baseURL}${this.collectURL}?measurement_id=${this.trackingId}&api_secret=${this.secretKey}`,
      {
        json: payload,
        timeout: 30 * 1000,
      },
    );
  }
}

class Tracker {
  private analytics: Analytics | null = null;
  private queue: Array<{
    eventName: string;
    params?: Record<string, unknown>;
  }> = [];
  private lastPageView: {
    page_location: string;
    page_title: string;
    _ts: number; // timestamp
  } | null = null;

  private async _event(eventName: string, params?: Record<string, unknown>) {
    if (!this.analytics) {
      this.queue.push({ eventName, params });
    } else {
      await this.analytics.event(eventName, params).catch((e) => {
        logMain.error('[track._event] error:', e);
      });
    }
  }

  init() {
    let uid = appConf.get('uid');
    if (!uid) {
      uid = appConf.get('uid') || uuidv4();
      appConf.set('uid', uid);
    }
    logMain.info('[track] uid:', uid);

    if (process.env.GA_TC && process.env.GA_MP) {
      logMain.info('[track.init] initializing GA');
      this.analytics = new Analytics(process.env.GA_TC, process.env.GA_MP, uid, uuidv4());
      this.analytics.setUserProperties({
        app_version: {
          value: app.getVersion(),
        },
        use_dark: {
          value: nativeTheme.shouldUseDarkColors,
        },
        theme_source: {
          value: nativeTheme.themeSource,
        },
      });
      this.queue.forEach(({ eventName, params }) => {
        this._event(eventName, params);
      });
      this.queue = [];
    } else {
      logMain.warn('[track.init] skip GA');
    }
  }

  async beforeExit() {
    logMain.info('[track.beforeExit]');
    if (this.lastPageView) {
      await pTimeout(
        this._event('page_view', {
          page_location: this.lastPageView.page_location,
          page_title: this.lastPageView.page_title,
          engagement_time_msec: Date.now() - this.lastPageView._ts,
        }),
        1000,
      );
    }
  }

  async pageview(path: string, title?: string) {
    logMain.info('[track.pageview]', path, title);
    if (this.lastPageView) {
      // push last page view
      await this._event('page_view', {
        page_location: this.lastPageView.page_location,
        page_title: this.lastPageView.page_title,
        engagement_time_msec: Date.now() - this.lastPageView._ts,
      });
    }
    this.lastPageView = {
      page_location: path,
      page_title: title || '',
      _ts: Date.now(),
    };
  }

  async event(
    category: string,
    action: string,
    label?: string,
    value?: number,
    engagementTimeMsec?: number,
  ) {
    logMain.info('[track.event]', category, action, label, value);
    await this._event(action, {
      event_category: category,
      event_label: label,
      value: value,
      engagement_time_msec: engagementTimeMsec || 0,
    });
  }

  async exception(description: string, fatal?: boolean) {
    logMain.info('[track.exception]', description, fatal);
    await this._event('exception', {
      description,
      fatal: !!fatal,
      engagement_time_msec: 0,
    });
  }

  async timing(variable: string, time: number, label?: string) {
    logMain.info('[track.timing]', variable, time, label);
    await this._event('performance_timing', {
      variable,
      duration: time,
      label: label || '',
      engagement_time_msec: time,
    });
  }
}

const track = new Tracker();

export default track;
