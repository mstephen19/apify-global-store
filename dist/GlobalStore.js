"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const object_path_1 = (0, tslib_1.__importDefault)(require("object-path"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const storeInstances = {};
class GlobalStore {
    constructor(storeName, initialState, kvStore) {
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
        this.classState = initialState;
        this.storeName = storeName || constants_1.GLOBAL_STORE;
        this.keyValueStore = kvStore;
        this.reducer = null;
        apify_1.default.events.on('persistState', () => {
            (0, utils_1.log)(`Persisting store ${this.storeName}...`);
            return this.keyValueStore.setValue(this.storeName, this.classState);
        });
        storeInstances[storeName] = this;
        (0, utils_1.log)(`Store initialized with name: ${storeName}`);
    }
    static async init({ name, initialState = {}, cloud = false } = {}) {
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
        return new GlobalStore(storeName, state, kvStore);
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
        return this.classState.store;
    }
    get info() {
        return this.classState.data;
    }
    set(setStateParam) {
        const newStoreStateValue = { ...setStateParam(this.classState.store) };
        const newState = { store: newStoreStateValue, data: (0, utils_1.getStoreData)(newStoreStateValue) };
        this.classState = newState;
    }
    addReducer(reducerFn) {
        if (this.reducer)
            throw new Error((0, utils_1.errorString)('This store already has a reducer function!'));
        this.reducer = reducerFn;
    }
    setWithReducer(action) {
        if (!this.reducer)
            throw new Error((0, utils_1.errorString)('No reducer function was passed using the "addReducer" method!'));
        const newState = this.reducer(this.classState.store, action);
        this.classState = { store: { ...newState }, data: (0, utils_1.getStoreData)(newState) };
    }
    deletePath(path) {
        const value = object_path_1.default.get(this.classState.store, path);
        if (!value)
            throw new Error((0, utils_1.errorString)(`Path ${path} not found within store`));
        object_path_1.default.del(this.classState.store, path);
    }
    async pushPathToDataset(path, dataset) {
        const value = object_path_1.default.get(this.classState.store, path);
        if (!value)
            throw new Error((0, utils_1.errorString)(`Path ${path} not found within store`));
        if (typeof value !== 'object')
            throw new Error((0, utils_1.errorString)(`Can only push objects or arrays! Trying to push ${typeof value}`));
        object_path_1.default.del(this.classState.store, path);
        if (!dataset)
            return apify_1.default.pushData(value);
        return dataset.pushData(value);
    }
    dump() {
        (0, utils_1.log)(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: (0, utils_1.getStoreData)({}) };
    }
    async forceSave() {
        return this.keyValueStore.setValue(this.storeName, this.classState);
    }
}
exports.default = GlobalStore;
