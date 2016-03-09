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
let mysqlConfig = app.require('config/mysql');
let logDB = app.require('lib/model/logDB');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

let remainRate = exp.remainRate = app.require('lib/model/statisticDB/remainRate');
let activeCount = exp.activeCount = app.require('lib/model/statisticDB/activeCount');
let pay = exp.pay = app.require('lib/model/statisticDB/pay');
let onlineCount = exp.onlineCount = app.require('lib/model/statisticDB/onlineCount');

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

    onlineCount.init(),
  ]);

});

let handlers = {};

handlers[consts.LogType.REGISTER] = P.coroutine(function* handleRegister(args) {

  yield remainRate.register(args.userId, args.time);

  yield handlers[consts.LogType.LOGIN](args); //注册也处理一下登录，避免维护时用户流失没有统计
});

handlers[consts.LogType.LOGIN] = P.coroutine(function* handleLogin(args) {

  yield remainRate.login(args.userId, args.time);

  yield activeCount.login(args.userId, args.time);
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

exp.clearCache = function() {
  remainRate.clear();
  activeCount.clear();
  pay.clear();
}

exp.removeDB = function() {

  remainRate.clear();

  let sql = `DROP DATABASE IF EXISTS ${STATISTIC_DB_NAME};`
  return mysqlUtil.query(sql, []);
}

exp.repairDB = P.coroutine(function* repairDB(serverId) {

  yield exp.removeDB();

  yield exp.init();

  let datas = yield logDB.queryData({
    beginTime: new Date('2016-01-01'),
    endTime: new Date('2037-01-01'),
    type: [consts.LogType.REGISTER],
    serverId: serverId,
  });

  // logger.debug('repairDB len:', datas.length)
  yield P.each(datas, function(elem) {
    return exp.handle(JSON.parse(elem.detail));
  });
})