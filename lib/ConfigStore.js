'use strict';

const redis = require('redis');
const EventEmitter = require('events');
const _ = require('lodash');
const VError = require('verror');
const debug = require('debug')('niveau');
const { LOG_CONFIG_KEY } = require('./common');

// wraps Redis communication
module.exports = class ConfigStore extends EventEmitter {
  constructor(options) {
    super();
    this.logConfig = undefined;
    this._options = options;
    this._load();
  }

  _load() {
    // subscriber is in "subscriber" mode so we need a new client here
    const reader = redis.createClient(this._options);
    reader.on('error',
      err => this.emit('error', new VError(err, 'Redis error')));
    reader.get(LOG_CONFIG_KEY, (err, config) => {
      reader.quit();
      this.logConfig = undefined;
      if (err) {
        return this.emit('error',
          new VError(err, 'Could not get Redis key'));
      }
      debug('Loaded %s: %s', LOG_CONFIG_KEY, config);
      try {
        let logConfig = config && JSON.parse(config);
        if (logConfig && logConfig.request) {
          const re = this.logConfig.request;
          re.url = re.url && RegExp(re.url);
          re.ip = re.ip && RegExp(re.ip);
          re.headers = re.headers && _.mapValues(re.headers, RegExp);
        }
        this.logConfig = logConfig;
      } catch (e) {
        return this.emit('error',
          new VError(e, 'Failed to parse log config'));
      }
      this.emit('config', this.logConfig);
    });
  }

  _subscribe() {
    this.subscriber = redis.createClient(this.options);
    this.subscriber.on('error',
      err => this.emit('error', new VError(err, 'Redis error')));
    this.subscriber.on('message', function (channel, message) {
      debug('Message:', channel, message);
      this._load();
    });
    this.subscriber.subscribe('__keyspace@0__:' + LOG_CONFIG_KEY);
  }

  close() {
    this.subscriber && this.subscriber.quit();
  }
};
