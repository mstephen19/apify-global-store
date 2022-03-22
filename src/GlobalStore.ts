import Apify, { Dataset, KeyValueStore } from 'apify';
import objectPath from 'object-path';

import { getStoreData, validateName, errorString, log } from './utils';

import { GLOBAL_STORE, CLOUD_GLOBAL_STORES } from './constants';

import {
    State,
    SetStateFunctionCallBack,
    DefaultStoreName,
    StoreState,
    ReducerFunction,
    ReducerParam,
    InitializeOptions,
    StoreInstances,
    StoreData,
} from './types';

const storeInstances: StoreInstances = {};

/**
 * Use await `GlobalStore.init()` to get started using GlobalStore!
 */
class GlobalStore {
    classState: State;
    readonly storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;
    keyValueStore: KeyValueStore | typeof Apify;

    private constructor(storeName: string, initialState: State, kvStore: KeyValueStore | typeof Apify) {
        this.classState = initialState;

        this.storeName = storeName || GLOBAL_STORE;

        this.keyValueStore = kvStore;

        this.reducer = null;

        Apify.events.on('persistState', () => {
            log(`Persisting store ${this.storeName}...`);
            return this.keyValueStore.setValue(this.storeName, this.classState);
        });

        storeInstances[storeName] = this;

        log(`Store initialized with name: ${storeName}`);
    }

    /**
     * @param initializeOptions The options for initializing the GlobalStore.
     * Initiate the global state store. GlobalStore doesn't have a public constructor function; therefore, this must be used.
     */
    static async init({ name, initialState = {}, cloud = false }: InitializeOptions = {}): Promise<GlobalStore> {
        // Can only match certain characters
        if (name && validateName(name)) {
            throw new Error(errorString('Store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".'));
        }

        const storeName = name?.toUpperCase() || GLOBAL_STORE;

        // Name can only be used once
        if (storeInstances[storeName.toUpperCase()]) throw new Error(errorString(`Can only use the name "${storeName}" for one global store!`));

        // Initialize our state
        let state: State = { store: { ...initialState }, data: getStoreData(initialState || {}) };

        const kvStore = cloud ? await Apify.openKeyValueStore(CLOUD_GLOBAL_STORES, { forceCloud: true }) : Apify;

        // Check if some previous state already exists. If so, grab it and replace our initialized state with that.
        const data = await kvStore.getValue(storeName);
        if (!!data) state = data as State;

        return new GlobalStore(storeName, state, kvStore);
    }

    /**
     *
     * @param storeName The name of the store you'd like to have returned.
     */
    static summon(storeName?: string) {
        if (!storeName) return storeInstances[GLOBAL_STORE];

        if (!storeInstances[storeName.toUpperCase()]) throw new Error(errorString(`Store with name ${storeName.toUpperCase()} doesn't exist!`));
        return storeInstances[storeName.toUpperCase()];
    }

    /**
     * Return an object containing all instances of GlobalStore. Each key pertains to the store's name.
     */
    static summonAll(): StoreInstances {
        return storeInstances;
    }

    /**
     *
     * Retrieve the current state object of the store.
     */
    get state(): StoreState {
        return this.classState.store;
    }

    /**
     * Get various information about the store.
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
        if (this.reducer) throw new Error(errorString('This store already has a reducer function!'));
        this.reducer = reducerFn;
    }

    /**
     *
     * @param action Your self-defined action when using the addReducer function
     */
    setWithReducer<T extends unknown>(action: ReducerParam<T>) {
        if (!this.reducer) throw new Error(errorString('No reducer function was passed using the "addReducer" method!'));

        const newState = this.reducer(this.classState.store, action);

        this.classState = { store: { ...newState }, data: getStoreData(newState) };
    }

    /**
     *
     * @param path The path to set/replace within the store
     * @param value The value to set
     */
    setPath(path: string, value: unknown) {
        const store = { ...this.classState.store };

        objectPath.set(store, path, value);

        this.classState = { store, data: getStoreData(store) };
    }

    /**
     *
     * @param path A string version of the path within the state that you'd like to delete
     */
    deletePath(path: string) {
        const value: Record<string, unknown> | Record<string, unknown>[] = objectPath.get(this.classState.store, path);

        if (!value) throw new Error(errorString(`Path ${path} not found within store`));

        const store = { ...this.classState.store };

        objectPath.del(store, path);

        this.classState = { store, data: getStoreData(store) };
    }

    /**
     *
     * @param path A string version of the path within the state that you'd like to push to the dataset
     * @param dataset Optional, provide a dataset to push to. If not provided, the default dataset will be used.
     */
    async pushPathToDataset(path: string, dataset?: Dataset) {
        const value: Record<string, unknown> | Record<string, unknown>[] = objectPath.get(this.classState.store, path);

        if (!value) throw new Error(errorString(`Path ${path} not found within store`));

        if (typeof value !== 'object') throw new Error(errorString(`Can only push objects or arrays! Trying to push ${typeof value}`));

        try {
            if (!dataset) return Apify.pushData(value);
            if (dataset) return dataset.pushData(value);
        } catch (err) {
            throw new Error(errorString(`Failed to push to the dataset!: ${err}`));
        }

        const store = { ...this.classState.store };

        objectPath.del(store, path);

        this.classState = { store, data: getStoreData(store) };
    }

    /**
     * Completely clear out the entire store of all data, such as its size, as well as the last time it was modified.
     */
    dump() {
        log(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: getStoreData({}) };
    }

    /**
     * If saving on every "persistState" event is not enough, use "forceSave" to instantly save the GlobalStore to the Key-Value Store.
     */
    async forceSave() {
        return this.keyValueStore.setValue(this.storeName, this.classState);
    }
}

export default GlobalStore;
