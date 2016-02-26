'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let routeUtil = app.require('lib/utils/routeUtil');
let logDB = app.require('lib/model/logDB');

module.exports = function(router) {

  router.get('/log/query', routeUtil.createRoute(P.coroutine(function*() {
    return {
      results: yield logDB.queryData(this.request.body),
    }
  })));

  router.get('/log/queryCount', routeUtil.createRoute(P.coroutine(function*() {
    return {
      count: yield logDB.queryDataCount(this.request.body),
    }
  })));

  router.post('/log/insert', routeUtil.createRoute(P.coroutine(function*() {

    yield logDB.insertData(this.request.body);
  })));


}