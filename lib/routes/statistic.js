'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
// let logDB = app.require('lib/model/logDB');
let remainRate = app.require('lib/model/statisticDB/remainRate');
let activeCount = app.require('lib/model/statisticDB/activeCount');
let pay = app.require('lib/model/statisticDB/pay');

module.exports = function(router) {


  router.get('/statistic/queryRegisterCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield remainRate.queryRegisterCount(msg.date, msg.days);
    return {
      result: res,
    }
  })));

  router.get('/statistic/queryLoginCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield remainRate.queryLoginCount(msg.date, msg.days);
    return {
      result: res,
    }
  })));


  router.get('/statistic/queryRemainRate', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date || !msg.days) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    msg.days = parseInt(msg.days, 10);
    let res = yield remainRate.queryRemainRate(msg.date, msg.days);
    return {
      result: res,
    }
  })));

  router.get('/statistic/queryActiveCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield activeCount.queryActiveCount(msg.date);
    return {
      result: res,
    }
  })));

  router.get('/statistic/queryPayUserCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield pay.queryPayUserCount(msg.date);
    return {
      result: res,
    }
  })));

  router.get('/statistic/queryFirstPayUserCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield pay.queryFirstPayUserCount(msg.date);
    return {
      result: res,
    }
  })));

  router.get('/statistic/querySecondPayUserCount', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.date) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.date = new Date(msg.date);
    let res = yield pay.querySecondPayUserCount(msg.date);
    return {
      result: res,
    }
  })));


  router.get('/statistic/queryPayRate', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime);
    msg.endTime = new Date(msg.endTime);
    let res = yield pay.queryPayRate(msg.beginTime, msg.endTime);
    return {
      result: res,
    }
  })));
}