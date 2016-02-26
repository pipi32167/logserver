'use strict';
let fs = require('fs');
let path = require('path');
let exp = module.exports;

exp.readdirSync = fs.readdirSync;

exp.readdirpSync = function(dirname, res) {
  res = res || [];
  let res2 = fs.readdirSync(dirname);

  for (let i = 0; i < res2.length; i++) {
    let elem = path.join(dirname, res2[i]);
    res.push(elem);
    // console.log(elem);
    if (fs.lstatSync(elem).isDirectory()) {
      exp.readdirpSync(elem, res);
    }
  }
  return res;
}