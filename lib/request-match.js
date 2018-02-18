'use strict';

module.exports = function match(req, criteria) {
  return (!criteria.ip || criteria.ip.test(clientAddress(req))) &&
    (!criteria.url || criteria.url.test(req.url)) &&
    matchObject(criteria.headers, req.headers);
}

function matchObject(regex, values) {
  for (let key in regex) {
    if (!regex[key].test(values && values[key])) {
      return false;
    }
  }
  return true;
}

function clientAddress(req) {
  let header = req.headers['x-forwarded-for'];
  if (header) {
    return header.split(/\s*,\s*/).shift();
  }
  return req.connection.remoteAddress;
}
