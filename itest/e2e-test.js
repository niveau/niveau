'use strict';

const proc = require('child_process');
const _ = require('lodash');
const request = require('supertest');

const VCAP_SERVICES = JSON.stringify({
  "redis": [
    {
      "credentials": {
        "hostname": "localhost",
        "port": "6379"
      },
      "label": "redis",
      "name": "redis"
    }
  ]
});

describe('End-to-end tests', function () {
  this.timeout(10000);
  let app;
  let stdout;

  before('Start test app', () => {
    app = proc.fork('itest/app/app.js', [], {
      env: _.defaults({ VCAP_SERVICES }, process.env),
      stdio: ['ignore', 'pipe', 'inherit'] // pipe stdout
    });
    stdout = '';
    app.stdout.on('data', data => {
      process.stdout.write(data);
      stdout += data;
    });
  });

  after('Stop test app', () => {
    app.kill();
  });

  it('fetch log level', done => {
    done();
  });
});
