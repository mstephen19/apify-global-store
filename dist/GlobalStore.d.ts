import { State, SetStateFunctionCallBack, DefaultStoreName, StateStoreValue, ReducerFunction, ReducerAction } from './types';
declare class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;
    constructor(customName?: string);
    initialize<T>(initialState?: T): Promise<void>;
    get state(): StateStoreValue;
    set(setStateParam: SetStateFunctionCallBack): void;
    addReducer(reducerFn: ReducerFunction): void;
    setWithReducer<T>(action: ReducerAction<T>): void;
}
export default GlobalStore;
