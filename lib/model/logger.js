'use strict';
require('cliff');
let assert = require('assert');
let fs = require('fs');
let path = require('path');
let app = global.app;
let config = app.require('config/log');
let timeUtil = app.require('lib/utils/timeUtil');

let Logger = function(opt) {
  this.opt = opt || {};
  this.config = config;
  this.__logger = {
    info: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.log.bind(console),
  };
  // this.__logger = log4js.getLogger('robot');

  let self = this;
  let timeoutCb = function() {
    self.config = JSON.parse(fs.readFileSync(app.resolve('config/log.json'), 'utf8'));
    setTimeout(timeoutCb, self.config.reloadSeconds * 1000);
  };
  setTimeout(timeoutCb, this.config.reloadSeconds * 1000);
}

Logger.prototype.info = function() {
  if (!this.config.info) {
    return;
  };
  this.__logger.info.apply(this.__logger, [['[' + timeUtil.format() + ']', '[INFO]:'].join(' ').green].concat(Array.prototype.slice.call(arguments, 0)));
}

Logger.prototype.warn = function() {
  if (!this.config.warn) {
    return;
  };
  this.__logger.warn.apply(this.__logger, [['[' + timeUtil.format() + ']', '[WARN]:'].join(' ').yellow].concat(Array.prototype.slice.call(arguments, 0)));
}

Logger.prototype.error = function() {
  if (!this.config.error) {
    return;
  };
  this.__logger.error.apply(this.__logger, [['[' + timeUtil.format() + ']', '[ERROR]:'].join(' ').red].concat(Array.prototype.slice.call(arguments, 0)));
}

Logger.prototype.debug = function() {
  if (!this.config.debug) {
    return;
  };
  this.__logger.debug.apply(this.__logger, [['[' + timeUtil.format() + ']', '[DEBUG]:'].join(' ').cyan].concat(Array.prototype.slice.call(arguments, 0)));
}

let logger = new Logger();

module.exports.getLogger = function(outerLogger) {
  logger.__logger = outerLogger || logger.__logger;
  assert.ok(!!logger.__logger);
  return logger;
}