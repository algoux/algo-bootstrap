import { Connect } from 'react-redux';
import { connect as _connect } from 'dva';
import { CallEffectFactory, CallEffect, Put } from 'redux-saga/effects';

export const connect = _connect as Connect;

export interface DvaSagaEffect {
  call: CallEffectFactory<CallEffect>;
  put: Put;
  select: <S>(selector: (state: IState) => S) => S;
}
