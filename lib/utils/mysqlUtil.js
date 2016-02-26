/**
 * 建库建表规则：按serverId建库，按日期建表
 */
'use strict';
let _s = require('underscore.string');
let _ = require('underscore');
let P = require('bluebird');
let mysql = require('mysql');
let app = global.app;
let Code = app.get('code');
let timeUtil = app.require('lib/utils/timeUtil');
let logger = app.get('logger');
let mysqlConfig = app.require('config/mysql');
const DB_NAME_TEMPLATE = mysqlConfig.DB_NAME_TEMPLATE;
const DB_NAME_LIKE = mysqlConfig.DB_NAME_LIKE;

let exp = module.exports;

let client = P.promisifyAll(mysql.createPool(app.require('config/mysql.json')));

let existsDBTables = {};


exp.query = function(sql, sqlArgs) {
  logger.debug('[mysql query]:', sql, sqlArgs);
  return client.queryAsync(sql, sqlArgs).then(function(res) {
    logger.debug('[mysql result]:', res);
    return res;
  });
}

exp.init = P.coroutine(function* init() {
  let sql = `show databases like '${DB_NAME_LIKE}'`;
  let dbNames = yield exp.query(sql, []);

  dbNames = dbNames.map(function(elem) {
    return _(elem).values()[0];
  })

  // logger.debug('dbNames', dbNames);

  yield P.map(dbNames, function(dbName) {

    let sql = `use ${dbName}; show tables;`;
    return exp.query(sql, []).then(function(res) {

      // logger.debug('res', res);

      for (var i = 0; i < res[1].length; i++) {
        let tableName = _(res[1][i]).values()[0];
        // logger.debug('tableName', tableName, res);
        existsDBTables[dbName] = existsDBTables[dbName] || {};
        existsDBTables[dbName][tableName] = true;
      }
    })
  });

  // logger.debug('existsDBTables', existsDBTables);
})

exp.isDBExists = P.coroutine(function* isDBExists(dbName) {
  if (existsDBTables[dbName]) {
    return true;
  }

  let sql = `show databases like '${dbName}'`;
  let res = yield exp.query(sql, []);
  res = res.length > 0;
  if (res) {
    existsDBTables[dbName] = existsDBTables[dbName] || {};
  }
})

exp.getDBName = function(serverId) {
  return _s.sprintf(DB_NAME_TEMPLATE, serverId);
}

exp.createDB = function(dbName) {
  if (existsDBTables[dbName]) {
    return P.resolve();
  }

  logger.info('create db:', dbName);
  let sql = `CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8;`;
  return exp.query(sql, []).then(function() {
    existsDBTables[dbName] = existsDBTables[dbName] || {};
  });
}

exp.isTableExists = P.coroutine(function* isTableExists(dbName, tableName) {
  if (existsDBTables[dbName] && existsDBTables[dbName][tableName]) {
    return true;
  }

  logger.info('create table:', dbName, tableName);
  let sql = `use ${dbName}; show tables like '${tableName}';`;
  let res = yield exp.query(sql, []);
  res = res && res[1] && res[1].length > 0;
  if (res) {
    existsDBTables[dbName] = existsDBTables[dbName] || {};
    existsDBTables[dbName][tableName] = true;
  }
})

exp.getTableName = function(date) {
  return `log_${timeUtil.format(new Date(date), 'YYYYMMDD')}`;
}

exp.createTable = function(dbName, tableName) {

  let sql = `
  CREATE TABLE IF NOT EXISTS ${dbName}.${tableName} (
    userId bigint(20) unsigned NOT NULL,
    uid varchar(255) NOT NULL DEFAULT '',
    serverId int(10) unsigned NOT NULL,
    type varchar(255) NOT NULL DEFAULT '',
    time datetime NOT NULL DEFAULT '2001-01-01 00:00:00',
    platform varchar(255) NOT NULL DEFAULT '',
    detail text NOT NULL,
    KEY userId (userId),
    KEY uid (uid),
    KEY serverId (serverId),
    KEY type (type),
    KEY time (time),
    KEY platform (platform)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  return exp.query(sql, []);
}

exp.insertData = P.coroutine(function* insertData(args) {
  if (!args.userId ||
    !args.uid ||
    !args.serverId ||
    !args.type ||
    !args.time ||
    !args.platform
  ) {
    throw Code.MSG_RESULT_PARAM_ERROR;
  }

  let dbName = exp.getDBName(args.serverId);
  let res = yield exp.isDBExists(dbName);
  if (!res) {
    yield exp.createDB(dbName);
  }

  let tableName = exp.getTableName(args.time);
  res = yield exp.isTableExists(dbName, tableName);
  if (!res) {
    yield exp.createTable(dbName, tableName);
  }

  let sql = `insert into ${dbName}.${tableName} (userId, uid, serverId, type, time, platform, detail) values(?, ?, ?, ?, ?, ?, ?)`;
  let sqlArgs = [args.userId, args.uid, args.serverId, args.type, args.time, args.platform, JSON.stringify(args)];

  return exp.query(sql, sqlArgs);
})

exp.queryData = function(args) {

  // if (!args.serverId) {
  //   expression
  // }

  // args.beginTime = args.beginTime && new Date(args.beginTime) || new Date('2015-01-01')

  // let sql = ''
}

exp.exec = function(sql) {
  return exp.query(sql, []);
}

exp.removeAllDBs = P.coroutine(function* removeAllDBs() {
  let dbNames = _(existsDBTables).keys();

  yield P.map(dbNames, function(elem) {
    let sql = `drop database if exists ${elem};`;
    return exp.query(sql, []);
  });
  existsDBTables = {};
})