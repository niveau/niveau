'use strict';

const _ = require('lodash');
const async = require('async');
const assert = require('assert');
const cmdParse = require('minimist');
const debug = require('debug')('niveau:set-level');
const redis = require('redis');
const timeParse = require('timeparse');
const VError = require('verror');
const { LOG_CONFIG_KEY, readRedisOptions } = require('./common');

const allOptions = {
  url: 'l',
  header: 'h',
  ip: 'i',
  expire: 'x',
  reset: 'r',
  help: undefined,
  _: undefined
};

module.exports = setLevel;

function setLevel(argv, cb) {
  const cmdOptions = cmdParse(argv.slice(2), {
    alias: _.omit(_.invert(allOptions), undefined)
  });
  debug('Command line options:', cmdOptions);

  checkOptions(cmdOptions);
  let logConfig = buildConfig(cmdOptions);
  let expire = parseExpire(cmdOptions.expire);

  const client = redis.createClient(readRedisOptions());

  let done = _.once(err => {
    client && client.quit();
    cb(err);
  });

  client.on('error', done);

  async.series([
    cb => {
      debug('redis CONFIG SET notify-keyspace-events KA')
      client.config('set', 'notify-keyspace-events', 'KA', cb);
    },
    cb => {
      if (cmdOptions.reset) {
        debug('redis DEL %s', LOG_CONFIG_KEY);
        client.del(LOG_CONFIG_KEY, cb);
      } else {
        let value = JSON.stringify(logConfig);
        let params = [LOG_CONFIG_KEY, value];
        expire && params.push('EX', expire);
        debug('redis SET', ...params);
        client.set(params, cb);
      }
    }
  ], done);
}

function parseExpire(expire) {
  if (expire) {
    try {
      return timeParse(expire + '', 's');
    } catch (err) {
      throw new VError(err, `Invalid expire value ${expire}`);
    }
  }
}

function checkOptions(cmdOptions) {
  function noOptions(options) {
    return Object.keys(options).length === 1 && options._.length === 0;
  }

  let validOptions = new Set(_.flatten(_.entries(allOptions)));
  for (let opt in cmdOptions) {
    assert(validOptions.has(opt),
      `Invalid option ${opt}. Run 'set-log-level --help' to see usage.`);
  }

  if (cmdOptions.help || noOptions(cmdOptions)) {
    throw new Error(`Usage: set-log-level [options...] <level>
Options:
-l, --url <regex> - matches request URL (without protocol, host, port)
-h, --header <name>:<regex> - matches given request header value
-i, --ip <regex> - matches sender IP address
-x, --expire <value> - expiration time with s/m/h suffix
-r, --reset - reset log level to default (do not provide level)
--help - print usage
<level> - log level to use for matching requests, supported values depend on your log library
`);
  }

  if (cmdOptions.reset) {
    assert(
      !cmdOptions._.length &&
      !['url', 'header', 'ip', 'expire'].some(opt => opt in cmdOptions),
      'No other options allowed with reset'
    );
  } else {
    assert(cmdOptions._.length === 1,
      "Provide exactly one log level. Run 'set-log-level --help' to see usage.");
  }
}

function buildConfig(cmdOptions) {
  if (cmdOptions.reset) return;

  let level = cmdOptions._[0];

  if (_.isString(cmdOptions.header)) {
    cmdOptions.header = [cmdOptions.header];
  }
  let headers = _.fromPairs(_.map(cmdOptions.header, h => {
    let match = /^([^:]+):(.+)$/.exec(h);
    assert(match && match.length === 3,
      `Invalid header ${h}. Use the format <name>:<regex>`);
    return [match[1].trim(), match[2].trim()];
  }));
  headers = _.isEmpty(headers) ? undefined : headers;

  let request = {
    url: cmdOptions.url,
    ip: cmdOptions.ip,
    headers
  };
  request = _.some(request, v => v !== undefined) ? request : undefined;
  return {
    request,
    level
  };
}