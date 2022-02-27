export interface State {
    store: StateStoreValue;
}

export type StateStoreValue = object | any;

export type SetStateFunctionCallBack = (previous: StateStoreValue) => StateStoreValue;

export type DefaultStoreName = 'GLOBAL-STORE';
