import { color } from 'console-log-colors';

import { StoreData } from './types';

import { CURRENT_VERSION } from './constants';

const { blueBright, red, bold, italic, greenBright, magentaBright, cyanBright } = color;

export class Logger {
    debugger: boolean;
    private storeName: string;
    private debugColor: Function;

    constructor(debug: boolean = false, storeName: string) {
        this.debugger = debug;
        this.storeName = storeName;

        const colors = [greenBright, magentaBright, cyanBright];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        this.debugColor = randomColor;
    }

    general(msg: string) {
        console.log(bold(blueBright(`[STORE: ${this.storeName}] `)), msg);
    }

    debug(msg: string) {
        if (this.debugger) console.log(italic(this.debugColor(`[DEBUG: ${this.storeName}] `)), msg);
    }
}

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
