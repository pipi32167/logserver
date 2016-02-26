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

// let logger = app.get('logger');

app.set('DBClient', P.promisifyAll(mysql.createPool(app.require('config/mysql.json'))));

(P.coroutine(function* init() {
  yield app.require('lib/model/logDB').init();
  yield app.require('lib/model/statisticDB').init();
  app.require('lib/model/queue');
}))();
