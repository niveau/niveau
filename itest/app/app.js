'use strict';

const express = require('express');

const niveau = require('../..');

const name = process.argv[2];

let nv = niveau();

let app = express();
app.use(nv);
app.use((req, res) => {
  res.send(`${name}: ${req.logLevel}`);
});

nv.once('config', () => {
  let server = app.listen(() => {
    console.log(`Listening on port ${server.address().port}`);
  });
});
