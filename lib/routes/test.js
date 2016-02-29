'use strict';
let _ = require('underscore');
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let consts = app.get('consts');
let routeUtil = app.require('lib/utils/routeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let redisUtil = app.require('lib/utils/redisUtil');
let logDB = app.require('lib/model/logDB');
let statisticDB = app.require('lib/model/statisticDB');

module.exports = function(router) {

  router.post('/test/insert', routeUtil.createRoute(P.coroutine(function*() {
    let msg = this.request.body;

    if (!msg.count) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.count = parseInt(msg.count, 10);
    let beginServerId = msg.beginServerId && parseInt(msg.beginServerId, 10) || 1001;
    let endServerId = msg.endServerId && parseInt(msg.endServerId, 10) || 1100;
    let beginTime = msg.beginTime && new Date(msg.beginTime).getTime() || new Date('2015-01-01').getTime();
    let endTime = msg.endTime && new Date(msg.endTime).getTime() || new Date(beginTime).addDays(1).addSeconds(-1);
    let type = msg.type || 'TEST';

    yield P.race(_.range(0, msg.count).map(function(elem) {

      let userId = !msg.random ? (consts.USER_ID_BEGIN + elem) : _.random(consts.USER_ID_BEGIN, consts.USER_ID_BEGIN + msg.count - 1);
      let args = _(msg).chain().clone().extend({
        userId: userId,
        uid: userId.toString(),
        serverId: _.random(beginServerId, endServerId),
        type: type,
        time: new Date(_.random(beginTime, endTime)),
        platform: 'QFUN',
      }).value();
      return logDB.insertData(args);
    }))

    // yield P.each(_.range(0, msg.count), function(elem) {

    //   let userId = _.random(1000001, 2000000);
    //   let args = {
    //     userId: userId,
    //     uid: userId.toString(),
    //     serverId: _.random(beginServerId, endServerId),
    //     type: type,
    //     time: new Date(_.random(beginTime, endTime)),
    //     platform: 'QFUN',
    //   }
    //   return logDB.insertData(args);
    // })
  })));

  router.post('/test/removeAllDBs', routeUtil.createRoute(P.coroutine(function*() {

    yield logDB.removeAllDBs();

    yield statisticDB.removeDB();
  })));

  router.post('/test/mysqlexec', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.sql) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    let res = yield mysqlUtil.exec(msg.sql);
    return {
      result: res
    };
  })));

  router.post('/test/redisexec', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.cmd) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    let res = yield redisUtil.exec(msg.cmd);
    return {
      result: res,
    };
  })));
}