import ua from 'universal-analytics';
import uuid from 'uuid/v4';
import { appConf } from './store';
import { logMain } from 'common/utils/logger';
import { app } from 'electron';
import constants from 'common/configs/constants';
import { genUA } from './ua';

const uid = appConf.get('uid') || uuid();
appConf.set('uid', uid);
const options = {
  headers: {
    'user-agent': genUA(),
  },
};
logMain.info('[track] uid:', uid, 'options:', options);
const usr = ua(process.env.GA_TC || '', uid, options);

const errorCallback = (type: string) => (error: Error | null, count: number) => error && logMain.error(type, error, count);

function pageview(path: string, title?: string) {
  logMain.info('[track.pageview]', path, title);
  usr
    .pageview({
      dp: path,
      dh: constants.site,
      dt: title,
    }, errorCallback('[track.pageview]'))
    .send();
}

function screenview(screenName: string) {
  logMain.info('[track.screenview]', screenName);
  usr
    .screenview({
      cd: screenName,
      an: constants.appName,
      av: app.getVersion(),
    }, errorCallback('[track.screenview]'))
    .send();
}

function event(category: string, action: string, label?: string, value?: string | number) {
  logMain.info('[track.event]', category, action, label, value);
  usr
    .event({
      ec: category,
      ea: action,
      el: label,
      ev: value,
    }, errorCallback('[track.event]'))
    .send();
}
function exception(description: string, fatal?: boolean) {
  logMain.info('[track.exception]', description, fatal);
  usr
    .exception({
      exd: description,
      exf: fatal,
    }, errorCallback('[track.exception]'))
    .send();
}

function timing(category: string, variable: string, time: string | number, label?: string) {
  logMain.info('[track.timing]', category, variable, time, label);
  usr
    .timing({
      utc: category,
      utv: variable,
      utt: time,
      utl: label,
    }, errorCallback('[track.timing]'))
    .send();
}

export default {
  pageview,
  screenview,
  event,
  exception,
  timing,
};
