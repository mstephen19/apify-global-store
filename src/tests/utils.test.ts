import { errorString, getStoreData, validateName } from '../utils';

import { CURRENT_VERSION } from '../constants';

describe('errorString', () => {
    it('Should return a string', () => {
        const string = errorString('Test');
        expect(typeof string).toBe('string');
    });

    it('Should include "[GLOBAL STORE ERROR]"', () => {
        const string = errorString('Test');
        expect(string).toContain('[GLOBAL STORE ERROR]');
    });

    it('Should include the message provided', () => {
        const string = errorString('Test');
        expect(string).toContain('Test');
    });
});

describe('getStoreData', () => {
    it('Should return the correct byte number value', () => {
        const data = getStoreData({ hello: 'world' });
        expect(data).toHaveProperty('sizeInBytes', 17);
    });

    it('Should return a proper ISO string', () => {
        const data = getStoreData({ hello: 'world' });
        expect(data).toHaveProperty('lastModified');

        //@ts-ignore
        const date = new Date(data.lastModified);
        expect(date.toString().match(/invalid date/gi)).toBeFalsy();
    });

    it('Should return the proper current version', () => {
        const data = getStoreData({ hello: 'world' });
        expect(data).toHaveProperty('globalStoreVersion', CURRENT_VERSION);
    });
});

describe('validateName', () => {
    it('Should accept valid name format', () => {
        const test = validateName('my-store-name');
        expect(test).toBeFalsy();
    });

    it('Should not accept invalid name format', () => {
        const test = validateName('my+store_name');
        expect(test).toBeTruthy();
    });
});
