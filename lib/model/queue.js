'use strict';
let P = require('bluebird');
let NR = require('node-resque');
let app = global.app;
let logger = app.get('logger');
let redisConfig = app.require('config/redis');
let logDB = app.require('lib/model/logDB');

let jobs = {
  import: function(args, cb) {
    // logger.debug('job:', args);

    P
      .try(function() {
        return logDB.insertData(args);
      })
      .then(function() {
        cb(null, true);
      })
      .catch(function(err) {
        cb(err);
      })
  }
};

let worker = new NR.worker({
  connection: redisConfig,
  queues: ['log']
}, jobs);

worker.connect(function() {
  worker.workerCleanup(); // optional: cleanup any previous improperly shutdown workers on this host 
  worker.start();
})

let scheduler = new NR.scheduler({
  connection: redisConfig
});

scheduler.connect(function() {
  scheduler.start();
});

worker.on('start', function() {
  logger.info('worker started');
});
worker.on('end', function() {
  logger.info('worker ended');
});
worker.on('cleaning_worker', function(worker, pid) {
  logger.debug('cleaning old worker ' + worker);
})
worker.on('poll', function(queue) {
  logger.debug('worker polling ' + queue);
})
worker.on('job', function(queue, job) {
  logger.debug('working job ' + queue + ' ' + JSON.stringify(job));
})
worker.on('reEnqueue', function(queue, job, plugin) {
  logger.debug('reEnqueue job (' + plugin + ') ' + queue + ' ' + JSON.stringify(job));
})
worker.on('success', function(queue, job, result) {
  logger.debug('job success ' + queue + ' ' + JSON.stringify(job) + ' >> ' + result);
})
worker.on('failure', function(queue, job, failure) {
  logger.warn('job failure ' + queue + ' ' + JSON.stringify(job) + ' >> ' + failure.stack);
})
worker.on('error', function(queue, job, error) {
  logger.warn('error ' + queue + ' ' + JSON.stringify(job) + ' >> ' + error);
})
worker.on('pause', function() {
  logger.debug('worker paused');
})

scheduler.on('start', function() {
  logger.debug('scheduler started');
})
scheduler.on('end', function() {
  logger.debug('scheduler ended');
})
scheduler.on('error', function(error) {
  logger.debug('scheduler error >> ' + error);
})
scheduler.on('poll', function() {
  logger.debug('scheduler polling');
})
scheduler.on('working_timestamp', function(timestamp) {
  logger.debug('scheduler working timestamp ' + timestamp);
})
scheduler.on('transferred_job', function(timestamp, job) {
  logger.debug('scheduler enquing job ' + timestamp + ' >> ' + JSON.stringify(job));
})