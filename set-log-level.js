#!/usr/bin/env node

const assert = require('assert');
const redis = require('redis');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');

assert(process.argv.length >= 3, 'Provide log config as JSON');
const logConfig = process.argv[2]
console.log('set %s %s', LOG_CONFIG_KEY, logConfig);

JSON.parse(logConfig); // validate config

const client = redis.createClient(readRedisOptions());

client.on("error", function (err) {
  console.error(err);
});

client.config('set',  'notify-keyspace-events', 'KA', (err, reply) => {
  err ? console.error('notify-keyspace-events', err) : console.log('notify-keyspace-events', reply);

  client.set(LOG_CONFIG_KEY, logConfig, (err, reply) => {
    err ? console.error('set', err) : console.log('set', reply);
    client.quit();
  });
});
