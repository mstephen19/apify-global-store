import { State, SetStateFunctionCallBack, DefaultStoreName, StateStoreValue } from './types';
declare class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    constructor(customName?: string);
    initialize(): Promise<void>;
    get state(): StateStoreValue;
    setState(setStateParam: SetStateFunctionCallBack): void;
}
export default GlobalStore;