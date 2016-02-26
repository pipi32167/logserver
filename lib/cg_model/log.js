'use strict';

let CGModel = require('cg_model');
let app = global.app;
let consts = app.get('consts');

CGModel.createModel({
  name: consts.ModelName.USER,

  props: {
    username:          { type: 'string', primary: true },
    password:          { type: 'string' },
  },

  db: {
    type: 'mongodb',
    db_name: 'backend',
    coll_name: 'user',
  },

  cache: {
    type: 'none',
  },
});