[![Build Status](https://travis-ci.org/niveau/niveau.svg?branch=master)](https://travis-ci.org/niveau/niveau)

# niveau
Node.js package to switch log level per request in Cloud Foundry

:construction: **UNDER CONSTRUCTION**

## Goals
* Change the log level without restart - no downtime
* Change the log level per request. Setting the log level to debug on an app with high load could result in log flood and even loss of log messages.
* All application instances use the same log level.
* Set the log level from server-side as it is often hard to change client requests. This is also less susceptible to DoS attacks.
* Temporary log level change 
  - Time based 
  - Request count based
* Integrate with different logging libraries. Logging lib agnostic.

## Design
We need some persistence of the log level, so new instances can load it.
To achieve this, we use Redis as it provides both storage and change notification via [keyspace notifications](https://redis.io/topics/notifications).

This package provides a CLI interface to chnage the log configuration.
There are several options to invoke it:
* [CF task][1]
* [ssh] to a running application

Deployment options:
* As a separate app
  - Can be used for application that do not run on Node.js
  - May not run all the time, executing CF task will start a temporary instance automatically
  - One more app to manage
* As part of an existing node.js app
  - No additional app

Application should be bound to a Redis instance.

## Future
### CF CLI plugin to change log level
Redis uses TCP not HTTP, so it requires a tunnel (cf ssh) to connect it from outside CF. This is an additional obstacle for a CF CLI plugin.

## Usage
This package provides an executable script to change the log level.
The provided log level will be used only for HTTP requests that match the given options.
Each command invokation overwrites any previous settings.

```sh
set-log-level [options...] <level>
```
### Options
* -l, --url \<regex> - matches request URL (without protocol, host, port)
* -h, --header \<name>:\<regex> - matches given request header value
* -i, --ip \<mask> - matches sender IP address (not implemented yet)
* -x, --expire \<value> - expire value can be either time (with `s/m/h` suffix) or request count (with `r` suffix)
* -r, --reset - reset log level (not implemented yet)

### Invoke via SSH to applicaiton
Log into the container of a running application and execute the command:
```sh
cf ssh APP-NAME
export PATH=$PATH:~/deps/0/bin:~/app/node_modules/.bin
set-log-level [options...] <level>
```
This is useful if you need to run it multiple times and see the output immediately.

### Invoke via CF task
This will start a temporary instance of the application, run the task inside and stop that instance.
```sh
cf run-task APP-NAME "set-log-level [options] <level>" [-m MEMORY] [--name TASK_NAME]
```
Check the output in the logs
```sh
cf logs --recent APP-NAME
```

### Examples
Set log level to debug for requests on URLs starting with `/api/v2`. Reset log level after 15 min.
```sh
set-log-level -l '^/api/v2/' --expire 15m debug
```


[1]: https://docs.cloudfoundry.org/devguide/using-tasks.html
[ssh]: https://docs.cloudfoundry.org/devguide/deploy-apps/ssh-apps.html
