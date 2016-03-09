'use strict';
let BitSet = require('fast-bitset');
let bs = new BitSet('2147483646,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,2147483647,0,9999999');
console.log(bs.getCardinality());

let res = bs.get(899);

console.log(res);

res = bs.set(899, true);

console.log(res);

res = bs.get(899);

console.log(res);

console.log(bs.getCardinality());