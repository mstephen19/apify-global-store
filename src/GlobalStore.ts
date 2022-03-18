import Apify, { Dataset } from 'apify';
import objectPath from 'object-path';

import { log } from './utils';
import { getStoreData } from './utils';

import { State, SetStateFunctionCallBack, DefaultStoreName, StoreState, ReducerFunction, ReducerParam, InitializeOptions } from './types';
import { StoreData } from '.';

const storeInstances: Record<string, GlobalStore> = {};

/**
 * An instance of this class must be created, followed by the initialize method, in order to use the global store.
 */
class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;

    private constructor(storeName: string, initialState: State) {
        this.classState = initialState;

        this.storeName = storeName || 'GLOBAL-STORE';

        this.reducer = null;

        Apify.events.on('persistState', () => {
            log('Persisting store...');
            return Apify.setValue(this.storeName, this.classState);
        });

        storeInstances[storeName] = this;

        log(`Store initialized with name: ${storeName}`);
    }

    /**
     * @param customName Name for the global store. Defaults to 'GLOBAL-STORE'
     * @param initialState Initial state to start with. Defaults to an empty object
     * Initiate the global state store. GlobalStore doesn't have a public constructor function; therefore, this must be used.
     */
    static async init({ customName, initialState }: InitializeOptions = {}): Promise<GlobalStore> {
        // Can only match certain characters
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }

        const storeName = customName?.toUpperCase() || 'GLOBAL-STORE';

        // Name can only be used once
        if (storeInstances[storeName.toUpperCase()]) throw new Error(`Can only use the name "${storeName}" for one global store!`);

        let state: State = { store: {}, data: {} };

        const data = await Apify.getValue(storeName);

        if (!!data) state = data as State;
        if (!data) state = { store: { ...initialState }, data: getStoreData(initialState || {}) };

        return new GlobalStore(storeName, state);
    }

    /**
     *
     * @param storeName The name of the store you'd like to have returned.
     */
    static summon(storeName: string) {
        if (!storeInstances[storeName.toUpperCase()]) throw new Error(`Store with name ${storeName.toUpperCase()} doesn't exist!`);
        return storeInstances[storeName.toUpperCase()];
    }

    /**
     *
     * Retrieve the current state. Can also be done with storeInstance.state (not called as a function).
     */
    get state(): StoreState {
        return this.classState.store;
    }

    /**
     * Get various info about the store.
     */
    get info(): StoreData {
        return this.classState.data;
    }

    /**
     *
     * @param setStateParam Set the state to a new value, or modify the previous state by passing in a callback function which the current state is automatically passed in.
     */
    set(setStateParam: SetStateFunctionCallBack) {
        const newStoreStateValue = { ...setStateParam(this.classState.store) };

        const newState = { store: newStoreStateValue, data: getStoreData(newStoreStateValue) };
        this.classState = newState;
    }

    /**
     *
     * @param reducerFn Self-defined reducer function taking the parameters of (state, action) - state is the previous state which is automatically passed in
     */
    addReducer(reducerFn: ReducerFunction) {
        if (this.reducer) throw new Error('This store already has a reducer function!');
        this.reducer = reducerFn;
    }

    /**
     *
     * @param action Your self-defined action when using the addReducer function
     */
    setWithReducer<T>(action: ReducerParam<T>) {
        if (!this.reducer) throw new Error('No reducer function was passed using the "addReducer" method!');

        const newState = this.reducer(this.classState.store, action);

        this.classState = { store: { ...newState }, data: getStoreData(newState) };
    }

    /**
     *
     * @param path A string version of the path within the state that you'd like to push to the dataset
     * @param dataset Optional, provide a dataset to push to. If not provided, the default dataset will be used.
     */
    async pushPathToDataset(path: string, dataset?: Dataset) {
        let value: Record<string, unknown> | [];
        try {
            value = objectPath.get(this.classState.store, path);
        } catch (err) {
            throw new Error(`Path ${path} not found within store: ${err}`);
        }

        objectPath.del(this.classState.store, path);

        if (!dataset) return Apify.pushData(value);
        return dataset.pushData(value);
    }

    /**
     * Completely clear out the entire store of all data, such as its size, as well as the last time it was modified.
     */
    dump() {
        log(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: getStoreData({}) };
    }
}

export default GlobalStore;
