import Apify, { Dataset, KeyValueStore } from 'apify';
import objectPath from 'object-path';

import { getStoreData, validateName, errorString, Logger } from './utils';

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
 * Use `await GlobalStore.init(InitializeOptions)` to get started using GlobalStore!
 */
class GlobalStore {
    private classState: State;
    readonly storeName: DefaultStoreName | string;
    private reducer: ReducerFunction | null;
    private keyValueStore: KeyValueStore | typeof Apify;
    readonly debug: boolean;
    private log: Logger;
    readonly isCloud: boolean;

    private constructor(storeName: string, initialState: State, kvStore: KeyValueStore | typeof Apify, debug: boolean) {
        this.classState = initialState;
        this.storeName = storeName || GLOBAL_STORE;
        this.keyValueStore = kvStore;
        this.reducer = null;
        this.debug = debug ?? false;
        this.log = new Logger(debug, this.storeName);
        this.isCloud = this.keyValueStore !== Apify;

        Apify.events.on('persistState', () => {
            this.log.general(`Persisting store ${this.storeName}...`);
            return this.keyValueStore.setValue(this.storeName, this.classState);
        });

        storeInstances[storeName] = this;

        this.log.general(`Store initialized with name: ${storeName}`);
    }

    /**
     * @param initializeOptions The options for initializing the GlobalStore.
     * Initiate the global state store. GlobalStore doesn't have a public constructor function; therefore, this must be used.
     */
    static async init({ name, initialState = {}, cloud = false, debug = false }: InitializeOptions = {}): Promise<GlobalStore> {
        // Can only match certain characters
        if (name && validateName(name)) {
            throw new Error(errorString('Store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".'));
        }

        const storeName = name?.toUpperCase() || GLOBAL_STORE;

        // Name can only be used once
        if (storeInstances[storeName.toUpperCase()]) throw new Error(errorString(`Can only use the name "${storeName}" for one global store!`));

        // Initialize our state
        let state: State = { store: { ...initialState }, data: getStoreData(initialState || {}, cloud) };

        const kvStore = cloud ? await Apify.openKeyValueStore(CLOUD_GLOBAL_STORES, { forceCloud: true }) : Apify;

        // Check if some previous state already exists. If so, grab it and replace our initialized state with that.
        const data = await kvStore.getValue(storeName);
        if (!!data) state = data as State;

        return new GlobalStore(storeName, state, kvStore, debug);
    }

    /**
     * Return the intance of GlobalStore matching the provided name. If no name is provided, the one with the default name will be returned.
     *
     * @param storeName The name of the store you'd like to have returned.
     */
    static summon(storeName?: string) {
        if (!storeName) return storeInstances[GLOBAL_STORE];

        if (!storeInstances[storeName.toUpperCase()]) throw new Error(errorString(`Store with name ${storeName.toUpperCase()} doesn't exist!`));

        return storeInstances[storeName.toUpperCase()];
    }

    /**
     * Return an object containing all instances of GlobalStore. Each key pertains to the each store's name.
     */
    static summonAll(): StoreInstances {
        return storeInstances;
    }

    /**
     *
     * Retrieve the current state object of the store.
     */
    get state(): StoreState {
        this.log.debug('Grabbing current state...');
        return this.classState.store;
    }

    /**
     * Get various information about the store.
     */
    get info(): StoreData {
        this.log.debug('Grabbing store info...');
        return this.classState.data;
    }

    /**
     *
     * @param setStateParam Set the state to a new value, or modify the previous state by passing in a callback function which the current state is automatically passed in.
     */
    set(setStateParam: SetStateFunctionCallBack) {
        this.log.debug('Updating state...');
        const newStoreStateValue = { ...setStateParam(this.classState.store) };

        const newState = { store: newStoreStateValue, data: getStoreData(newStoreStateValue, this.isCloud) };

        this.log.debug('Setting new class state...');
        this.classState = newState;
    }

    /**
     * Add a reducer function to enable the usage of the `store.setWithReducer()` method.
     *
     * @param reducerFn Self-defined reducer function taking the parameters of `(state, action)` - `state` is the previous state which is automatically passed in.
     */
    addReducer(reducerFn: ReducerFunction) {
        if (this.reducer) throw new Error(errorString('This store already has a reducer function!'));

        this.log.debug('Reducer function added!');
        this.reducer = reducerFn;
    }

