export interface State {
    store: StateStoreValue;
}
export interface ReducerAction<T> {
    [key: string]: T;
}
export declare type StateStoreValue = Record<string, unknown>;
export declare type SetStateFunctionCallBack = (previous: StateStoreValue) => StateStoreValue;
export declare type DefaultStoreName = 'GLOBAL-STORE';
export declare type ReducerFunction = <T>(state: StateStoreValue, action: ReducerAction<T>) => StateStoreValue;
