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
let remainRate = app.require('lib/model/statisticDB/remainRate');

let exp = module.exports;

let payInfos = {};

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE TABLE IF NOT EXISTS ${STATISTIC_DB_NAME}.pay (
    date date NOT NULL,
    pay longblob NOT NULL,
    registerPay longblob NOT NULL,
    firstPay longblob NOT NULL,
    secondPay longblob NOT NULL,
    totalPrice double NOT NULL,
    totalDiamond bigint(20) NOT NULL,
    PRIMARY KEY (date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `;

  yield mysqlUtil.query(sql, []);

  sql = `SELECT * FROM ${STATISTIC_DB_NAME}.pay`;

  let results = yield mysqlUtil.query(sql, []);
  for (var i = 0; i < results.length; i++) {
    let elem = results[i];
    elem.pay = new BitSet(elem.pay);
    elem.registerPay = new BitSet(elem.registerPay);
    elem.firstPay = new BitSet(elem.firstPay);
    elem.secondPay = new BitSet(elem.secondPay);
    payInfos[elem.date] = elem;
  }
})

exp.clear = function () {
  payInfos = {};
}

exp.createPayInfo = P.coroutine(function* createPayInfo(date) {

  date = new Date(date).clearTime();

  if (payInfos[date]) {
    return payInfos[date];
  }
  let args = {
    date: date,
    pay: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
    registerPay: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
    firstPay: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
    secondPay: new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE),
    totalPrice: 0,
    totalDiamond: 0,
  };
  payInfos[date] = args;

  let sql = `INSERT INTO ${STATISTIC_DB_NAME}.pay (date, pay, registerPay, firstPay, secondPay, totalPrice, totalDiamond) VALUES(?, ?, ?, ?, ?, ?, ?)`;
  let sqlArgs = [args.date, args.pay.dehydrate(), args.registerPay.dehydrate(), args.firstPay.dehydrate(), args.secondPay.dehydrate(), args.totalPrice, args.totalDiamond];
  yield mysqlUtil.query(sql, sqlArgs);
  return args;
})

exp.queryPayInfo = P.coroutine(function* queryPayInfo(date) {
  date = new Date(date).clearTime();

  if (payInfos[date]) {
    return payInfos[date];
  }

  let sql = `SELECT * FROM ${STATISTIC_DB_NAME}.pay WHERE date = ?`;
  let sqlArgs = [date];
  let res = yield mysqlUtil.query(sql, sqlArgs);

  if (!!res && !!res[0]) {
    res = res[0];
    res.pay = new BitSet(res.pay);
    res.registerPay = new BitSet(res.registerPay);
    res.firstPay = new BitSet(res.firstPay);
    res.secondPay = new BitSet(res.secondPay);
    payInfos[res.date] = res;
    return res;
  }
  return yield exp.createPayInfo(date);
})

exp.pay = function(userId, time, price, diamond, beforePayTimes, registerTime) {

  return onebyone.addAsync(P.coroutine(function*(cb) {

    let payInfo = yield exp.queryPayInfo(time);
    let offset = userId - consts.USER_ID_BEGIN;
    payInfo.pay.set(offset, true);
    if (beforePayTimes === 0) {
      payInfo.firstPay.set(offset, true);
    }
    if (beforePayTimes === 1) {
      payInfo.secondPay.set(offset, true);
    }
    payInfo.totalPrice += price;
    payInfo.totalDiamond += diamond;

    let sql = `UPDATE ${STATISTIC_DB_NAME}.pay SET pay = ?, firstPay = ?, secondPay = ?, totalPrice = ?, totalDiamond = ? WHERE date = ?`;
    let sqlArgs = [payInfo.pay.dehydrate(), payInfo.firstPay.dehydrate(), payInfo.secondPay.dehydrate(), payInfo.totalPrice, payInfo.totalDiamond, payInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);

    payInfo = yield exp.queryPayInfo(registerTime);
    if (payInfo.registerPay.get(offset)) {
      return cb();
    }

    payInfo.registerPay.set(offset, true);
    sql = `UPDATE ${STATISTIC_DB_NAME}.pay SET registerPay = ? WHERE date = ?`;
    sqlArgs = [payInfo.registerPay.dehydrate(), payInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);
    cb();
  }))
}

exp.queryPayUserCount = P.coroutine(function* queryPayUserCount(date) {

  date = new Date(date).clearTime();

  let payInfo = yield exp.queryPayInfo(date);

  return payInfo.pay.getCardinality();
})

exp.queryFirstPayUserCount = P.coroutine(function* queryFirstPayUserCount(date) {

  date = new Date(date).clearTime();

  let payInfo = yield exp.queryPayInfo(date);

  return payInfo.firstPay.getCardinality();
})

exp.querySecondPayUserCount = P.coroutine(function* querySecondPayUserCount(date) {

  date = new Date(date).clearTime();

  let payInfo = yield exp.queryPayInfo(date);

  return payInfo.secondPay.getCardinality();
})

exp.queryPayRate = P.coroutine(function* queryPayRate(beginTime, endTime) {
  beginTime = new Date(beginTime).clearTime();
  endTime = new Date(endTime).clearTime();

  let registerCount = 0;
  let payCount = 0;
  for (let i = new Date(beginTime); i.getTime() <= endTime.getTime(); i = i.addDays(1)) {
    registerCount += yield remainRate.queryRegisterCount(i);

    let payInfo = yield exp.queryPayInfo(i);
    payCount += payInfo.registerPay.getCardinality();
  }
  console.log('queryPayRate', payCount, registerCount);
  return (payCount / registerCount).toFixed(2);
})

exp.queryPayTotal = P.coroutine(function* queryPayTotal(date) {
  date = new Date(date).clearTime();
  let payInfo = yield exp.queryPayInfo(date);
  return payInfo.totalPrice;
})

exp.queryARPU = P.coroutine(function* queryARPU(beginTime, endTime) {
  beginTime = new Date(beginTime).clearTime();
  endTime = new Date(endTime).clearTime();

  let registerCount = 0;
  let payTotal = 0;
  for (let i = new Date(beginTime); i.getTime() <= endTime.getTime(); i = i.addDays(1)) {
    registerCount += yield remainRate.queryRegisterCount(i);

    let payInfo = yield exp.queryPayInfo(i);
    payTotal += payInfo.totalPrice;
  }
  // console.log(payTotal, registerCount);
  return (payTotal / registerCount).toFixed(2);
})

exp.queryARPPU = P.coroutine(function* queryARPPU(beginTime, endTime) {
  beginTime = new Date(beginTime).clearTime();
  endTime = new Date(endTime).clearTime();

  let payTotal = 0;
  let payTotalInfo = new BitSet(consts.DEFAULT_USER_BIT_MAP_SIZE);
  for (let i = new Date(beginTime); i.getTime() <= endTime.getTime(); i = i.addDays(1)) {

    let payInfo = yield exp.queryPayInfo(i);
    payTotal += payInfo.totalPrice;
    payTotalInfo = payTotalInfo.or(payInfo.pay);
  }
  let payUserCount = payTotalInfo.getCardinality();
  console.log(payTotal, payUserCount);
  return (payTotal / payUserCount).toFixed(2);
})