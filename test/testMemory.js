var arr = [];

setInterval(function() {
  console.log('test', arr.length);
  var buf = new Buffer(1024 * 1024 * 200);
  buf.fill(0);
  arr.push(buf.toString());
}, 1000);