'use strict';

const redis = require('redis');
const EventEmitter = require('events');
const VError = require('verror');
const debug = require('debug')('niveau:store');

/**
 * Generic configuration store using Redis.
 *
 * Arbitrary configuration is stored as JSON under a configurable Redis key.
 * Although the configuration is not interpreted here, it is parsed as JSON.
 * So, clients can access it directly (e.g. store.config) without the need to
 * store it separately.
 * Note: configuration can be null or undefined if it is not loaded yet,
 * deleted or expired in Redis.
 *
 * Listens for changes and emits the 'config' event when the configuration
 * is changed in Redis.
 *
 * Emits the 'error' event in case of error.
 * If not handled, the process will crash.
 */
module.exports = class ConfigStore extends EventEmitter {
  /**
   * Init config store
   * @param {boject} options Redis connection options
   *        - redisKey - Redis key that contains the configuration
   */
  constructor(options) {
    super();
    this.config = undefined;
    this._options = options;
    this._load(); // load initial configuration
    this._subscribe();
  }

  _load() {
    // subscriber is in "subscriber" mode so we need a new client here
    // we expect config changes to be relatively rare
    // so we open a new connection for each read
    // could be configurable in the future
    const reader = redis.createClient(this._options);
    reader.on('error',
      err => this.emit('error', new VError(err, 'Redis error')));
    reader.get(this._options.redisKey, (err, config) => {
      reader.quit();
      if (err) {
        return this.emit('error',
          new VError(err, 'Error reading from Redis'));
      }
      debug('Loaded %s: %s', this._options.redisKey, config);
      try {
        this.config = config && JSON.parse(config);
      } catch (e) {
        return this.emit('error',
          new VError(e, 'Could not parse configuration loaded from Redis'));
      }
      this.emit('config', this.config);
    });
  }

  _subscribe() {
    this._subscriber = redis.createClient(this.options);
    this._subscriber.on('error',
      err => this.emit('error', new VError(err, 'Redis listener error')));
    this._subscriber.on('message', function (channel, message) {
      debug('Redis message:', channel, message);
      this._load();
    });
    this._subscriber.subscribe('__keyspace@0__:' + this._options.redisKey);
  }

  close() {
    this._subscriber && this._subscriber.quit();
  }
};
