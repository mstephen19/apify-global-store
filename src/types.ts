import GlobalStore from './GlobalStore';

export type StoreState = Record<string, unknown>;

export interface InitializeOptions {
    name?: string;
    initialState?: Record<string, unknown>;
}

export interface StoreData {
    sizeInBytes?: number;
    lastModified?: string;
    globalStoreVersion?: string;
}
export interface State {
    store: StoreState;
    data: StoreData;
}

interface ReducerType {
    type: string;
}

export type ReducerParam<T> = ReducerType & Record<string, T>;

export type SetStateFunctionCallBack = (previous: StoreState) => StoreState;

export type DefaultStoreName = 'GLOBAL-STORE';

export type ReducerFunction = <T>(state: StoreState, action: ReducerParam<T>) => StoreState;

export type StoreInstances = Record<string, GlobalStore>;
