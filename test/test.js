'use strict';

let P = require('bluebird');

P.map([1, 2, 3, 4, 5], function(elem) {
    return P.delay(elem).then(function() {
      return elem;
    })
  })
  .reduce(function(total, elem) {
    return total + elem;
  }, 0)
  .then(function(res) {
    console.log(res);
  })