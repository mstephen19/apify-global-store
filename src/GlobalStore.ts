import Apify from 'apify';
import { log } from './log';

import { State, SetStateFunctionCallBack, DefaultStoreName, StateStoreValue } from './types';

/**
 * An instance of this class must be created, followed by the initialize method, in order to use the global store.
 */
class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;

    constructor(customName?: string) {
        this.classState = { store: {} };

        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }

        this.storeName = customName?.toUpperCase() || 'GLOBAL-STORE';

        Apify.events.on('persistState', () => {
            log('Persisting global store...');
            return Apify.setValue(this.storeName, this.classState);
        });

        Apify.events.on('migrating', () => {
            return Apify.setValue(this.storeName, this.classState);
        });
    }

    /**
     * Initiate the global state. This is require to use the global store.
     */
    async initialize(): Promise<void> {
        const data = await Apify.getValue('GLOBAL-STORE');
        if (!!data) this.classState = data as State;
        if (!data) this.classState = { store: {} };
    }

    /**
     *
     * Retrieve the current state. Can also be done with storeInstance.state (not called as a function).
     */
    get state(): StateStoreValue {
        return this.classState.store as StateStoreValue;
    }

    /**
     * Set the state to a new value, or modify the previous state by passing in a callback function which the current state is automatically passed in.
     */
    setState(setStateParam: SetStateFunctionCallBack) {
        const newState = { store: { ...this.classState.store, ...setStateParam(this.classState.store) } };
        this.classState = newState;
    }
}

export default GlobalStore;
