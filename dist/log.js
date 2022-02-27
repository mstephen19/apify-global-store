"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const console_log_colors_1 = require("console-log-colors");
const { blueBright } = console_log_colors_1.color;
const log = (msg) => {
    console.log(blueBright('[GLOBAL STORE] '), msg);
};
exports.log = log;
