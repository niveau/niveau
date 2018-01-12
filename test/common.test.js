'use strict';

const expect = require('chai').expect;

const { readRedisOptions } = require('../lib/common');

describe('common', () => {
  describe('readRedisOptions', () => {
    afterEach(() => {
      delete process.env.VCAP_SERVICES;
    });

    it('returns options from redis binding', () => {
      process.env.VCAP_SERVICES = JSON.stringify({
        "redis": [
          {
            "binding_name": null,
            "credentials": {
              "hostname": "1.2.3.4",
              "password": "secret",
              "port": "12345",
              "ports": {
                "6379/tcp": "12345"
              }
            },
            "instance_name": "redis",
            "label": "redis",
            "name": "redis",
            "plan": "v3.0-dev",
            "provider": null,
            "syslog_drain_url": null,
            "tags": [
              "redis",
              "keyvalue"
            ],
            "volume_mounts": []
          }
        ]
      });

      let options = readRedisOptions();
      expect(options.host).to.equal('1.2.3.4');
      expect(options.port).to.equal('12345');
      expect(options.password).to.equal('secret');
    });

    it('returns options from service binding referenced by LOG_CONFIG_SERVICE', () => {
      process.env.VCAP_SERVICES = JSON.stringify({
        "redis": [
          {
            "credentials": {
              "hostname": "1.2.3.4",
            },
            "label": "redis",
            "name": "redis1",
            "tags": [
              "redis",
              "keyvalue"
            ]
          },
          {
            "credentials": {
              "hostname": "4.3.2.1",
            },
            "label": "redis",
            "name": "redis4",
            "tags": [
              "redis",
              "keyvalue"
            ]
          }
        ]
      });

      process.env.LOG_CONFIG_SERVICE = 'redis1';
      expect(readRedisOptions().host).to.equal('1.2.3.4');

      process.env.LOG_CONFIG_SERVICE = 'redis4';
      expect(readRedisOptions().host).to.equal('4.3.2.1');
    });
  });
});
