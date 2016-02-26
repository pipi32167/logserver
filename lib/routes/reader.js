'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');

module.exports = function(router) {

  router.get('/data/query', routeUtil.createRoute(P.coroutine(function*() {
    return {
      results: yield mysqlUtil.queryData(this.request.body),
    }
  })));

  router.post('/exec', routeUtil.createRoute(P.coroutine(function*() {

    let msg = this.request.body;
    if (!msg.sql) {
      throw Code.MSG_RESULT_PARAM_ERROR;
    }

    return {
      result: yield mysqlUtil.exec(msg.sql)
    };
  })));

  router.post('/data/insert', routeUtil.createRoute(P.coroutine(function*() {

    yield mysqlUtil.insertData(this.request.body);
  })));


}