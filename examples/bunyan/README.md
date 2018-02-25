# bunyan example

This example shows how to use _niveau_ with [bunyan](https://www.npmjs.com/package/bunyan).

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
{"name":"bunyan-example","hostname":"somehost","pid":6470,"req_id":"75332","level":30,"msg":"GET /abc","time":"2018-02-25T18:09:21.351Z","v":0}
```
From another console, set the log level to `debug` for requests starting with `/abc`
```sh
node_modules/.bin/set-log-level --url ^/abc debug
```
Request again the app at http://localhost:3000/abc.
Notice that now it logs also a debug message with the request headers
```
{"name":"bunyan-example","hostname":"somehost","pid":6470,"req_id":"7g4gx","level":30,"msg":"GET /abc","time":"2018-02-25T18:15:43.415Z","v":0}
{"name":"bunyan-example","hostname":"somehost","pid":6470,"req_id":"7g4gx","level":20,"headers":{"host":"localhost:3000","connection":"keep-alive","upgrade-insecure-requests":"1","user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8","accept-encoding":"gzip, deflate, br","accept-language":"en-US,en;q=0.9,bg;q=0.8,ru;q=0.7","if-none-match":"W/\"16-BJq7jcS0Cc1zKepll+LApvJurtg\""},"msg":"Request headers","time":"2018-02-25T18:15:43.415Z","v":0}
```
Request a different url like http://localhost:3000/xyz and notice that this debug message is not logged for it.
