'use strict'

const os = require('os')
const fs = require('fs')
const { EventEmitter } = require('events');

const chalk = require('chalk')
const _ = require('lodash')
const SonicBoom = require('sonic-boom')
const stringifySafe = require('fast-safe-stringify')

const levels = require('./lib/levels')
const tools = require('./lib/tools')

// ### Modifiers

// - `reset`
// - `bold`
// - `dim`
// - `italic` *(Not widely supported)*
// - `underline`
// - `inverse`
// - `hidden`
// - `strikethrough` *(Not widely supported)*
// - `visible` (Text is emitted only if enabled)



// ### Colors

// - `black`
// - `red`
// - `green`
// - `yellow`
// - `blue` *(On Windows the bright version is used since normal blue is illegible)*
// - `magenta`
// - `cyan`
// - `white`
// - `gray` ("bright black")
// - `redBright`
// - `greenBright`
// - `yellowBright`
// - `blueBright`
// - `magentaBright`
// - `cyanBright`
// - `whiteBright`

// ### Background colors

// - `bgBlack`
// - `bgRed`
// - `bgGreen`
// - `bgYellow`
// - `bgBlue`
// - `bgMagenta`
// - `bgCyan`
// - `bgWhite`
// - `bgBlackBright`
// - `bgRedBright`
// - `bgGreenBright`
// - `bgYellowBright`
// - `bgBlueBright`
// - `bgMagentaBright`
// - `bgCyanBright`
// - `bgWhiteBright`


const defaultOptions = {
    level: 'info',
    name: undefined
}

const normalize = tools.createArgsNormalizer(defaultOptions)

const levelChalkColor = {
    'fatal': 'red.bold.bgYellowBright',
    'error': 'red.bold.bgCyan',
    'warn': 'yellowBright.bold.bgCyan',
    'info': 'green.bold.bgYellowBright',
    'debug': 'cyanBright.bold.bgBlackBright',
    'trace': 'magenta.bold.bgYellowBright'
}

// this.colors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "redBright", "greenBright", "yellowBright", "blueBright", "magentaBright", "cyanBright", "whiteBright"];
// this.bgColors = ["bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite", "bgBlackBright", "bgRedBright", "bgGreenBright", "bgYellowBright", "bgBlueBright", "bgMagentaBright", "bgCyanBright", "bgWhiteBright"];
// this.modifiers = ["reset", "bold", "dim", "italic", "underline", "inverse", "hidden", "strikethrough", "visible"]
//  this.timePrefix = chalk.green("Time: ");
// this.levelPrefix = chalk.magenta.bold.bgWhite("Time: ");
const version = require('./package.json').version;

let instance = Object.create({});

const stringify = function(obj) {
    try {
        return JSON.stringify(obj)
    } catch (_) {
        return stringifySafe(obj)
    }
}
let logger = function(...args) {
    const { opts, stream } = normalize(...args)
    instance.stream = stream
    return instance;
}

levels.levels.forEach(function(m) {
    Object.defineProperty(instance, m, {
        value: tools.genLog(m),
        enumerable: true,
        writable: true
    })
})

instance.version = version;


instance.flush = function() {
    if ('flush' in this.stream) this.stream.flush()
}

instance.time = function() {
    return (new Date()).toLocaleString();
}
instance.asObj = function(msg, level, time) {
    let obj = {
        sys: {
            pid: process.pid,
            execPath: process.execPath,
            hostname: os.hostname(),
            platform: os.platform()
        }
    }
    // to catch both null and undefined
    if (msg) {
        if (msg instanceof Error) {
            obj.err = {
                message: msg.message,
                stack: msg.stack
            }
        } else {
            obj.msg = stringify(msg);
        }
    }
    obj.time = time;
    obj.level = level;
    return obj
}
instance.prettyShow = function(obj) {
    let isTTY = this.stream.isTTY;
    let err = "";
    if (obj.err) {
        err = Object.keys(obj.err).reduce(function(o, k) {
            o += "\t" + (isTTY ? chalk.red.bold.bgCyan(k + " : ") : (k + " : ")) + (isTTY ? chalk.red(obj.err[k]) : obj.err[k]) + "\r\n";
            return o;
        }, "")
        err = (isTTY ? chalk.red.bold.bgCyan("Error : ") : "Error : ") + "\r\n" + err + "\r\n";
    }

    let msg = obj.msg ? (((isTTY ? chalk.green("Msg : ") : "Msg : ") + obj.msg) + "\r\n") : "";
    let time = (isTTY ? chalk.green("Time : ") : "Time : ") + obj.time + "\r\n";
    let level = (isTTY ? chalk.magenta.bold.bgWhite("Level : ") : "Level : ") + (isTTY ? (_.get(chalk, _.get(levelChalkColor, obj.level)))(obj.level) : obj.level) + "\r\n";
    let sys = stringify(obj.sys) + "\r\n";

    return sys + (err ? "" : level) + err + msg + time;
}
instance.write = function(msg, level) {
    var obj = this.asObj(msg, level, this.time())
    this.stream.write(this.prettyShow(obj))
}

module.exports = logger