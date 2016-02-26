'use strict';
let _s = require('underscore.string');
let _ = require('underscore');
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let logger = app.get('logger');
let mysqlConfig = app.require('config/mysql');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE DATABASE IF NOT EXISTS ${STATISTIC_DB_NAME};
  USE ${STATISTIC_DB_NAME};
  CREATE TABLE IF NOT EXISTS user (
    userId bigint(20) unsigned NOT NULL,
    registerDate datetime NOT NULL,
    login bigint(20) NOT NULL,
    PRIMARY KEY (userId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `
  yield mysqlUtil.query(sql, []);
  // logger.debug('existsDBTables', existsDBTables);
})