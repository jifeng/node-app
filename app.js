/*!
 * config.js
 * Copyright(c) 2012
 * Author: jifeng <wade428@163.com>
 */

require('response-patch');
moment.lang('zh-cn');

var connect = require('connect');
var fs = require('fs');
var path = require('path');
var http = require('http');
fs.exists = fs.exists || path.exists;
var ejs = require('ejs');
ejs.open = '{%';
ejs.close = '%}';

/**
 * Middlewares
 */

var config = require('./config');
var forward = require('forward');
var urlrouter = require('urlrouter');
var render = require('connect-render');
var cookieMiddleware = require('response-cookie');
var RedisStore = require('connect-mredis')(connect);
var proxy = require('./proxy');
var routes = require('./routes');

exports.create = function createServer(userMockLoginMiddleware) {

  var helpers = {
    version: config.version,
    config: config,
    env: process.env.NODE_ENV,
    current_user: function (req, res) {
      return req.session && req.session.user;
    },
  };

  var app = connect(
    connect.query(),
    cookieMiddleware(),
    render({
      root: path.join(__dirname, 'views', 'blue'),
      layout: 'layout',
      viewExt: '.html',
      cache: !config.debug,
      helpers: helpers
    })
  );

  app.use('/favicon.ico', forward(path.join(__dirname, 'assets', 'favicon.ico')));
  app.use('/robots.txt', forward(path.join(__dirname, 'assets', 'robots.txt')));

  //页面缓存
  if (config.debug) {
    app.use('/assets', connect.static(__dirname + '/assets'));
  } else {
    app.use('/assets', connect.static(__dirname + '/assets', { maxAge: 3600000 * 24 * 365 }));
  }

  //当前端有nginx的配合
  app.use(function (req, res, next) {
    // 设置真实客户端ip
    req.user_ip = req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress);
    next();
  });

  /**
   * uid log token
   */
  connect.logger.token('uid', function (req, res) { 
    if (req.session && req.session.user && req.session.user.userid) {
      return req.session.user.userid;
    }
    return req.connect_uid || '-';
  });

  /**
   * client address log token
   */
  connect.logger.token('remote-addr', function (req) {
    return req.user_ip;
  });

  connect.logger.token('date', function () {
    return new Date().toString();
  });

  connect.logger.format('taoindex', ':remote-addr :response-time - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :res[content-length] :uid');

  app.use(connect.bodyParser());
  app.use(connect.cookieParser());
  app.use(connect.session({
    key: 'connect.sid',
    secret: config.session_secret,
    cookie: { path: '/', httpOnly: true, maxAge: 3600000 * 12 },
    store: new RedisStore(config.redisOptions)
  }));

  //路由信息
  app.use(urlrouter(routes));


  /**
   * Error handler
   */
  app.use(function (err, req, res, next) {
    err.url = err.url || req.url;
    // console.log(err.stack)
    res.statusCode = err.status || 500;
    res.render('500', {
      viewname: 'error',
      viewClassName: 'error_500'
    });
  });

  /**
   * Page not found handler
   */
  app.use(function (req, res, next) {
    res.statusCode = 404;
    res.render('404', {
      viewname: 'error',
      viewClassName: 'error_404',
      title: '迷路了?'
    });
  });

  app = http.createServer(app);

  //等底层数据准备好后启动
  app.__listen = app.listen;
  app.listen = function (port, callback) {
    proxy.ready(function () {
      app.__listen(port, callback);
    });
    return this;
  };
  return app;
};
