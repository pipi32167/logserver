'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
// let logDB = app.require('lib/model/logDB');
let statisticDB = app.require('lib/model/statisticDB');

module.exports = function(router) {


  router.get('/statistic/common', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.beginTime || !msg.endTime) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    msg.beginTime = new Date(msg.beginTime).clearTime();
    msg.endTime = new Date(msg.endTime).clearTime();

    statisticDB.clearCache();
    // console.log(msg);

    let results = [];

    for (var i = new Date(msg.beginTime); i <= msg.endTime; i = i.addDays(1)) {
      let date = new Date(i);
      // console.log(date);

      let res = {
        date: date,
        loginCount: yield statisticDB.remainRate.queryLoginCount(date),
        registerCount: yield statisticDB.remainRate.queryRegisterCount(date),
        activeCount: yield statisticDB.activeCount.queryActiveCount(date),
        remain_1_day: yield statisticDB.remainRate.queryRemainRate(date, 1),
        remain_2_days: yield statisticDB.remainRate.queryRemainRate(date, 2),
        remain_6_days: yield statisticDB.remainRate.queryRemainRate(date, 6),
        payUserCount: yield statisticDB.pay.queryPayUserCount(date),
        firstPayUserCount: yield statisticDB.pay.queryFirstPayUserCount(date),
        payRate: yield statisticDB.pay.queryPayRate(new Date(msg.beginTime), date),
        payTotal: yield statisticDB.pay.queryPayTotal(date),
        ARPU: yield statisticDB.pay.queryARPU(new Date(msg.beginTime), date),
        ARPPU: yield statisticDB.pay.queryARPPU(new Date(msg.beginTime), date),
      };

      // console.log(res);

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
    let res = yield statisticDB.remainRate.queryRegisterCount(msg.date, msg.days);
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
    let res = yield statisticDB.remainRate.queryLoginCount(msg.date);
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
    let res = yield statisticDB.remainRate.queryRemainRate(msg.date, msg.days);
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
    let res = yield statisticDB.activeCount.queryActiveCount(msg.date);
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
    let res = yield statisticDB.pay.queryPayUserCount(msg.date);
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
    let res = yield statisticDB.pay.queryFirstPayUserCount(msg.date);
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
    let res = yield statisticDB.pay.querySecondPayUserCount(msg.date);
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
    let res = yield statisticDB.pay.queryPayRate(msg.beginTime, msg.endTime);
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
    let res = yield statisticDB.pay.queryPayTotal(msg.beginTime, msg.endTime);
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
    let res = yield statisticDB.pay.queryARPU(msg.beginTime, msg.endTime);
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
    let res = yield statisticDB.pay.queryARPPU(msg.beginTime, msg.endTime);
    return {
      result: res,
    }
  })));


}