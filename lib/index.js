'use strict';

/* eslint-disable no-console */

const redis = require('redis');
const _ = require('lodash');
const match = require('./request-match');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');

let logConfig;
const options = readRedisOptions();

function readLogConfig() {
  // client is in "subscriber" mode so we need a new client here
  const reader = redis.createClient(options);
  reader.on("error", function (err) {
    console.error('reader on error handler >>', err);
  });
  reader.get(LOG_CONFIG_KEY, (err, config) => {
    reader.quit();
    if (err) {
      return console.error('Failed to read log config', err);
    }
    console.log('New log config:', config);
    try {
      logConfig = config && JSON.parse(config);
      if (logConfig && logConfig.request) {
        const re = logConfig.request;
        re.url = re.url && RegExp(re.url);
        re.ip = re.ip && RegExp(re.ip);
        re.headers = re.headers && _.mapValues(re.headers, RegExp);
      }
    } catch (e) {
      console.error('Failed to parse log config', e);
    }
  });
}

// read initial config
readLogConfig();

const subscriber = redis.createClient(options);
subscriber.on("error", function (err) {
  console.error('subscriber client error >>', err);
});
subscriber.on('message', function (channel, message) {
  console.log('on message', channel, message);
  readLogConfig();
});
subscriber.subscribe('__keyspace@0__:' + LOG_CONFIG_KEY);

module.exports = function dynLogLevel(req, res, next) {
  if (logConfig && logConfig.request && match(req, logConfig.request)) {
    console.log('match');
    req.logLevel = logConfig.level;
  }
  next();
};



// request counter idea
  // let c = decr();
  // if (c < 0) return;
  // if (c === 0) {
  //   del();
  //   logConfig = null;
  // }
