'use strict';
let _ = require('underscore');
var NR = require('node-resque');
var redisConfig = require('../config/redis.json').log_queue;

//测试用例
var queue = new NR.queue({
  connection: redisConfig
}, {});

let singleTest = function() {

  // var date = new Date();
  var date1 = new Date('2015/5/6');
  // var date2 = new Date('2015/5/12');
  queue.enqueue('log', 'import', [{
    userId: 1000001,
    uid: '1000001',
    serverId: 1001,
    platform: 'QFUN',
    type: 'LOGIN',
    time: date1,
  }]);
}

let benchmarkTest = function() {

  let count = 5000;
  let beginServerId = 1001;
  let endServerId = 1001;
  let beginTime = new Date('2015-01-01').getTime();
  let endTime = new Date('2015-01-02').getTime();

  _.range(0, count).map(function() {

    let userId = _.random(1000001, 2000000);
    let args = {
      userId: userId,
      uid: userId.toString(),
      serverId: _.random(beginServerId, endServerId),
      type: 'test',
      time: new Date(_.random(beginTime, endTime)),
      platform: 'QFUN',
    }
    queue.enqueue('log', 'import', args);
  })

}

let onlineCountTest = function() {

  let count = 1000;
  let beginServerId = 1003;
  let endServerId = 1003;
  let beginTime = new Date('2016-02-01').getTime();
  let endTime = new Date('2016-03-01').getTime();
  let onlineCount = 1000;

  // _.range(0, count).map(function() {

  //   let args = {
  //     serverId: _.random(beginServerId, endServerId),
  //     type: 'ONLINE',
  //     time: new Date(_.random(beginTime, endTime)),
  //     onlineCount: _.random(onlineCount),
  //   }
  //   console.log(args);
  //   queue.enqueue('log', 'import', args);
  // })

  let beforeCount = _.random(onlineCount);

  for (let i = beginTime; i < endTime; i += 600 * 1000) {

    beforeCount = beforeCount + _.random(-10, 10);

    let args = {
      serverId: _.random(beginServerId, endServerId),
      type: 'ONLINE',
      time: new Date(i),
      onlineCount: beforeCount,
    }
    // console.log(args);
    queue.enqueue('log', 'import', args);
  }
}

queue.connect(function() {
  // singleTest();
  // benchmarkTest();
  onlineCountTest();
})

process.on('SIGINT', function() {

  process.exit();
});