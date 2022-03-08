import Apify, { Dataset } from 'apify';
import objectPath from 'object-path';

import { log } from './log';

import { State, SetStateFunctionCallBack, DefaultStoreName, StateStoreValue, ReducerFunction, ReducerAction } from './types';

const usedNames = new Set();

/**
 * An instance of this class must be created, followed by the initialize method, in order to use the global store.
 */
class GlobalStore {
    classState: State;
    storeName: DefaultStoreName | string;
    reducer: ReducerFunction | null;

    constructor(customName?: string) {
        this.classState = { store: {} };

        // Can only match certain characters
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }

        this.storeName = customName?.toUpperCase() || 'GLOBAL-STORE';

        // Name can only be used once
        if (usedNames.has(this.storeName.toUpperCase())) throw new Error(`Can only use the name "${this.storeName}" for one global store!`);

        usedNames.add(this.storeName);

        this.reducer = null;

        Apify.events.on('persistState', () => {
            log('Persisting store...');
            return Apify.setValue(this.storeName, this.classState);
        });

        Apify.events.on('migrating', () => {
            log('Handling migration...');
            return Apify.setValue(this.storeName, this.classState);
        });
    }

    /**
     * @param initialState Initial state to start with. Defaults to an empty object
     * Initiate the global state. This is require to use the global store.
     */
    async initialize<T>(initialState?: T): Promise<void> {
        const data = await Apify.getValue(this.storeName);
        if (!!data) this.classState = data as State;
        if (!data) this.classState = { store: { ...initialState } };
    }

    /**
     *
     * Retrieve the current state. Can also be done with storeInstance.state (not called as a function).
     */
    get state(): StateStoreValue {
        return this.classState.store;
    }

    /**
     *
     * @param setStateParam Set the state to a new value, or modify the previous state by passing in a callback function which the current state is automatically passed in.
     */
    set(setStateParam: SetStateFunctionCallBack) {
        const newState = { store: { ...this.classState.store, ...setStateParam(this.classState.store) } };
        this.classState = newState;
    }

    /**
     *
     * @param reducerFn Self-defined reducer function taking the parameters of (state, action) - state is the previous state which is automatically passed in
     */
    addReducer(reducerFn: ReducerFunction) {
        this.reducer = reducerFn;
    }

    /**
     *
     * @param action Your self-defined action when using the addReducer function
     */
    setWithReducer<T>(action: ReducerAction<T>) {
        if (!this.reducer) throw new Error('No reducer function was passed using the "addReducer" method!');

        const newState = this.reducer(this.classState.store, action);

        this.classState = { store: { ...newState } };
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
}

export default GlobalStore;
