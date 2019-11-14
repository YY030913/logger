'use strict'

var levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

function toString(level) {
  level = levels.indexOf(level) > 0 ? level : levels[4];
  return '"level":' + level;
}

function isStandardLevel (level) {
  if (level === Infinity) {
    return true
  }
  switch (level) {
    case 'fatal':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
    case 'trace':
      return true
    default:
      return false
  }
}

module.exports = {
  levels: levels,
  toString: toString,
  isStandardLevel: isStandardLevel
}
