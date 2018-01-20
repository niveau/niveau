'use strict';

const proc = require('child_process');
const _ = require('lodash');
const request = require('supertest');
const debug = require('debug')('niveau:e2e-test');

function exec(cmd) {
  return proc.execSync(cmd, { encoding: 'utf8' });
}

function startApp(done) {
  let appProc = proc.spawn('node', ['itest/app/app.js'], {
    stdio: ['ignore', 'pipe', 'inherit'], // pipe stdout
    encoding: 'utf8'
  });
  let stdout = '';
  appProc.on('error', err => {
    console.error(err);
    done(err);
  });
  appProc.on('exit', (code, signal) => {
    done(new Error(
      `App terminated with code ${code} and signal ${signal}`));
  });
  appProc.stdout.on('data', data => {
    debug('app> %s', data);
    stdout += data;
    let m = stdout.match(/Listening on port (\d+)/);
    if (m) {
      let app = request('http://localhost:' + m[1]);
      app.process = appProc;
      done(null, app);
    }
  });
}

describe('End-to-end tests', function () {
  this.timeout(5000);
  let app;

  before('Start test app', done => {
    done = _.once(done);
    exec('./set-log-level.js --reset');    
    startApp((err, a) => {
      app = a; 
      done(err)
    });
  });

  after('Stop test app', () => {
    app.process.kill();
  });

  it('fetch default log level', done => {
    app.get('/').expect(200, 'logLevel: undefined', done);
  });

  it('change log level for all requests', done => {
    exec('./set-log-level.js debug');
    app.get('/').expect(200, 'logLevel: debug', done);
  });

});
