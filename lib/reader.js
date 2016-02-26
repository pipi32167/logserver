'use strict';
let path = require('path');
let P = require('bluebird');
let mysql = require('mysql');
// let _ = require('underscore');
let koa = require('koa');
let router = require('koa-router')();
let bodyParser = require('koa-body-parser');

let app = global.app = koa();

require('./utils/appUtil')(app);

app.set('base', path.join(__dirname, '..'));
app.set('code', app.require('lib/utils/code'));
app.set('consts', app.require('lib/utils/consts'));
app.set('logger', app.require('lib/model/logger').getLogger());

let logger = app.get('logger');

app.set('DBClient', P.promisifyAll(mysql.createPool(app.require('config/mysql.json'))));

(P.coroutine(function* init() {
  yield app.require('lib/model/logDB').init();
  yield app.require('lib/model/statisticDB').init();
}))();

app.require('lib/routes')(router);

app.require('lib/middlewares/log')(app);

app
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

let config = app.require('config/servers.json').logReader;
app.listen(config.port);
logger.info(`url: http://${config.host}:${config.port}`)