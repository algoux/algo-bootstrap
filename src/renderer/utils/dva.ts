import {
  Connect,
  InferableComponentEnhancer,
  InferableComponentEnhancerWithProps,
  MapDispatchToPropsParam,
  MapStateToPropsParam,
  MergeProps,
  Options,
} from 'react-redux';
import { connect as _connect } from 'dva';
import { CallEffectFactory, CallEffect, Put, AllEffect } from 'redux-saga/effects';
import { DispatchProps } from '@/typings/props';

export interface HackedConnect extends Connect {
  (): InferableComponentEnhancer<DispatchProps>;

  <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
  ): InferableComponentEnhancerWithProps<TStateProps & DispatchProps & TOwnProps, TOwnProps>;

  <no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
    mapStateToProps: null | undefined,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
  ): InferableComponentEnhancerWithProps<TDispatchProps & TOwnProps, TOwnProps>;

  <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
  ): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps & TOwnProps, TOwnProps>;

  <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: null | undefined,
    mergeProps: MergeProps<TStateProps, undefined, TOwnProps, TMergedProps>,
  ): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

  <no_state = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}>(
    mapStateToProps: null | undefined,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
    mergeProps: MergeProps<undefined, TDispatchProps, TOwnProps, TMergedProps>,
  ): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

  <no_state = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}>(
    mapStateToProps: null | undefined,
    mapDispatchToProps: null | undefined,
    mergeProps: MergeProps<undefined, undefined, TOwnProps, TMergedProps>,
  ): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

  <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
    mergeProps: MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
  ): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

  <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: null | undefined,
    mergeProps: null | undefined,
    options: Options<State, TStateProps, TOwnProps>,
  ): InferableComponentEnhancerWithProps<DispatchProps & TStateProps, TOwnProps>;

  <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}>(
    mapStateToProps: null | undefined,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
    mergeProps: null | undefined,
    options: Options<{}, TStateProps, TOwnProps>,
  ): InferableComponentEnhancerWithProps<TDispatchProps, TOwnProps>;

  <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
    mergeProps: null | undefined,
    options: Options<State, TStateProps, TOwnProps>,
  ): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;

  <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
    mergeProps: MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
    options: Options<State, TStateProps, TOwnProps, TMergedProps>,
  ): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;
}

export const connect = _connect as HackedConnect;

export interface DvaSagaEffect {
  call: CallEffectFactory<CallEffect>;
  put: Put;
  select: <S>(selector: (state: IState) => S) => S;
  all: (effects: any[]) => AllEffect;
}
