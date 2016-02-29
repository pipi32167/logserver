/**
 * 留存
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

let remainInfos = {};

exp.init = P.coroutine(function* init() {
  let sql = `
  CREATE TABLE IF NOT EXISTS ${STATISTIC_DB_NAME}.remain (
    date date NOT NULL,
    register longblob NOT NULL,
    login longblob NOT NULL,
    PRIMARY KEY (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `
  yield mysqlUtil.query(sql, []);
});

exp.clear = function() {
  remainInfos = {};
}

exp.createRemainInfo = P.coroutine(function* createRemainInfo(date) {

  date = new Date(date).clearTime();

  if (remainInfos[date]) {
    return remainInfos[date];
  }
  // console.log('test1');
  let args = {
    date: date,
    register: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
    login: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
  };
  remainInfos[date] = args;

  let sql = `INSERT INTO ${STATISTIC_DB_NAME}.remain (date, register, login) VALUES(?, ?, ?)`;
  let sqlArgs = [args.date, args.register.dehydrate(), args.login.dehydrate()];
  yield mysqlUtil.query(sql, sqlArgs);
  return args;
})

exp.queryRemainInfo = P.coroutine(function* queryRemainInfo(date) {
  // console.log('queryRemainInfo', date);
  date = new Date(date).clearTime();

  if (remainInfos[date]) {
    return remainInfos[date];
  }

  let sql = `SELECT * FROM ${STATISTIC_DB_NAME}.remain WHERE date = ?`;
  let sqlArgs = [date];
  let res = yield mysqlUtil.query(sql, sqlArgs);

  if (!!res && !!res[0]) {
    res = res[0];
    // console.log('test2');
    res.register = new BitSet(res.register);
    res.login = new BitSet(res.login);
    remainInfos[res.date] = res;
    return res;
  }
  return yield exp.createRemainInfo(date);
})

exp.register = function(userId, time) {

  return onebyone.addAsync(P.coroutine(function*(cb) {

    let remainInfo = yield exp.queryRemainInfo(time);
    let offset = userId - consts.USER_ID_BEGIN;
    // console.log('login', offset, time, remainInfo);
    if (remainInfo.register.get(offset)) {
      return cb();
    }
    // logger.debug('register', remainInfo);

    remainInfo.register.set(offset, true);

    let sql = `UPDATE ${STATISTIC_DB_NAME}.remain SET REGISTER = ? WHERE date = ?`;
    let sqlArgs = [remainInfo.register.dehydrate(), remainInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);
    cb();
  }))
}

exp.login = function(userId, time) {

  return onebyone.addAsync(P.coroutine(function*(cb) {

    let remainInfo = yield exp.queryRemainInfo(time);
    let offset = userId - consts.USER_ID_BEGIN;
    // console.log('login', offset, time, remainInfo);
    // console.log(offset);
    if (remainInfo.login.get(offset)) {
      return cb();
    }
    remainInfo.login.set(offset, true);

    let sql = `UPDATE ${STATISTIC_DB_NAME}.remain SET login = ? WHERE date = ?`;
    let sqlArgs = [remainInfo.login.dehydrate(), remainInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);
    cb();
  }))
}


exp.queryRemainRate = P.coroutine(function* queryRemainRate(date, days) {

  date = new Date(date).clearTime();

  let remainInfo1 = yield exp.queryRemainInfo(date);
  let remainInfo2 = yield exp.queryRemainInfo(date.addDays(days));

  // console.log(remainInfos);

  let remain = remainInfo1.register.and(remainInfo2.login);

  let registerCount = remainInfo1.register.getCardinality();
  let remainCount = remain.getCardinality();
  console.log(registerCount, remainCount);
  return remainCount / registerCount;
})