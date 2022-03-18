export declare type StoreState = Record<string, unknown>;
export interface InitializeOptions {
    customName?: string;
    initialState?: Record<string, unknown>;
}
export interface StoreData {
    sizeInBytes?: number;
    lastModified?: string;
}
export interface State {
    store: StoreState;
    data: StoreData;
}
interface ReducerType {
    type: string;
}
export declare type ReducerParam<T> = ReducerType & Record<string, T>;
export declare type SetStateFunctionCallBack = (previous: StoreState) => StoreState;
export declare type DefaultStoreName = 'GLOBAL-STORE';
export declare type ReducerFunction = <T>(state: StoreState, action: ReducerParam<T>) => StoreState;
export {};
