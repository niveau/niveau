'use strict';

const cfServices = require('cf-services');

module.exports = {
  LOG_CONFIG_KEY: 'log-config',
  readRedisOptions
};

function readRedisOptions() {
  if (!process.env.VCAP_SERVICES) return {};
  let filter = process.env.LOG_CONFIG_SERVICE ||
    (binding => binding.label === 'redis' || binding.tags.includes('redis'));
  const options = cfServices(filter).credentials;
  options.host = options.hostname;
  return options;
}