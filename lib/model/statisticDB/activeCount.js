/**
 * 活跃人数
 */
'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let onebyone = P.promisifyAll(require('onebyone')());
let BitSet = require('fast-bitset');
let app = global.app;
// let Code = app.get('code');
let consts = app.get('consts');
// let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let logger = app.get('logger');
let mysqlConfig = app.require('config/mysql');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

let activeCountInfos = {};

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE TABLE IF NOT EXISTS ${STATISTIC_DB_NAME}.activeCount (
    date date NOT NULL,
    active longblob NOT NULL,
    PRIMARY KEY (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `;

  yield mysqlUtil.query(sql, []);
})

exp.clear = function() {
  activeCountInfos = {};
}

exp.createActiveCountInfo = P.coroutine(function* createActiveCountInfo(date) {

  date = new Date(date).clearTime();

  if (activeCountInfos[date]) {
    return activeCountInfos[date];
  }
  let args = {
    date: date,
    active: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
  };
  activeCountInfos[date] = args;

  let sql = `INSERT INTO ${STATISTIC_DB_NAME}.activeCount (date, active) VALUES(?, ?)`;
  let sqlArgs = [args.date, args.active.dehydrate()];
  yield mysqlUtil.query(sql, sqlArgs);
  return args;
})

exp.queryActiveCountInfo = P.coroutine(function* queryActiveCountInfo(date) {
  date = new Date(date).clearTime();

  if (activeCountInfos[date]) {
    return activeCountInfos[date];
  }

  let sql = `SELECT * FROM ${STATISTIC_DB_NAME}.activeCount WHERE date = ?`;
  let sqlArgs = [date];
  let res = yield mysqlUtil.query(sql, sqlArgs);

  if (!!res && !!res[0]) {
    res = res[0];
    res.active = new BitSet(res.active);
    activeCountInfos[res.date] = res;
    return res;
  }
  return yield exp.createActiveCountInfo(date);
})

exp.login = function(userId, time) {

  return onebyone.addAsync(P.coroutine(function*(cb) {

    let remainInfo = yield exp.queryActiveCountInfo(time);
    let offset = userId - consts.USER_ID_BEGIN;
    if (remainInfo.active.get(offset)) {
      return cb();
    }
    remainInfo.active.set(offset, true);

    let sql = `UPDATE ${STATISTIC_DB_NAME}.activeCount SET active = ? WHERE date = ?`;
    let sqlArgs = [remainInfo.active.dehydrate(), remainInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);
    cb();
  }))
}


exp.queryActiveCount = P.coroutine(function* queryActiveCount(date) {

  date = new Date(date).clearTime();

  let activeCountInfo = yield exp.queryActiveCountInfo(date);

  return activeCountInfo.active.getCardinality();
})