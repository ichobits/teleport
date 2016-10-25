/*
Copyright 2015 Gravitational, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var WebpackDevServer = require("webpack-dev-server");
var webpackConfig = require('./webpack/webpack.config.dev.js');
var express = require('express');
var webpack = require('webpack');
var proxy = require('http-proxy').createProxyServer();

var PROXY_TARGET = '0.0.0.0:3080/';
var ROOT = '/web';
var PORT = '8081';
var WEBPACK_CLIENT_ENTRY = 'webpack-dev-server/client?https://localhost:' + PORT;
var WEBPACK_SRV_ENTRY = 'webpack/hot/dev-server';

webpackConfig.entry.app.unshift(WEBPACK_CLIENT_ENTRY, WEBPACK_SRV_ENTRY);
webpackConfig.entry.styles.unshift(WEBPACK_CLIENT_ENTRY, WEBPACK_SRV_ENTRY);

var compiler = webpack(webpackConfig);

var server = new WebpackDevServer(compiler, {
  proxy: {
    '/web/config.js': 'https://' + PROXY_TARGET,
    '/v1/webapi/*': 'https://' + PROXY_TARGET
  },
  publicPath: ROOT +'/app',
  hot: true,
  https: true,
  inline: true,
  headers: { 'X-Custom-Header': 'yes' },
  stats: 'errors-only'
});

// tell webpack dev server to proxy below sockets requests to actual server
server.listeningApp.on('upgrade', function(req, socket) {
  console.log('proxying ws', req.url);
  proxy.ws(req, socket, {
    target: 'wss://' + PROXY_TARGET,
    secure: false
  });
});

server.app.use(ROOT, express.static(__dirname + "//dist"));
server.app.get(ROOT +'/*', function (req, res) {
    res.sendfile(__dirname + "//dist//index.html");
});

server.listen(PORT, "0.0.0.0", function() {
  console.log('Dev Server is up and running: https://location:' + PORT +'/web');
});
