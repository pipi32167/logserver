'use strict';
let P = require('bluebird');
let request = P.promisifyAll(require('request'));
let app = global.app;
let Code = app.get('code');
let logger = app.get('logger');

let exp = module.exports;

['get', 'put', 'del', 'post'].forEach(function(method) {

  exp[method] = function(url, args) {
    logger.debug('[http client request]:', method, url, args);
    return request[method + 'Async'](url, {
        form: args
      })
      .then(function(res) {
        // logger.debug('%j', res);
        if (res.statusCode !== 200) {
          logger.error('[http client request] failed:', res.statusCode, method, url, args);
          throw Code.MSG_RESULT_UNKNOWN_ERROR;
        }
        res = JSON.parse(res.body);
        logger.debug('[http client response]:', method, url, args, res);
        if (res.code !== Code.MSG_SUCCESS) {
          throw res.code;
        }
        return res;
      })
      .catch(function(err) {
        if (err instanceof(Error)) {
          logger.error('[http client request] failed:', err.stack || err, method, url, args);
          throw Code.MSG_RESULT_UNKNOWN_ERROR;
        } else {
          throw err;
        }
      });
  };
});