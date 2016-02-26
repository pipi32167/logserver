'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = function(app, gulp) {
  let settings = {};

  app.set = function(key, val) {
    settings[key] = val;
  }

  app.get = function(key) {
    return settings[key];
  }

  app.resolve = function(relativePath) {
    return path.join(app.get('base'), relativePath);
  };

  app.require = function(relativePath) {
    return require(app.resolve(relativePath));
  };

  app.getLogger = function() {

    return app.get('logger') || {
      debug: console.log,
      // debug: function () {},
      info: console.log,
      warn: console.warn,
      error: console.error,
      trace: console.trace,
    };
  };
}