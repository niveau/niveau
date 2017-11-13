'use strict';

const redis = require('redis');
const _ = require('lodash');
const tmatch = require('tmatch');
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
      logConfig = JSON.parse(config);
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
  let m = match(req);
  if (m) {
    req.logLevel = m.level;
  }
  next();
};

function match(req) {
  if (!logConfig) {
    return;
  }
  console.log('req.url', req.url);
  if (tmatch(req, logConfig.request)) {
    console.log('match');
    return logConfig;
  }
  console.log('no match');
}

/*
{
  request: {
    $url: "/fdff/",
    headers: {
      x-ala-bala: "sdfsds"
    },
    ip:
  },
  expire: '1h',
  log: {
    level: 'info'
  }
}
*/
