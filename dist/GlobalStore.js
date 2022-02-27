"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const apify_1 = (0, tslib_1.__importDefault)(require("apify"));
const log_1 = require("./log");
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
        this.classState = { store: {} };
        if (customName && customName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/)) {
            throw new Error('Custom store name must not contain illegal characters! Acceptable format is "my-store-name" or "mystorename".');
        }
        this.storeName = (customName === null || customName === void 0 ? void 0 : customName.toUpperCase()) || 'GLOBAL-STORE';
        apify_1.default.events.on('persistState', () => {
            (0, log_1.log)('Persisting global store...');
            return apify_1.default.setValue(this.storeName, this.classState);
        });
        apify_1.default.events.on('migrating', () => {
            return apify_1.default.setValue(this.storeName, this.classState);
        });
    }
    async initialize() {
        const data = await apify_1.default.getValue('GLOBAL-STORE');
        if (!!data)
            this.classState = data;
        if (!data)
            this.classState = { store: {} };
    }
    get state() {
        return this.classState.store;
    }
    setState(setStateParam) {
        const newState = { store: { ...this.classState.store, ...setStateParam(this.classState.store) } };
        this.classState = newState;
    }
}
exports.default = GlobalStore;
