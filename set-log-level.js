#!/usr/bin/env node

const _ = require('lodash');
const assert = require('assert');
const cmdParse = require('minimist');
const redis = require('redis');
const timeparse = require('timeparse');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');

const cmdOptions = cmdParse(process.argv.slice(2), {
  alias: {
    l: 'url',
    h: 'header',
    i: 'ip',
    x: 'expire'
  }
});

assert(cmdOptions._.length === 1, 'Provide exactly one log level');
const level = cmdOptions._[0];
const LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
assert(LOG_LEVELS.some(l => l === level.toLowerCase()),
  `Valid log levels: ${LOG_LEVELS}`);

let headers = _.reduce(cmdOptions.header, (result, h) => {
  let i = h.indexOf(':');
  assert(i > 0, 'headers');
  result[h.slice(0, i)] = h.slice(i + 1);
}, {});

if (cmdOptions.expire) {
  if (cmdOptions.expire.endsWith('r'))
    let expire = timeparse(cmdOptions.expire, 's');
}

let logConfig = {
  request: {
    url: cmdOptions.url,
    ip: cmdOptions.ip,
    headers
  },
  // requestCounterKey: 'counter-name',
  level
};
console.log('set %s', LOG_CONFIG_KEY, logConfig);

const client = redis.createClient(readRedisOptions());

client.on("error", function (err) {
  console.error(err);
});

client.config('set', 'notify-keyspace-events', 'KA', (err, reply) => {
  err ? console.error('notify-keyspace-events', err) : console.log('notify-keyspace-events', reply);

  let params = [LOG_CONFIG_KEY, JSON.stringify(logConfig)];
  expire && params.push('EX', expire);
  client.set(params, (err, reply) => {
    err ? console.error('set', err) : console.log('set', reply);
    client.quit();
  });
});
