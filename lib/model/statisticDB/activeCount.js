/**
 * 活跃人数
 */
'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let app = global.app;
// let Code = app.get('code');
let consts = app.get('consts');
// let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let logger = app.get('logger');
let mysqlConfig = app.require('config/mysql');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE TABLE IF NOT EXISTS ${STATISTIC_DB_NAME}.activeCount (
    loginDate date NOT NULL,
    active longblob NOT NULL,
    PRIMARY KEY (loginDate)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `;

  yield mysqlUtil.query(sql, []);
})