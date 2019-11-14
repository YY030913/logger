'use strict'

var util = require('util')
const SonicBoom = require('sonic-boom')

function copy(a, b) {
    for (var k in b) { a[k] = b[k] }
    return a
}

function streamIsBlockable(s) {
    if (s.hasOwnProperty('_handle') && s._handle.hasOwnProperty('fd') && s._handle.fd) return true
    if (s.hasOwnProperty('fd') && s.fd) return true
    return false
}

// SonicBoom buffer 为0且sync时 速度远低于 fs.createWriteStream
// 当write输出的内容 < buffer大小时，需要用flush输出
// 当数据内容很少时，buffer意义不大
// logger 作用是调试，内容并不会非常多
function buildSafeSonicBoom(dest, buffer = 0, sync = true) {
    const stream = new SonicBoom(dest, buffer, sync)
    stream.on('error', filterBrokenPipe)
    return stream

    function filterBrokenPipe(err) {
        // TODO verify on Windows
        if (err.code === 'EPIPE') {
            // If we get EPIPE, we should stop logging here
            // however we have no control to the consumer of
            // SonicBoom, so we just overwrite the write method
            stream.write = function() {

            }
            stream.end = function() {

            }
            stream.flushSync = function() {

            }
            stream.destroy = function() {

            }
            return
        }
        stream.removeListener('error', filterBrokenPipe)
        stream.emit('error', err)
    }
}



function createArgsNormalizer(defaultOptions) {
    return function normalizeArgs(opts = {}, stream) {
        // support stream as a string
        if (typeof opts === 'string') {
            stream = buildSafeSonicBoom(opts)
            opts = {}
        } else if (typeof stream === 'string') {
            stream = buildSafeSonicBoom(stream)
        } else if (opts instanceof SonicBoom || opts.writable || opts._writableState) {
            stream = opts
            opts = null
        }
        opts = Object.assign({}, defaultOptions, opts)

        stream = stream || process.stdout
        if (stream === process.stdout && stream.fd >= 0) {
            stream = buildSafeSonicBoom(stream.fd)
            stream.isTTY = true;
        }
        return { opts, stream }
    }
}


function genLog(level) {
    return function LOG(msg) {
        if (typeof msg != 'object' && typeof msg != 'string') {
            throw Error('invalid type msg; must object or string')
        }
        this.write(msg, level)
    }
}

module.exports = {
    copy: copy,
    createArgsNormalizer,
    streamIsBlockable: streamIsBlockable,
    genLog: genLog
}