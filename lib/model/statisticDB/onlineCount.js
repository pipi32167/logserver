/**
 * 在线人数
 */
'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let onebyone = P.promisifyAll(require('onebyone')());
let BitSet = require('qf-fast-bitset');
let app = global.app;
let Code = app.get('code');
let consts = app.get('consts');
// let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let logger = app.get('logger');
let mysqlConfig = app.require('config/mysql');
const STATISTIC_DB_NAME = mysqlConfig.STATISTIC_DB_NAME;

let exp = module.exports;

let onlineCountInfos = {};

exp.init = P.coroutine(function* init() {

  let sql = `
  CREATE TABLE IF NOT EXISTS ${STATISTIC_DB_NAME}.onlineCount (
    serverId int(10) NOT NULL,
    date date NOT NULL,
    onlineCount longblob NOT NULL,
    PRIMARY KEY (serverId, date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
  `;

  yield mysqlUtil.query(sql, []);

  sql = `SELECT * FROM ${STATISTIC_DB_NAME}.onlineCount`;

  let results = yield mysqlUtil.query(sql, []);
  for (var i = 0; i < results.length; i++) {
    let elem = results[i];
    elem.onlineCount = JSON.parse(elem.onlineCount);
    onlineCountInfos[elem.serverId] = onlineCountInfos[elem.serverId] || {};
    onlineCountInfos[elem.serverId][elem.date] = elem;
  }
})

exp.clear = function() {
  onlineCountInfos = {};
}

exp.createOnlineCountInfo = P.coroutine(function* createOnlineCountInfo(serverId, date) {

  date = new Date(date).clearTime();

  if (onlineCountInfos[serverId] && onlineCountInfos[serverId][date]) {
    return onlineCountInfos[serverId][date];
  }
  // console.log('test1');
  let args = {
    serverId: serverId,
    date: date,
    onlineCount: [],
  };
  onlineCountInfos[serverId] = onlineCountInfos[serverId] || {};
  onlineCountInfos[serverId][date] = args;

  let sql = `INSERT INTO ${STATISTIC_DB_NAME}.onlineCount (serverId, date, onlineCount) VALUES(?, ?, ?)`;
  let sqlArgs = [args.serverId, args.date, JSON.stringify(args.onlineCount)];
  yield mysqlUtil.query(sql, sqlArgs);
  return args;
})


exp.queryOnlineCountInfo = P.coroutine(function* queryOnlineCountInfo(serverId, date) {
  // console.log('queryOnlineCountInfo', date);
  date = new Date(date).clearTime();

  if (onlineCountInfos[serverId] && onlineCountInfos[serverId][date]) {
    return onlineCountInfos[serverId][date];
  }

  let sql = `SELECT * FROM ${STATISTIC_DB_NAME}.onlineCount WHERE serverId = ? and date = ?`;
  let sqlArgs = [serverId, date];
  let res = yield mysqlUtil.query(sql, sqlArgs);

  if (!!res && !!res[0]) {
    res = res[0];
    // console.log('test2');
    res.onlineCount = JSON.parse(res.onlineCount);
    onlineCountInfos[serverId] = onlineCountInfos[serverId] || {};
    onlineCountInfos[serverId][date] = res;
    return res;
  }
  return yield exp.createOnlineCountInfo(serverId, date);
})

exp.insertData = function(serverId, time, onlineCount) {

  if (arguments.length === 1) {
    let args = serverId;
    logger.debug('insertData:', args);
    if (!args.serverId ||
      !args.time ||
      args.onlineCount === undefined) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    serverId = args.serverId;
    time = args.time;
    onlineCount = args.onlineCount;
  }

  return onebyone.addAsync(P.coroutine(function*(cb) {

    let onlineCountInfo = yield exp.queryOnlineCountInfo(serverId, time);
    onlineCountInfo.onlineCount.push([new Date(time).getTime(), onlineCount]);

    let sql = `UPDATE ${STATISTIC_DB_NAME}.onlineCount SET onlineCount = ? WHERE serverId = ? and date = ?`;
    let sqlArgs = [JSON.stringify(onlineCountInfo.onlineCount), onlineCountInfo.serverId, onlineCountInfo.date];
    yield mysqlUtil.query(sql, sqlArgs);
    cb();
  }))
}

exp.queryOnlineCount = P.coroutine(function* queryRemainRate(beginTime, endTime) {
  beginTime = new Date(beginTime);
  endTime = new Date(endTime);

  let sql = `SELECT serverId, onlineCount FROM ${STATISTIC_DB_NAME}.onlineCount WHERE date >= ? and date <= ?`;
  let sqlArgs = [beginTime, endTime];

  let results = yield mysqlUtil.query(sql, sqlArgs);
  let res = {};
  for (let i = 0; i < results.length; i++) {
    let elem = results[i];
    elem.onlineCount = JSON.parse(elem.onlineCount);
    logger.debug(elem);
    res[elem.serverId] = res[elem.serverId] || [];
    res[elem.serverId] = res[elem.serverId].concat(elem.onlineCount);
  }
  return res;

})