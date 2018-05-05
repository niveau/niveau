'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const debug = require('debug')('niveau');
const VError = require('verror');

const match = require('./request-match');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');
const ConfigStore = require('./config-store');

module.exports = function create(options) {
  options = options || readRedisOptions();
  _.defaults(options, { redisKey: LOG_CONFIG_KEY });

  let store = new ConfigStore(options);
  store.on('config', config => {
    try {
      if (config && config.request) {
        const re = config.request;
        if (re.url) re.url = RegExp(re.url);
        if (re.ip) re.ip = RegExp(re.ip);
        if (re.headers) re.headers = _.mapValues(re.headers, v => RegExp(v));
      }
      middleware.logConfig = config;
    } catch (e) {
      store.emit('error', new VError(e, 'Failed to parse log config'));
    }
  });

  function middleware(req, res, next) {
    let logConfig = middleware.logConfig;
    if (logConfig && match(req, logConfig.request)) {
      debug('Request matched');
      req.logLevel = logConfig.level;
      store.emit('request', req, logConfig);
    }
    next();
  }

  middleware.on = store.on.bind(store);
  middleware.once = store.once.bind(store);
  middleware.close = store.close.bind(store);

  return middleware;
};
