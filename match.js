'use strict';

module.exports = function match(req, criteria) {
  return matchRegEx(criteria.ip, clientAddress(req)) &&
    matchRegEx(criteria.url, req.url) &&
    matchObject(criteria.headers, req.headers);
}

function matchRegEx(regex, value) {
  return !regex || regex.test(value);
}

function matchObject(regex, values) {
  for (let key in regex) {
    if (!regex[key].test(values[key])) {
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
