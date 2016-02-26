'use strict';
// let fs = require('fs');
// let vm = require('vm');
// let path = require('path');
let cluster = require('cluster');

let config = require('./config/servers');

if (cluster.isMaster) {

  cluster.fork({
    path: './lib/writer.js',
  });

  cluster.fork({
    path: './lib/reader.js',
  });

} else {

  require(process.env.path);
}