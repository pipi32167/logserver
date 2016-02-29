'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let mysql = require('mysql');
let app = global.app;
// let Code = app.get('code');
// let timeUtil = app.require('lib/utils/timeUtil');
let logger = app.get('logger');
let logConfig = app.require('config/log');
let client = P.promisifyAll(mysql.createPool(app.require('config/mysql')));

let exp = module.exports;

exp.query = function(sql, sqlArgs) {
  if (logConfig.mysql && logConfig.mysql.request) {
    logger.debug('[mysql query]:', sql, sqlArgs);
  }
  return client.queryAsync(sql, sqlArgs).then(function(res) {
    if (logConfig.mysql && logConfig.mysql.response) {
      logger.debug('[mysql result]:', res);
    }
    return res;
  });
}

exp.exec = function(sql) {
  return exp.query(sql, []);
}