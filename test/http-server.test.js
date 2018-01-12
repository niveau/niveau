'use strict';

const async = require('async');
const express = require('express');
const EventEmitter = require('events');
const request = require('supertest');
const sinon = require('sinon');
const expect = require('chai').expect;
const redis = require('redis');

const niveau = require('..');

// test with real http requests and mocked redis
describe('in http server', () => {
  let sandbox;
  let redisClient;
  let app;
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

    app = express();
    app.use(nv);
    app.use((req, res) => {
      res.send('logLevel: ' + req.logLevel);
    });
  });
  afterEach(() => {
    sandbox.restore();
  });

  function setConfig(config) {
    redisClient.get.yields(null, JSON.stringify(config));
    redisClient.emit('message');
  }

  it('does nothing when no log config is set', done => {
    request(app)
      .get('/')
      .expect('logLevel: undefined', done);
  });

  it('sets the log level only for matching requests', done => {
    setConfig({
      level: 'debug',
      request: {
        url: '^/match'
      }
    });
    async.parallel([
      cb => request(app)
        .get('/')
        .expect('logLevel: undefined', cb),
      cb => request(app)
        .get('/match')
        .expect('logLevel: debug', cb)
    ], done);
  });

  it('sets the log level only for requests with matching header', done => {
    setConfig({
      level: 'debug',
      request: {
        headers:{
          'x-header': 'abc'
        }
      }
    });
    async.parallel([
      cb => request(app)
        .get('/')
        .expect('logLevel: undefined', cb),
      cb => request(app)
        .get('/match')
        .set('x-header', 'xyz')
        .expect('logLevel: undefined', cb),
      cb => request(app)
        .get('/match')
        .set('x-header', 'abcd')
        .expect('logLevel: debug', cb)
    ], done);
  });

  it('emits "config" event on config change', () => {
    const config = { level: 'warning', custom: 'value' };
    setConfig(config);
    expect(configSpy.args).to.eql([[config]]);
  });

  it('emits "request" event only for matching requests', done => {
    const config = {
      level: 'debug',
      request: {
        url: '^/match'
      }
    };
    setConfig(config);
    async.parallel([
      cb => request(app)
        .get('/')
        .expect('logLevel: undefined', cb),
      cb => request(app)
        .get('/match')
        .expect('logLevel: debug', cb)
    ], err => {
      if (err) return done(err);
      expect(requestSpy.args.length).to.equal(1);
      expect(requestSpy.args[0][0]).to.have.property('url')
        .that.is.equal('/match');
      config.request.url = /^\/match/; // regex is compiled
      expect(requestSpy.args[0][1]).to.eql(config);
      done();
    });
  });

});
