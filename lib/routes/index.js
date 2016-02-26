'use strict';
let app = global.app;
let fsUtil = app.require('lib/utils/fsUtil');
let Code = app.get('code');
// let routeUtil = app.require('lib/utils/routeUtil');

module.exports = function(router) {

  router.get('/', function*(next) {

    yield this.body = {
      code: Code.MSG_SUCCESS
    };
  });

  let files = fsUtil.readdirpSync(__dirname);
  // logger.debug(files);
  files.forEach(function(elem) {
    if (!/\.js$/.test(elem) ||
      /index.js$/.test(elem)) {
      return;
    }

    // logger.debug(elem);
    require(elem)(router);
  });

}