import GlobalStore from './GlobalStore';

export type StoreState = Record<string, any>;

export interface InitializeOptions {
    name?: string;
    initialState?: Record<string, any>;
    cloud?: boolean;
    debug?: boolean;
}

export type StoreType = 'LOCAL' | 'CLOUD';

export interface StoreData {
    sizeInBytes: number;
    lastModified: string;
    globalStoreVersion: string;
    type: StoreType;
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

export type StoreInstances = Record<DefaultStoreName | string, GlobalStore>;

export type CustomMethod = (storeInstances: StoreInstances, ...rest: any[]) => unknown | Promise<unknown>;

export interface AddMethodOptions {
    name: string;
    method: CustomMethod;
}