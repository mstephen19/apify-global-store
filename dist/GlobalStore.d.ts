import { Dataset } from 'apify';
import { State, SetStateFunctionCallBack, DefaultStoreName, StoreState, ReducerFunction, ReducerParam, InitializeOptions } from './types';
import { StoreData } from '.';
declare class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;
    private constructor();
    static init({ customName, initialState }?: InitializeOptions): Promise<GlobalStore>;
    get state(): StoreState;
    get info(): StoreData;
    set(setStateParam: SetStateFunctionCallBack): void;
    addReducer(reducerFn: ReducerFunction): void;
    setWithReducer<T>(action: ReducerParam<T>): void;
    pushPathToDataset(path: string, dataset?: Dataset): Promise<void>;
    dump(): void;
    static summon(storeName: string): GlobalStore;
}
export default GlobalStore;
