'use strict';
let P = require('bluebird');
let app = global.app;
let Code = app.get('code');
let logger = app.get('logger');

let exp = module.exports;

exp.createRoute = function(route) {
  return P.coroutine(function*() {
    let self = this;

    logger.debug(`[http request]: ${this.method} ${this.url} - `, this.request.body);
    this.body = yield P
      .try(function() {
        return route.call(self);
      })
      .then(function(resp) {
        resp = resp || {};
        resp.code = Code.MSG_SUCCESS;
        return resp;
      })
      .catch(function(err) {
        if (typeof err === 'number') {
          return {
            code: err
          }
        } else {
          logger.error('[route error]:', err.stack || err);
          return {
            code: Code.MSG_RESULT_UNKNOWN_ERROR
          };
        }
      });
    logger.debug(`[http response]: ${self.method} ${self.url} - `, self.body);
  });
}