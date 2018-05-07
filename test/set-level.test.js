'use strict';

const EventEmitter = require('events');
const sinon = require('sinon');
const redis = require('redis');

const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));
const { LOG_CONFIG_KEY } = require('../lib/common');

const setLevel = require('../lib/set-level');

describe('setLevel', () => {
  let sandbox;
  let redisClient;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    redisClient = new EventEmitter();
    redisClient.quit = sandbox.stub();
    redisClient.config = sandbox.stub().yields(null);
    redisClient.del = sandbox.stub().yields(null);
    redisClient.set = sandbox.stub().yields(null);
    sandbox.stub(redis, 'createClient').returns(redisClient);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('--reset deletes the redis key', done => {
    setLevel(['', '', '--reset'], err => {
      expect(err).to.not.exist;
      expect(redisClient.del).calledWith(LOG_CONFIG_KEY);
      done();
    });
  });

  it('throws error on invalid expire value', () => {
    expect(() => setLevel(['', '', '-x', '10x', 'debug'],
      err => { throw err })).to.throw('10x');
  });

  function testSet(cliArgs, setArgs, done) {
    setLevel(['', '', ...cliArgs], err => {
      expect(err).to.not.exist;
      let args = redisClient.set.args[0][0];
      args[1] = JSON.parse(args[1])
      expect(args).to.eql([LOG_CONFIG_KEY, ...setArgs]);
      done();
    });
  }

  [
    ['can set only the level', ['debug'], [{ level: 'debug' }]],
    [
      'can set the url',
      ['--url', '/abc', 'debug'],
      [{ request: { url: '/abc' }, level: 'debug' }]
    ],
    [
      'can set the ip',
      ['--ip', '1.2.3.4', 'silly'],
      [{ request: { ip: '1.2.3.4' }, level: 'silly' }]
    ],
    [
      'can set a header',
      ['--header', 'one:abc', 'silly'],
      [{ request: { headers: { one: 'abc' } }, level: 'silly' }]
    ],
    [
      'can set multiple headers',
      ['-h', 'one:abc', '-h', 'two:xyz', 'debug'],
      [{ request: { headers: { one: 'abc', two: 'xyz' } }, level: 'debug' }]
    ],
    [
      'default expiration unit is seconds',
      ['-x', '12', 'silly'],
      [{ level: 'silly' }, 'EX', '12']
    ],
    [
      'supports expiration time in seconds',
      ['-x', '15s', 'silly'],
      [{ level: 'silly' }, 'EX', '15']
    ],
    [
      'supports expiration time in minutes',
      ['--expire', '1m', 'silly'],
      [{ level: 'silly' }, 'EX', '60']
    ],
    [
      'supports expiration time in hours',
      ['--expire', '1h', 'silly'],
      [{ level: 'silly' }, 'EX', '3600']
    ],
    [
      'can set all the attributes',
      ['-l', '/abc', '-i', '1.2.3.4', '-h', 'one:abc', '-x', '1h', 'silly'],
      [
        {
          request: {
            url: '/abc',
            ip: '1.2.3.4',
            headers: { one: 'abc' }
          },
          level: 'silly'
        },
        'EX', '3600'
      ]
    ]
  ].forEach(t => it(t[0], done => testSet(t[1], t[2], done)));

});
