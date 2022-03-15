"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const object_path_1 = (0, tslib_1.__importDefault)(require("object-path"));
const log_1 = require("./log");
const usedNames = new Set();
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
            (0, log_1.log)('Persisting store...');
            return apify_1.default.setValue(this.storeName, this.classState);
        });
    }
    static async dropAllStores() {
        for (const name of [...usedNames]) {
            const kv = await apify_1.default.openKeyValueStore(name);
            await kv.drop();
        }
    }
    static async init(customName, initialState) {
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }
        const storeName = (customName === null || customName === void 0 ? void 0 : customName.toUpperCase()) || 'GLOBAL-STORE';
        if (usedNames.has(storeName.toUpperCase()))
            throw new Error(`Can only use the name "${storeName}" for one global store!`);
        usedNames.add(storeName);
        let state = { store: {} };
        const data = await apify_1.default.getValue(storeName);
        if (!!data)
            state = data;
        if (!data)
            state = { store: { ...initialState } };
        return new GlobalStore(storeName, state);
    }
    get state() {
        return this.classState.store;
    }
    set(setStateParam) {
        const newState = { store: { ...this.classState.store, ...setStateParam(this.classState.store) } };
        this.classState = newState;
    }
    addReducer(reducerFn) {
        this.reducer = reducerFn;
    }
    setWithReducer(action) {
        if (!this.reducer)
            throw new Error('No reducer function was passed using the "addReducer" method!');
        const newState = this.reducer(this.classState.store, action);
        this.classState = { store: { ...newState } };
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
        this.classState = { store: {} };
    }
}
exports.default = GlobalStore;
