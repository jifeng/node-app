/*!
 * dispath.js, dispatch app workers.
 * Copyright(c) 2012
 * Author: jifeng <wade428S@163.com>
 */

/**
 * Module dependencies.
 */

var util = require('util');
var path = require('path');
var config = require('./config');

if (config.enableCluster) {
  var workerpath = path.join(__dirname, 'worker.js');
  var cluster = require("cluster");
  var restartTime = 5000;

  cluster.setupMaster({
    exec : workerpath
  });

  cluster.on('fork', function (worker) {
    console.log('[%s] [worker:%d] new worker start', new Date(), worker.process.pid);
  });

  cluster.on('exit', function (worker, code, signal) {

    var exitCode = worker.process.exitCode;
    var err = new Error(util.format('worker %s died (code: %s, signal: %s)', worker.process.pid, exitCode, signal));
    err.name = 'WorkerDiedError';
    //报警

    // restart
    setTimeout(function () {
      cluster.fork();
    }, restartTime);
  });

  var numCPUs = require('os').cpus().length;
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

} else {
  require('./worker');
}

console.log('[%s] [master:%d] Server started, listen at %d, cluster: %s',
  new Date(), process.pid, config.port, config.enableCluster);
