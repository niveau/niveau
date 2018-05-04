'use strict';

const match = require('../lib/request-match');
const expect = require('chai').expect;

describe('request-match', () => {
  let req;

  beforeEach(() => {
    req = {
      connection: {},
      headers: {}
    };
  });

  it('matches missing criteria', () => {
    expect(match(req, undefined)).to.be.true;
    expect(match(req, null)).to.be.true;
  });

  it('matches connection remote ip', () => {
    req.connection.remoteAddress = '1.2.3.4';
    expect(match(req, { ip: /^1\.2\./ })).to.be.true;
    expect(match(req, { ip: /^1\.3\./ })).to.be.false;
  });

  it('matches the first ip from x-forwarded-for header', () => {
    req.connection.remoteAddress = '1.2.3.4';
    req.headers['x-forwarded-for'] = '5.6.7.8';
    expect(match(req, { ip: /^1\.2\./ })).to.be.false;
    expect(match(req, { ip: /^5\.6\./ })).to.be.true;

    req.headers['x-forwarded-for'] = '1.1.1.1, 2.2.2.2';
    expect(match(req, { ip: /^1\.1\./ })).to.be.true;
    expect(match(req, { ip: /^2\.2\./ })).to.be.false;
  });

  it('matches url', () => {
    req.url = '/a/b/c';
    expect(match(req, { url: /^\/a\/b/ })).to.be.true;
    expect(match(req, { url: /^\/a\/x/ })).to.be.false;
  });

  it('matches headers', () => {
    req.headers = {
      one: 'v1',
      two: 'v2'
    };
    expect(match(req, { headers: { one: /1/ } })).to.be.true;
    expect(match(req, { headers: { one: /2/ } })).to.be.false;
    expect(match(req, { headers: { one: /1/, two: /2/ } })).to.be.true;
    expect(match(req, { headers: { one: /1/, two: /1/ } })).to.be.false;
    expect(match(req, { headers: { one: /1/, three: /1/ } })).to.be.false;
  });

  it('matches all criteria', () => {
    req.connection.remoteAddress = '1.2.3.4';
    req.url = '/a/b/c';
    req.headers = { one: 'v1' }

    expect(match(req, {
      ip: /4$/,
      url: /^\/a\/b/,
      headers: { one: /1/ }
    })).to.be.true;
    expect(match(req, {
      ip: /4$/,
      url: /^\/a\/b/,
      headers: { one: /2/ }
    })).to.be.false;
  });
});