# winston example

This example shows how to use _niveau_ with [winston](https://www.npmjs.com/package/winston).

Winston does not support implicit logging of a request id.
This makes it hard to distinguish log messages of parallel requests.
So we use _niveau_ to change only the global log level (no per request logging).

The application code is in [server.js](server.js).

Install the dependencies:
```sh
npm install
```
Start redis:
```sh
npm run redis
```
Start the application:
```sh
node server.js
```
Request the application at http://localhost:3000/abc.
Notice that it logs one message for each request like this
```
info: GET /abc
```
From another console, set the log level to `debug`
```sh
node_modules/.bin/set-log-level debug
```
Request again the app at http://localhost:3000/abc.
Notice that now it logs also a debug message with the request headers
```
info: GET /abc
debug: Request headers: host=localhost:3000, connection=keep-alive, upgrade-insecure-requests=1, user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36, accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8, accept-encoding=gzip, deflate, br, accept-language=en-US,en;q=0.9,bg;q=0.8,ru;q=0.7, if-none-match=W/"17-L3siRoDVzTzgwmm8mjfq/RHwjRY"
```
Reset the log level
```sh
node_modules/.bin/set-log-level --reset
```
Request again the app at http://localhost:3000/abc.
Now it does not log the debug messages.
