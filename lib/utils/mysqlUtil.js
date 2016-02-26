'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
// let P = require('bluebird');
// let mysql = require('mysql');
let app = global.app;
// let Code = app.get('code');
// let timeUtil = app.require('lib/utils/timeUtil');
let logger = app.get('logger');

let exp = module.exports;

exp.query = function(sql, sqlArgs) {
  logger.debug('[mysql query]:', sql, sqlArgs);
  return app.get('DBClient').queryAsync(sql, sqlArgs).then(function(res) {
    logger.debug('[mysql result]:', res);
    return res;
  });
}

exp.exec = function(sql) {
  return exp.query(sql, []);
}