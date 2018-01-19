'use strict';

/* eslint-disable no-console */

const express = require('express');

const niveau = require('../..');

let nv = niveau({});

let app = express();
app.use(nv);
app.use((req, res) => {
  res.send('logLevel: ' + req.logLevel);
});

let server = app.listen(() => {
  console.log(`Listening on port ${server.address().port}`);
});
