'use strict';

let app = global.app;
let fsUtil = app.require('lib/utils/fsUtil');

let files = fsUtil.readdirpSync(__dirname);
// logger.debug(files);
files.forEach(function(elem) {
  if (!/\.js$/.test(elem) ||
    /index.js$/.test(elem)) {
    return;
  }

  // logger.debug(elem);
  require(elem);
});