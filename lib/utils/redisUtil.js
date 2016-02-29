'use strict';
// let _s = require('underscore.string');
// let _ = require('underscore');
let P = require('bluebird');
let redis = require('redis');
let app = global.app;
P.promisifyAll(redis.RedisClient.prototype);
P.promisifyAll(redis.Multi.prototype);
// let Code = app.get('code');
// let timeUtil = app.require('lib/utils/timeUtil');
let logger = app.get('logger');
let logConfig = app.require('config/log');

let redisConfig = app.require('config/redis').statistic;
let client = new redis.createClient(redisConfig.port, redisConfig.host, redisConfig);

let exp = module.exports;

exp.exec = function(cmd) {
  cmd = cmd.match(/([^\s]+)/g);
  let cmdName = cmd[0];
  let args = cmd.slice(1);
  logger.debug('[redis request]:', cmdName, args);
  return client.send_commandAsync(cmdName, args).then(function(res) {
    logger.debug('[redis result]:', res);
    return res;
  });
}