import { app, session } from 'electron';

export function genUA() {
  try {
    return session.defaultSession.getUserAgent() + ` AlgoBootstrap/${app.getVersion()}`;
  } catch (error) {
    return `AlgoBootstrap/${app.getVersion()}`;
  }
}
