/**
 * 建库建表规则：按serverId建库，按日期建表
 */
'use strict';
let _s = require('underscore.string');
let _ = require('underscore');
let P = require('bluebird');
let onebyone = P.promisifyAll(require('onebyone')());
let app = global.app;
let Code = app.get('code');
let logger = app.get('logger');
let consts = app.get('consts');
let timeUtil = app.require('lib/utils/timeUtil');
let mysqlUtil = app.require('lib/utils/mysqlUtil');
let statisticDB = app.require('lib/model/statisticDB');
let mysqlConfig = app.require('config/mysql');
const LOG_DB_NAME_TEMPLATE = mysqlConfig.LOG_DB_NAME_TEMPLATE;
const LOG_DB_NAME_LIKE = mysqlConfig.LOG_DB_NAME_LIKE;

let exp = module.exports;

let existsDBTables = {};

exp.init = P.coroutine(function* init() {
  let sql = `show databases like '${LOG_DB_NAME_LIKE}'`;
  let dbNames = yield mysqlUtil.query(sql, []);

  dbNames = dbNames.map(function(elem) {
    return _(elem).values()[0];
  })

  // logger.debug('dbNames', dbNames);

  yield P.map(dbNames, function(dbName) {

    let sql = `use ${dbName}; show tables;`;
    return mysqlUtil.query(sql, []).then(function(res) {

      // logger.debug('res', res);

      for (let i = 0; i < res[1].length; i++) {
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
  let res = yield mysqlUtil.query(sql, []);
  res = res.length > 0;
  if (res) {
    existsDBTables[dbName] = existsDBTables[dbName] || {};
  }
})

exp.getDBName = function(serverId) {
  return _s.sprintf(LOG_DB_NAME_TEMPLATE, serverId);
}

exp.createDB = function(dbName) {
  if (existsDBTables[dbName]) {
    return P.resolve();
  }

  // logger.info('create db:', dbName);
  let sql = `CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARACTER SET utf8;`;
  return mysqlUtil.query(sql, []).then(function() {
    existsDBTables[dbName] = existsDBTables[dbName] || {};
  });
}

exp.isTableExists = P.coroutine(function* isTableExists(dbName, tableName) {
  if (existsDBTables[dbName] && existsDBTables[dbName][tableName]) {
    return true;
  }

  // logger.info('create table:', dbName, tableName);
  let sql = `USE ${dbName}; SHOW TABLES LIKE '${tableName}';`;
  let res = yield mysqlUtil.query(sql, []);
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
  USE ${dbName};
  CREATE TABLE IF NOT EXISTS ${tableName} (
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

  return mysqlUtil.query(sql, []);
}

let tryCreateDBTableImpl = P.coroutine(function* tryCreateDBTableImpl(dbName, tableName) {

  let res = yield exp.isDBExists(dbName);
  if (!res) {
    yield exp.createDB(dbName);
  }

  res = yield exp.isTableExists(dbName, tableName);
  if (!res) {
    yield exp.createTable(dbName, tableName);
  }
})

exp.tryCreateDBTable = function(dbName, tableName) {
  return onebyone.addAsync(function(cb) {
    tryCreateDBTableImpl(dbName, tableName).then(function() {
      cb();
    });
  })
}

exp.insertData = P.coroutine(function* insertData(args) {
  if (args.type === consts.LogType.ONLINE) {
    return yield statisticDB.onlineCount.insertData(args);
  }
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
  let tableName = exp.getTableName(args.time);
  yield exp.tryCreateDBTable(dbName, tableName);

  let sql = `INSERT INTO ${dbName}.${tableName} (userId, uid, serverId, type, time, platform, detail) VALUES(?, ?, ?, ?, ?, ?, ?)`;
  let sqlArgs = [args.userId, args.uid, args.serverId, args.type, new Date(args.time), args.platform, JSON.stringify(args)];

  yield mysqlUtil.query(sql, sqlArgs);

  yield statisticDB.handle(args);
})

let queryDataImpl = P.coroutine(function* queryDataImpl(args, queryCreator) {

  if (!args.serverId) {
    throw Code.MSG_RESULT_PARAM_ERROR;
  }

  let beginTime = args.beginTime && new Date(args.beginTime) || new Date('2001-01-01');
  let endTime = args.endTime && new Date(args.endTime).addDays(1) || new Date('2037-01-01');

  let queries = [];

  for (let i = new Date(beginTime); i < endTime; i = i.addDays(1)) {

    // logger.debug('queryData', i);

    let dbName = exp.getDBName(args.serverId);
    let tableName = exp.getTableName(i);
    if (!existsDBTables[dbName]) {
      break;
    }
    if (!existsDBTables[dbName][tableName]) {
      continue;
    }

    queries.push(queryCreator(args, dbName, tableName, beginTime, endTime));
  }

  logger.debug('queryData', queries);

  return yield P
    .map(queries, function(elem) {
      return mysqlUtil.query(elem.sql, elem.sqlArgs);
    })
    .reduce(function(total, elem) {
      return total.concat(elem);
    }, []);
})

exp.queryDataCount = P.coroutine(function* queryDataCount(args) {

  let res = yield queryDataImpl(args, function(args, dbName, tableName, beginTime, endTime) {

    let sqlArgs = [];
    let sql = `select count(1) as count from ${dbName}.${tableName} where time >= ? and time <= ?`;
    sqlArgs.push(beginTime);
    sqlArgs.push(endTime);

    ['userId', 'uid', 'platform', 'type'].forEach(function(elem) {
      if (args[elem]) {
        sql += ` and ${elem} = ? `;
        sqlArgs.push(args[elem]);
      }
    });

    return {
      sql: sql,
      sqlArgs: sqlArgs,
    };
  });

  return _.reduce(res, function(total, elem) {
    return elem.count + total;
  }, 0);
})

exp.queryData = P.coroutine(function* queryData(args) {

  let res = yield queryDataImpl(args, function(args, dbName, tableName, beginTime, endTime) {

    let sqlArgs = [];
    let sql = `SELECT detail FROM ${dbName}.${tableName} WHERE time >= ? AND time <= ?`;
    sqlArgs.push(beginTime);
    sqlArgs.push(endTime);

    ['userId', 'uid', 'platform', 'type'].forEach(function(elem) {
      if (args[elem]) {
        sql += ` and ${elem} = ? `;
        sqlArgs.push(args[elem]);
      }
    });

    return {
      sql: sql,
      sqlArgs: sqlArgs,
    };
  })

  // logger.debug('queryData', queries);
  return _.reduce(res, function(total, elem) {
    return total.concat(elem);
  }, []);
})

exp.removeAllDBs = P.coroutine(function* removeAllDBs() {
  let dbNames = _(existsDBTables).keys();

  yield P.map(dbNames, function(elem) {
    let sql = `drop database if exists ${elem};`;
    return mysqlUtil.query(sql, []);
  });
  existsDBTables = {};
})