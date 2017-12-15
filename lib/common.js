'use strict';

const cfServices = require('cf-services');

module.exports = {
  LOG_CONFIG_KEY: 'log-config',
  readRedisOptions
};

function readRedisOptions() {
  const options = cfServices(process.env.LOG_CONFIG_SERVICE).credentials;
  options.host = options.hostname;
  return options;
}