// Checks API calls to make sure they work
var tinytap = require('tinytap');
var async = require('async');

var tessel = require('tessel');
var portname = process.argv[2] || 'A';
var BCILib = require('./');
var BCI = BCILib.use(tessel.port[portname]);

BCI._reset(function () {
  console.log('reset')
  BCI._start(function () {
    console.log('started')
    BCI._rdatac(function () {
      console.log('did something')
    });
  });
});