"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const object_path_1 = (0, tslib_1.__importDefault)(require("object-path"));
const utils_1 = require("./utils");
const utils_2 = require("./utils");
const storeInstances = {};
class GlobalStore {
    constructor(storeName, initialState) {
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
        this.classState = initialState;
        this.storeName = storeName || 'GLOBAL-STORE';
        this.reducer = null;
        apify_1.default.events.on('persistState', () => {
            (0, utils_1.log)('Persisting store...');
            return apify_1.default.setValue(this.storeName, this.classState);
        });
        storeInstances[storeName] = this;
        (0, utils_1.log)(`Store initialized with name: ${storeName}`);
    }
    static async init({ customName, initialState } = {}) {
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }
        const storeName = (customName === null || customName === void 0 ? void 0 : customName.toUpperCase()) || 'GLOBAL-STORE';
        if (storeInstances[storeName.toUpperCase()])
            throw new Error(`Can only use the name "${storeName}" for one global store!`);
        let state = { store: {}, data: {} };
        const data = await apify_1.default.getValue(storeName);
        if (!!data)
            state = data;
        if (!data)
            state = { store: { ...initialState }, data: (0, utils_2.getStoreData)(initialState || {}) };
        return new GlobalStore(storeName, state);
    }
    static summon(storeName) {
        if (!storeInstances[storeName.toUpperCase()])
            throw new Error(`Store with name ${storeName.toUpperCase()} doesn't exist!`);
        return storeInstances[storeName.toUpperCase()];
    }
    get state() {
        return this.classState.store;
    }
    get info() {
        return this.classState.data;
    }
    set(setStateParam) {
        const newStoreStateValue = { ...setStateParam(this.classState.store) };
        const newState = { store: newStoreStateValue, data: (0, utils_2.getStoreData)(newStoreStateValue) };
        this.classState = newState;
    }
    addReducer(reducerFn) {
        if (this.reducer)
            throw new Error('This store already has a reducer function!');
        this.reducer = reducerFn;
    }
    setWithReducer(action) {
        if (!this.reducer)
            throw new Error('No reducer function was passed using the "addReducer" method!');
        const newState = this.reducer(this.classState.store, action);
        this.classState = { store: { ...newState }, data: (0, utils_2.getStoreData)(newState) };
    }
    async pushPathToDataset(path, dataset) {
        let value;
        try {
            value = object_path_1.default.get(this.classState.store, path);
        }
        catch (err) {
            throw new Error(`Path ${path} not found within store: ${err}`);
        }
        object_path_1.default.del(this.classState.store, path);
        if (!dataset)
            return apify_1.default.pushData(value);
        return dataset.pushData(value);
    }
    dump() {
        (0, utils_1.log)(`Dumping entire store: ${this.storeName}`);
        this.classState = { store: {}, data: (0, utils_2.getStoreData)({}) };
    }
}
exports.default = GlobalStore;
