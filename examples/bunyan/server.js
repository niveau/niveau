'use strict';

const express = require('express');
const bunyan = require('bunyan');
const niveau = require('niveau');

const log = bunyan.createLogger({ name: 'bunyan-example' });

const nv = niveau();

function randomId(len) {
  return Math.random().toString(36).slice(2, 2 + len);
}

const app = express();
app.use(nv);
app.use((req, res, next) => {
  console.log('req.logLevel:', req.logLevel);
  req.log = log.child({
    req_id: randomId(5),
    level: req.logLevel // set by nv
  });
  next();
});
app.use((req, res) => {
  req.log.info('%s %s', req.method, req.url);
  req.log.debug({ headers: req.headers }, 'Request headers');

  res.send('This is bunyan example');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on port %d', port);
});
