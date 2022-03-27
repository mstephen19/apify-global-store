"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const object_path_1 = (0, tslib_1.__importDefault)(require("object-path"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const storeInstances = {};
class GlobalStore {
    constructor(storeName, initialState, kvStore, debug) {
        Object.defineProperty(this, "classState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "storeName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reducer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keyValueStore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "debug", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "log", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.classState = initialState;
        this.storeName = storeName || constants_1.GLOBAL_STORE;
        this.keyValueStore = kvStore;
        this.reducer = null;
        this.debug = debug !== null && debug !== void 0 ? debug : false;
        this.log = new utils_1.Logger(debug, this.storeName);
        apify_1.default.events.on('persistState', () => {
            this.log.general(`Persisting store ${this.storeName}...`);
            return this.keyValueStore.setValue(this.storeName, this.classState);
        });
        storeInstances[storeName] = this;
        this.log.general(`Store initialized with name: ${storeName}`);
    }
    static async init({ name, initialState = {}, cloud = false, debug = false } = {}) {
        if (name && (0, utils_1.validateName)(name)) {
            throw new Error((0, utils_1.errorString)('Store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".'));
        }
        const storeName = (name === null || name === void 0 ? void 0 : name.toUpperCase()) || constants_1.GLOBAL_STORE;
        if (storeInstances[storeName.toUpperCase()])
            throw new Error((0, utils_1.errorString)(`Can only use the name "${storeName}" for one global store!`));
        let state = { store: { ...initialState }, data: (0, utils_1.getStoreData)(initialState || {}) };
        const kvStore = cloud ? await apify_1.default.openKeyValueStore(constants_1.CLOUD_GLOBAL_STORES, { forceCloud: true }) : apify_1.default;
        const data = await kvStore.getValue(storeName);
        if (!!data)
            state = data;
        return new GlobalStore(storeName, state, kvStore, debug);
    }
    static summon(storeName) {
        if (!storeName)
            return storeInstances[constants_1.GLOBAL_STORE];
        if (!storeInstances[storeName.toUpperCase()])
            throw new Error((0, utils_1.errorString)(`Store with name ${storeName.toUpperCase()} doesn't exist!`));
        return storeInstances[storeName.toUpperCase()];
    }
    static summonAll() {
        return storeInstances;
    }
    get state() {
        this.log.debug('Grabbing current state...');
        return this.classState.store;
    }
    get info() {
        this.log.debug('Grabbing store info...');
        return this.classState.data;
    }
    set(setStateParam) {
        this.log.debug('Updating state...');
        const newStoreStateValue = { ...setStateParam(this.classState.store) };
        const newState = { store: newStoreStateValue, data: (0, utils_1.getStoreData)(newStoreStateValue) };
        this.log.debug('Setting new class state...');
        this.classState = newState;
    }
    addReducer(reducerFn) {
        if (this.reducer)
            throw new Error((0, utils_1.errorString)('This store already has a reducer function!'));
        this.log.debug('Reducer function added!');
        this.reducer = reducerFn;
    }
    setWithReducer(action) {
        if (!this.reducer)
            throw new Error((0, utils_1.errorString)('No reducer function was passed using the "addReducer" method!'));
        this.log.debug('Running reducer with action:');
        console.table(action);
        const newState = this.reducer(this.classState.store, action);
        this.log.debug('Replacing class state with new state...');
        this.classState = { store: { ...newState }, data: (0, utils_1.getStoreData)(newState) };
    }
    setPath(path, value) {
        const store = { ...this.classState.store };
        this.log.debug('Setting new path...');
        object_path_1.default.set(store, path, value);
        this.log.debug('Replacing class state with new state...');
        this.classState = { store, data: (0, utils_1.getStoreData)(store) };
    }
    deletePath(path) {
        this.log.debug(`Grabbing value for path ${path}...`);
        const value = object_path_1.default.get(this.classState.store, path);
        if (!value)
            throw new Error((0, utils_1.errorString)(`Path ${path} not found within store`));
        const store = { ...this.classState.store };
        this.log.debug(`Deleting value for path ${path} in state copy...`);
        object_path_1.default.del(store, path);
        this.log.debug(`Updating class state to exclude ${path}...`);
        this.classState = { store, data: (0, utils_1.getStoreData)(store) };
    }
    async pushPathToDataset(path, dataset) {
        this.log.debug(`Grabbing value for path ${path}...`);
        const value = object_path_1.default.get(this.classState.store, path);
        if (!value)
            throw new Error((0, utils_1.errorString)(`Path ${path} not found within store`));
        if (typeof value !== 'object')
            throw new Error((0, utils_1.errorString)(`Can only push objects or arrays! Trying to push ${typeof value}`));
        this.log.debug('Pushing data to the dataset...');
        try {
            if (!dataset)
                return apify_1.default.pushData(value);
            if (dataset)
                return dataset.pushData(value);
        }
        catch (err) {
            throw new Error((0, utils_1.errorString)(`Failed to push to the dataset!: ${err}`));
        }
        const store = { ...this.classState.store };
        this.log.debug(`Deleting value for path ${path} in state copy...`);
        object_path_1.default.del(store, path);
        this.log.debug(`Updating class state to exclude ${path}...`);
        this.classState = { store, data: (0, utils_1.getStoreData)(store) };
    }
    dump() {
        this.log.general(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: (0, utils_1.getStoreData)({}) };
    }
    async forceSave() {
        this.log.debug('Force-saving...');
        return this.keyValueStore.setValue(this.storeName, this.classState);
    }
}
exports.default = GlobalStore;
