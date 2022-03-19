import { Dataset } from 'apify';
import { State, SetStateFunctionCallBack, DefaultStoreName, StoreState, ReducerFunction, ReducerParam, InitializeOptions, StoreInstances } from './types';
import { StoreData } from '.';
declare class GlobalStore {
    classState: State;
    readonly storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;
    private constructor();
    static init({ name, initialState }?: InitializeOptions): Promise<GlobalStore>;
    static summon(storeName: string): GlobalStore;
    static summonAll(): StoreInstances;
    get state(): StoreState;
    get info(): StoreData;
    set(setStateParam: SetStateFunctionCallBack): void;
    addReducer(reducerFn: ReducerFunction): void;
    setWithReducer<T>(action: ReducerParam<T>): void;
    pushPathToDataset(path: string, dataset?: Dataset): Promise<void>;
    dump(): void;
}
export default GlobalStore;
