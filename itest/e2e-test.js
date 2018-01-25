'use strict';

const proc = require('child_process');
const _ = require('lodash');
const async = require('async');
const request = require('supertest');
const debug = require('debug')('niveau:e2e-test');

function exec(cmd) {
  return proc.execSync(cmd, { encoding: 'utf8' });
}

function startApp(name, done) {
  done = _.once(done);
  let appProc = proc.spawn('node', ['itest/app/app.js', name], {
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
  let app, app2;

  before('Start test app', done => {
    exec('./set-log-level.js --reset');
    startApp('A', (err, a) => {
      app = a;
      done(err)
    });
  });

  after('Stop test app', () => {
    app && app.process.kill();
  });

  it('fetch default log level', done => {
    app.get('/').expect(200, 'A: undefined', done);
  });

  it('change log level for all requests', done => {
    exec('./set-log-level.js debug');
    app.get('/').expect(200, 'A: debug', done);
  });

  it('change log level for requests with matching url', done => {
    exec('./set-log-level.js --url /a warning');
    async.parallel([
      cb => app.get('/a').expect('A: warning', cb),
      cb => app.get('/b').expect('A: undefined', cb)
    ], done);
  });

  it('log config expires', done => {
    exec('./set-log-level.js error --expire 1s');
    async.series([
      cb => app.get('/').expect('A: error', cb),
      cb => setTimeout(cb, 2000),
      cb => app.get('/').expect('A: undefined', cb)
    ], done);
  });

  describe('Multiple apps', () => {
    before('Start second app', done => {
      exec('./set-log-level.js silly');
      startApp('B', (err, a) => {
        app2 = a;
        done(err)
      });
    });

    after('Stop second app', () => {
      app2 && app2.process.kill();
    });

    it('new apps use the current log config', done => {
      async.parallel([
        cb => app.get('/').expect('A: silly', cb),
        cb => app2.get('/').expect('B: silly', cb),
      ], done);
    });

    it('all apps get the new log config', done => {
      exec('./set-log-level.js dummy');
      async.parallel([
        cb => app.get('/').expect('A: dummy', cb),
        cb => app2.get('/').expect('B: dummy', cb),
      ], done);
    });
  });

});