    /**
     * Set the state using your custom reducer function.
     *
     * @param action Your self-defined action when using the `store.addReducer()` method.
     */
    setWithReducer<T extends unknown>(action: ReducerParam<T>) {
        if (!this.reducer) throw new Error(errorString('No reducer function was passed using the "addReducer" method!'));

        this.log.debug('Running reducer with action:');
        console.table(action);

        const newState = this.reducer(this.classState.store, action);

        this.log.debug('Replacing class state with new state...');
        this.classState = { store: { ...newState }, data: getStoreData(newState, this.isCloud) };
    }

    /**
     * Set a specific path within the state to avoid usage of verbose spread operators in `set` and `setWithReducer`
     *
     * @param path The path to set/replace within the store
     * @param value The value to set
     */
    setPath(path: string, value: unknown) {
        const store = { ...this.classState.store };

        this.log.debug('Setting new path...');
        objectPath.set(store, path, value);

        this.log.debug('Replacing class state with new state...');
        this.classState = { store, data: getStoreData(store, this.isCloud) };
    }

    /**
     * Manually delete a specific path's value within the store.
     *
     * @param path A string version of the path within the state that you'd like to delete
     */
    deletePath(path: string) {
        this.log.debug(`Grabbing value for path ${path}...`);
        const value: Record<string, unknown> | Record<string, unknown>[] = objectPath.get(this.classState.store, path);

        if (!value) throw new Error(errorString(`Path ${path} not found within store`));

        const store = { ...this.classState.store };

        this.log.debug(`Deleting value for path ${path} in state copy...`);
        objectPath.del(store, path);

        this.log.debug(`Updating class state to exclude ${path}...`);
        this.classState = { store, data: getStoreData(store, this.isCloud) };
    }

    /**
     * Automatically push the value of a path to the dataset, then delete it from the store.
     *
     * @param path A string version of the path within the state that you'd like to push to the dataset
     * @param dataset Optional, provide a dataset to push to. If not provided, the default dataset will be used.
     */
    async pushPathToDataset(path: string, dataset?: Dataset) {
        this.log.debug(`Grabbing value for path ${path}...`);
        const value: Record<string, unknown> | Record<string, unknown>[] = objectPath.get(this.classState.store, path);

        if (!value) throw new Error(errorString(`Path ${path} not found within store`));

        if (typeof value !== 'object') throw new Error(errorString(`Can only push objects or arrays! Trying to push ${typeof value}`));

        this.log.debug('Pushing data to the dataset...');
        try {
            if (!dataset) return Apify.pushData(value);
            if (dataset) return dataset.pushData(value);
        } catch (err) {
            throw new Error(errorString(`Failed to push to the dataset!: ${err}`));
        }

        const store = { ...this.classState.store };

        this.log.debug(`Deleting value for path ${path} in state copy...`);
        objectPath.del(store, path);

        this.log.debug(`Updating class state to exclude ${path}...`);
        this.classState = { store, data: getStoreData(store, this.isCloud) };
    }

    /**
     * Completely clear out the entire store of all data, such as its size, as well as the last time it was modified.
     */
    dump() {
        this.log.general(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: getStoreData({}, this.isCloud) };
    }

    /**
     * Completely dump all instances of GlobalStore.
     */
    static dumpAll() {
        for (const store of Object.values(storeInstances)) {
            store.dump();
        }
    }

    /**
     * If saving on every "persistState" event is not enough, use "forceSave" to instantly save the GlobalStore to the Key-Value Store.
     */
    async forceSave() {
        this.log.debug('Force-saving...');
        return this.keyValueStore.setValue(this.storeName, this.classState);
    }

    /**
     * Back the store up to the cloud. If you want your store to automatically back up to the cloud on an interval, use the `cloud` option in `InitializeOptions` instead.
     */
    async backup() {
        const cloudStore = await Apify.openKeyValueStore(CLOUD_GLOBAL_STORES);
        await cloudStore.setValue(this.storeName, this.classState);
    }
}

export default GlobalStore;
