import { Dataset } from 'apify';
import { SetStateFunctionCallBack, DefaultStoreName, StoreState, ReducerFunction, ReducerParam, InitializeOptions, StoreInstances, StoreData } from './types';
declare class GlobalStore {
    private classState;
    readonly storeName: DefaultStoreName | string;
    private reducer;
    private keyValueStore;
    readonly debug: boolean;
    private log;
    readonly isCloud: boolean;
    private constructor();
    static init({ name, initialState, cloud, debug }?: InitializeOptions): Promise<GlobalStore>;
    static summon(storeName?: string): GlobalStore;
    static summonAll(): StoreInstances;
    get state(): StoreState;
    get info(): StoreData;
    set(setStateParam: SetStateFunctionCallBack): void;
    addReducer(reducerFn: ReducerFunction): void;
    setWithReducer<T extends unknown>(action: ReducerParam<T>): void;
    setPath(path: string, value: unknown): void;
    deletePath(path: string): void;
    pushPathToDataset(path: string, dataset?: Dataset): Promise<void>;
    dump(): void;
    forceSave(): Promise<void>;
}
export default GlobalStore;
