import { Connect } from 'react-redux';
import { connect as _connect } from 'dva';
import { CallEffectFactory, CallEffect, Put, SelectEffect } from 'redux-saga/effects';

export const connect = _connect as Connect;

export interface DvaAction<P = any> {
  type: string;
  payload: P;
}

export interface DvaSagaEffect {
  call: CallEffectFactory<CallEffect>;
  put: Put;
  select: SelectEffect;
}
