'use strict';
let P = require('bluebird');
let _s = require('underscore.string');
let _ = require('underscore');
let app = global.app;
let httpUtil = app.require('lib/utils/httpUtil');

const UPDATE_SERVERS_INTERVAL = 10 * 60 * 1000;

let PassportServer = function() {
  this.config = app.require('config/servers').passport;
  this.baseUrl = _s.sprintf('http://%s:%d',
    this.config.host,
    this.config.port);
  this.refreshTime = 0;
}

PassportServer.prototype.serverAll = function() {
  let url = this.baseUrl + '/server/all';

  if (this.servers && this.refreshTime > Date.now()) {
    return P.resolve(this.servers);
  }
  let self = this;
  return httpUtil.get(url, {}).then(function(res) {
    self.servers = res.servers;
    self.refreshTime = Date.now() + UPDATE_SERVERS_INTERVAL;
    return res.servers;
  });
}

PassportServer.prototype.serverAllObject = function() {
  return this.serverAll().then(function(res) {
    return _(res).chain().map(function(elem) {
      return [elem.serverId, elem];
    }).object().value();
  })
}

PassportServer.prototype.serverCreate = function(args) {
  let url = this.baseUrl + '/server/create';
  return httpUtil.put(url, args);
}

PassportServer.prototype.serverModify = function(args) {
  let url = this.baseUrl + '/server/modify';
  return httpUtil.post(url, args);
}

module.exports = new PassportServer();