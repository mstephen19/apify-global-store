export interface State {
    store: StateStoreValue;
}
export declare type StateStoreValue = object | any;
export declare type SetStateFunctionCallBack = (previous: StateStoreValue) => StateStoreValue;
export declare type DefaultStoreName = 'GLOBAL-STORE';
