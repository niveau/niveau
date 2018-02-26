'use strict';

const express = require('express');
const winston = require('winston');
const niveau = require('niveau');

const defaultLevel = winston.level;

const nv = niveau();
nv.on('config', config => {
  winston.level = config && config.level || defaultLevel;
})

const app = express();
app.use((req, res) => {
  winston.info('%s %s', req.method, req.url);
  winston.debug('Request headers:', req.headers);

  res.send('This is winston example');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Listening on port %d', port);
});
