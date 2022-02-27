import { State, SetStateFunctionCallBack, DefaultStoreName, StateStoreValue } from './types';
declare class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    constructor(customName?: string);
    initialize<T>(initialState?: T): Promise<void>;
    get state(): StateStoreValue;
    set(setStateParam: SetStateFunctionCallBack): void;
}
export default GlobalStore;
