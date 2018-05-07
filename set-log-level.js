#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */

const debug = require('debug')('niveau:set-level');
const setLevel = require('./lib/set-level');

try {
  setLevel(process.argv, err => err && error(err));
} catch (err) {
  error(err);
}

function error(err) {
  debug(err)
  console.error(err.message);
  process.exit(1);
}
