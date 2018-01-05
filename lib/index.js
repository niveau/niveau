'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const debug = require('debug')('niveau');

const match = require('./request-match');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');
const ConfigStore = require('./ConfigStore');

module.exports = function create(options) {
  let logConfig;
  options = options || readRedisOptions();
  _.defaults(options, { redisKey: LOG_CONFIG_KEY });

  let store = new ConfigStore(options);
  store.on('config', config => {
    logConfig = config;
    try {
      if (logConfig && logConfig.request) {
        const re = logConfig.request;
        if (re.url) re.url = RegExp(re.url);
        if (re.ip) re.ip = RegExp(re.ip);
        if (re.headers) re.headers = _.mapValues(re.headers, RegExp);
      }
    } catch (e) {
      console.error('Failed to parse log config', e);
    }
  });

  function middleware(req, res, next) {
    if (logConfig && logConfig.request && match(req, logConfig.request)) {
      debug('Request matched');
      req.logLevel = logConfig.level;
      store.emit('request', req, logConfig);
    }
    next();
  }

  middleware.on = store.on.bind(store);
  middleware.once = store.once.bind(store);
  
  return middleware;
};
