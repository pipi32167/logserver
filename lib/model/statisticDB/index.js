'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let consts = app.get('consts');
// let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let logger = app.get('logger');
let remainRate = app.require('lib/model/statisticDB/remainRate');
let activeCount = app.require('lib/model/statisticDB/activeCount');
let pay = app.require('lib/model/statisticDB/pay');
let mysqlConfig = app.require('config/mysql');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE DATABASE IF NOT EXISTS ${STATISTIC_DB_NAME};
  USE ${STATISTIC_DB_NAME};`
  yield mysqlUtil.query(sql, []);
  // logger.debug('existsDBTables', existsDBTables);

  yield P.all([

    remainRate.init(),

    activeCount.init(),

    pay.init(),
  ]);

});

let handlers = {};

handlers[consts.LogType.REGISTER] = P.coroutine(function* handleRegister(args) {
  yield remainRate.register(args.userId, args.time);
})

handlers[consts.LogType.LOGIN] = P.coroutine(function* handleLogin(args) {
  yield P.all([

    remainRate.login(args.userId, args.time),

    activeCount.login(args.userId, args.time),
  ]);
})

handlers[consts.LogType.IAP] = P.coroutine(function* handleLogin(args) {
  if (!args.price || !args.diamond) {
    throw Code.MSG_RESULT_PARAM_ERROR;
  }

  args.price = parseFloat(args.price);
  args.diamond = parseInt(args.diamond, 10);
  args.beforePayTimes = parseInt(args.beforePayTimes, 10);
  args.registerTime = new Date(args.registerTime);
  yield P.all([

    pay.pay(args.userId, args.time, args.price, args.diamond, args.beforePayTimes, args.registerTime),
  ]);
})


exp.handle = P.method(function(args) {
  // console.log('handle', args, handlers[args.type]);
  if (handlers[args.type]) {
    return handlers[args.type](args);
  }
});

exp.removeDB = function() {

  remainRate.clear();

  let sql = `DROP DATABASE IF EXISTS ${STATISTIC_DB_NAME};`
  return mysqlUtil.query(sql, []);
}