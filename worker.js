/*!
 * worker.js
 * Copyright(c)
 * Author: jifeng <wade428@163.com>
 */

"use strict";

/**
 * Module dependencies.
 */

var config = require('./config');
var app = require('./app').create();
app.listen(config.port);
