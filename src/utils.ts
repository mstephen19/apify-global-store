import { color } from 'console-log-colors';

import { StoreData } from './types';

import { CURRENT_VERSION } from './constants';

const { blueBright, red } = color;

export const log = (msg: string) => {
    console.log(blueBright('[GLOBAL STORE] '), msg);
};

export const errorString = (msg: string) => {
    return `${red('[GLOBAL STORE ERROR]')} ${msg}`;
};

export const getStoreData = (obj: Record<string, unknown>): StoreData => {
    return {
        sizeInBytes: Buffer.byteLength(JSON.stringify(obj), 'utf-8'),
        lastModified: new Date().toISOString(),
        globalStoreVersion: CURRENT_VERSION,
    };
};

export const validateName = (storeName: string) => {
    return storeName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/);
};
