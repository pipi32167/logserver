'use strict';
let _ = require('underscore');
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');

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
    let endTime = msg.endTime && new Date(msg.endTime).getTime() || new Date('2015-12-31').getTime();

    yield P.race(_.range(0, msg.count).map(function(elem) {

      let userId = _.random(1000001, 2000000);
      let args = {
        userId: userId,
        uid: userId.toString(),
        serverId: _.random(beginServerId, endServerId),
        type: 'test',
        time: new Date(_.random(beginTime, endTime)),
        platform: 'QFUN',
      }
      return mysqlUtil.insertData(args);
    }))
  })));

  router.post('/test/removeAllDBs', routeUtil.createRoute(P.coroutine(function*() {

    yield mysqlUtil.removeAllDBs();
  })));


}