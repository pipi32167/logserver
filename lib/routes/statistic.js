'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
// let logDB = app.require('lib/model/logDB');
let remainRate = app.require('lib/model/statisticDB/remainRate');

module.exports = function(router) {

  router.get('/statistic/queryRemainRate', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date || !msg.days) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    msg.days = parseInt(msg.days, 10);
    let res = yield remainRate.queryRemainRate(msg.date, msg.days);
    return {
      remainRate: res,
    }
  })));

}