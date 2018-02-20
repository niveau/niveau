[![Build Status](https://travis-ci.org/niveau/niveau.svg?branch=master)](https://travis-ci.org/niveau/niveau)
[![Greenkeeper badge](https://badges.greenkeeper.io/niveau/niveau.svg)](https://greenkeeper.io/)

# niveau

Node.js package to switch log level per request in Cloud Foundry

## Goals
* Change the log level without restart - no downtime
* Change the log level per request. Setting the log level to debug on an app with high load could result in log flood and even loss of log messages.
* All application instances use the same log level.
* Set the log level from server-side as it is often hard to change client requests. This is also less susceptible to DoS attacks.
* Temporary log level change
  - Time based
  - Request count based
* Integrate with different logging libraries. Logging lib agnostic.

## Requirements
* Node.js 6 (or later)
* Cloud Foundry
* Redis

## Design
We need some persistence of the log level, so new instances can load it.
To achieve this, we use Redis as it provides both storage and change notification via [keyspace notifications](https://redis.io/topics/notifications).

This package provides a CLI interface to change the log configuration.
There are several options to invoke it:
* [CF task](https://docs.cloudfoundry.org/devguide/using-tasks.html)
* [ssh] to a running application

Deployment options:
* As part of an existing Node.js app
  - No additional app
* As a separate app
  - Can be used with applications that do not run on Node.js
  - Does not need to run. Executing CF task will start a temporary instance automatically
  - One more app to manage

In any case the application should be bound to a Redis instance.

## Usage

### In the application

Install the package.
```sh
npm install --save niveau
```
With npm 5 you don't need the `--save` option.

Configure _niveau_ and add it as a middleware:
```js
const express = require('express');
const niveau = require('niveau');

let nv = niveau(/* redis options */);
nv.on('error', err => {
  console.error(err);
});
nv.on('request', (req, config) => {
  // set log level for this request to config.level 
});

let app = express();
app.use(nv);
```

### Changing the log level
This package provides an executable script to change the log level.
The provided log level will be used only for HTTP requests that match the given options.
Each command invocation overwrites any previous settings.

```sh
set-log-level [options...] [<level>]
```
#### Options
* -l, --url \<regex> - matches request URL (without protocol, host, port)
* -h, --header \<name>:\<regex> - matches given request header value
* -i, --ip \<regex> - matches sender IP address
* -x, --expire \<value> - expiration time with `s/m/h` suffix
* -r, --reset - reset log level to default (do not provide <level>)
* \<level> - log level to use for matching requests, supported values depend on your log library

#### Invoke via CF task
This will start a temporary instance of the application, run the task inside and stop that instance.
```sh
cf run-task APP-NAME "set-log-level [options] [<level>]" [-m MEMORY] [--name TASK_NAME]
```
Check the output in the logs
```sh
cf logs --recent APP-NAME
```

#### Invoke via SSH to the application
Log into the container of a running application and execute the command:
```sh
cf ssh APP-NAME
export PATH=$PATH:~/deps/0/bin:~/app/node_modules/.bin
set-log-level [options...] <level>
```
This is useful if you need to run it multiple times and see the output immediately.

#### Examples
Set log level to debug for requests on URLs starting with `/api/v2`. Reset log level after 15 min.
```sh
set-log-level -l '^/api/v2/' --expire 15m debug
```

## Test
Install all dependencies:
```sh
npm install
```
Run static code checks with _eslint_ and unit tests:
```sh
npm test
```

Integration tests require Redis to run on localhost on default port 6379.
Install [docker], unless you have it already.
Start Redis:
```sh
npm run redis
```
Run the integration tests against Redis:
```sh
npm run itest
```

## Future
### CF CLI plugin to change log level
Redis uses TCP not HTTP, so it requires a tunnel (cf ssh) to connect it from outside CF. This is an additional obstacle for a CF CLI plugin.

[ssh]: https://docs.cloudfoundry.org/devguide/deploy-apps/ssh-apps.html
[docker]: https://www.docker.com/community-edition
