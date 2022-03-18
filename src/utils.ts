import { color } from 'console-log-colors';

import { StoreData } from './types';

const { blueBright } = color;

export const log = (msg: string) => {
    console.log(blueBright('[GLOBAL STORE] '), msg);
};

export const getStoreData = (obj: Record<string, unknown>): StoreData => {
    return { sizeInBytes: Buffer.byteLength(JSON.stringify(obj), 'utf-8'), lastModified: new Date().toISOString() };
};
