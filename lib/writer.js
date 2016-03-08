'use strict';
let P = require('bluebird');
let mysql = require('mysql');
let path = require('path');
// let _ = require('underscore');

let app = global.app = {};

require('./utils/appUtil')(app);

app.set('base', path.join(__dirname, '..'));
app.set('code', app.require('lib/utils/code'));
app.set('consts', app.require('lib/utils/consts'));
app.set('logger', app.require('lib/model/logger').getLogger());

let logger = app.get('logger');

(P.coroutine(function* init() {
  yield app.require('lib/model/logDB').init();
  yield app.require('lib/model/statisticDB').init();
  app.require('lib/model/queue');
}))();

process.on('SIGINT', function() {

  app.require('lib/model/queue').worker.end(function() {
    app.require('lib/utils/mysqlUtil').end(function() {
      process.exit();
    })
  });
});

process.on('uncaughtException', function(err) {
  logger.error(' Caught exception: ' + err.stack);
});
