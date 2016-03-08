'use strict';
let _ = require('underscore');
let app = global.app;
let Code = app.get('code');
let logger = app.get('logger');

module.exports = function(app) {
  app.use(function*(next) {
    var start = new Date();
    yield next;
    var ms = new Date() - start;
    logger.debug(`${this.method} ${this.url} - ${ms}`);
    if (this.body && this.body.code !== undefined) {
      this.body.codeMsg = Code.msg(this.body.code);
    }
  });
}