import GA from 'react-ga4';
import { v4 as uuidv4 } from 'uuid';
import sm from './modules';
import { logRenderer } from './logger';

function pageview(path: string, title?: string) {
  logRenderer.info('[track.pageview]', path, title);
  GA.send({
    hitType: 'pageview',
    page: path,
    title,
  });
}

function event(category: string, action: string, label?: string, value?: number) {
  logRenderer.info('[track.event]', category, action, label, value);
  GA.event({
    category,
    action,
    label,
    value,
  });
}
function exception(description: string, fatal?: boolean) {
  logRenderer.info('[track.exception]', description, fatal);
  GA.event({
    category: 'exception',
    action: 'exception',
    label: description,
    nonInteraction: true,
  });
}

function timing(variable: string, time: number, label?: string) {
  logRenderer.info('[track.timing]', variable, time, label);
  GA.event({
    category: 'timing',
    action: variable,
    label: label,
    value: time,
  });
}

function init() {
  let uid = sm.appConf.get('uid');
  if (!uid) {
    uid = sm.appConf.get('uid') || uuidv4();
    sm.appConf.set('uid', uid);
  }
  logRenderer.info('[track] uid:', uid);
  if (!process.env.GA_TC) {
    logRenderer.warn('[track.init] no GA track code found');
    return;
  }
  logRenderer.info('[track.init] initializing GA');
  try {
    GA.initialize([
      {
        trackingId: process.env.GA_TC,
        gaOptions: {
          userId: uid,
        },
      },
    ]);
  } catch (e) {
    logRenderer.warn('[track.init] init failed:', e);
  }
}

export default {
  init,
  pageview,
  event,
  exception,
  timing,
};
