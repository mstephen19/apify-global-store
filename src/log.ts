import { color } from 'console-log-colors';
const { blueBright } = color;

export const log = (msg: string) => {
    console.log(blueBright('[GLOBAL STORE] '), msg);
};