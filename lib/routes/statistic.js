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


  router.get('/statistic/common', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime).clearTime();
    msg.endTime = new Date(msg.endTime).clearTime();

    let results = [];
    for (var i = new Date(msg.beginTime); i <= msg.endTime; i = i.addDays(1)) {
      let date = new Date(i);

      let res = {
        date: date,
        loginCount: yield remainRate.queryLoginCount(date),
        registerCount: yield remainRate.queryRegisterCount(date),
        activeCount: yield activeCount.queryActiveCount(date),
        remain_1_day: yield remainRate.queryRemainRate(date, 1),
        remain_2_days: yield remainRate.queryRemainRate(date, 2),
        remain_6_days: yield remainRate.queryRemainRate(date, 6),
        payUserCount: yield pay.queryPayUserCount(date),
        firstPayUserCount: yield pay.queryFirstPayUserCount(date),
        payRate: yield pay.queryPayRate(new Date(msg.beginTime), date),
        payTotal: yield pay.queryPayTotal(date),
        ARPU: yield pay.queryARPU(new Date(msg.beginTime), date),
        ARPPU: yield pay.queryARPPU(new Date(msg.beginTime), date),
      };

      console.log(res);

      results.push(res);
    }
    return {
      results: results,
    }
  })));

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
    let res = yield remainRate.queryLoginCount(msg.date);
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

  router.get('/statistic/queryPayTotal', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime);
    msg.endTime = new Date(msg.endTime);
    let res = yield pay.queryPayTotal(msg.beginTime, msg.endTime);
    return {
      result: res,
    }
  })));


  router.get('/statistic/queryARPU', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime);
    msg.endTime = new Date(msg.endTime);
    let res = yield pay.queryARPU(msg.beginTime, msg.endTime);
    return {
      result: res,
    }
  })));

  router.get('/statistic/queryARPPU', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime);
    msg.endTime = new Date(msg.endTime);
    let res = yield pay.queryARPPU(msg.beginTime, msg.endTime);
    return {
      result: res,
    }
  })));


}