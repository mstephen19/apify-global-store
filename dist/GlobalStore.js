"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const object_path_1 = (0, tslib_1.__importDefault)(require("object-path"));
const log_1 = require("./log");
const usedNames = new Set();
class GlobalStore {
    constructor(customName) {
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
        this.classState = { store: {} };
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }
        this.storeName = (customName === null || customName === void 0 ? void 0 : customName.toUpperCase()) || 'GLOBAL-STORE';
        if (usedNames.has(this.storeName.toUpperCase()))
            throw new Error(`Can only use the name "${this.storeName}" for one global store!`);
        usedNames.add(this.storeName);
        this.reducer = null;
        apify_1.default.events.on('persistState', () => {
            (0, log_1.log)('Persisting store...');
            return apify_1.default.setValue(this.storeName, this.classState);
        });
        apify_1.default.events.on('migrating', () => {
            (0, log_1.log)('Handling migration...');
            return apify_1.default.setValue(this.storeName, this.classState);
        });
    }
    async initialize(initialState) {
        const data = await apify_1.default.getValue(this.storeName);
        if (!!data)
            this.classState = data;
        if (!data)
            this.classState = { store: { ...initialState } };
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
}
exports.default = GlobalStore;
