export interface State {
    store: StateStoreValue;
}

export interface ReducerAction<T> {
    [key: string]: T;
}

export type StateStoreValue = object | any;

export type SetStateFunctionCallBack = (previous: StateStoreValue) => StateStoreValue;

export type DefaultStoreName = 'GLOBAL-STORE';

export type ReducerFunction = <T>(state: StateStoreValue, action: ReducerAction<T>) => StateStoreValue;
