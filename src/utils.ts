import { color } from 'console-log-colors';

import { StoreData } from './types';

import { CURRENT_VERSION, storeTypes } from './constants';

const { blueBright, red, bold, italic, greenBright, magentaBright, cyanBright, yellowBright, whiteBright } = color;

export class Logger {
    debugger: boolean;
    private storeName: string;
    private color: Function;

    constructor(debug: boolean = false, storeName: string) {
        this.debugger = debug;
        this.storeName = storeName;

        const colors = [greenBright, magentaBright, yellowBright, whiteBright];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        this.color = randomColor;
    }

    general(msg: string) {
        console.log(bold(blueBright(`[STORE: ${italic(this.color(this.storeName))}] `)), msg);
    }

    debug(msg: string) {
        if (this.debugger) console.log(cyanBright(`[DEBUG: ${italic(this.color(this.storeName))}] `), msg);
    }
}

export const errorString = (msg: string) => {
    return `${red('[GLOBAL STORE ERROR]')} ${msg}`;
};

export const getStoreData = (obj: Record<string, unknown>, isCloud: boolean): StoreData => {
    return {
        sizeInBytes: Buffer.byteLength(JSON.stringify(obj), 'utf-8'),
        lastModified: new Date().toISOString(),
        globalStoreVersion: CURRENT_VERSION,
        type: isCloud ? storeTypes.CLOUD : storeTypes.LOCAL,
    };
};

export const validateName = (storeName: string) => {
    return storeName.match(/[`!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/);
};
