'use strict';

const EventEmitter = require('events');
const sinon = require('sinon');
const redis = require('redis');

const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));

const niveau = require('..');

describe('niveau', () => {
  let sandbox;
  let redisClient;
  let nv;
  let configSpy, requestSpy;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    redisClient = new EventEmitter();
    redisClient.get = sandbox.stub().yields(null, null);
    redisClient.quit = sandbox.stub();
    redisClient.subscribe = sandbox.stub();
    sandbox.stub(redis, 'createClient').returns(redisClient);

    nv = niveau({});
    nv.on('config', configSpy = sandbox.spy());
    nv.on('request', requestSpy = sandbox.spy());
  });

  afterEach(() => {
    sandbox.restore();
  });

  function setConfig(config) {
    redisClient.get.yields(null, JSON.stringify(config));
    redisClient.emit('message');
  }

  function testLevel(req, expectLevel) {
    let res = {};
    nv(req, res, err => {
      expect(err).to.not.exist;
      expect(req.logLevel).to.equal(expectLevel);
    });
  }

  it('does nothing when no log config is set', () => {
    testLevel({}, undefined);
  });

  it('sets the log level only for matching requests', () => {
    setConfig({
      level: 'debug',
      request: {
        url: '^/match'
      }
    });

    testLevel({ url: '/' }, undefined);
    testLevel({ url: '/match' }, 'debug');
  });

  it('sets the log level only for requests with matching header', () => {
    setConfig({
      level: 'debug',
      request: {
        headers:{
          'x-header': 'abc'
        }
      }
    });

    testLevel({ url: '/' }, undefined);
    testLevel({ url: '/', headers: {'x-header': 'xyz'} }, undefined);
    testLevel({ url: '/', headers: {'x-header': 'abcd'} }, 'debug');
  });

  it('emits "config" event on config change', () => {
    const config = { level: 'warning', custom: 'value' };
    setConfig(config);
    expect(configSpy.args).to.eql([[config]]);
  });

  it('emits "request" event only for matching requests', () => {
    const config = {
      level: 'debug',
      request: {
        url: '^/match'
      }
    };
    setConfig(config);

    testLevel({ url: '/' }, undefined);
    expect(requestSpy).not.called;

    testLevel({ url: '/match' }, 'debug');
    expect(requestSpy).calledWith({ url: '/match', logLevel: 'debug' },
      { level: 'debug', request: { url: /^\/match/ }});
  });

});
