var tessel = require('tessel');
var BCILib = require('./');
var BCI = BCILib.use(tessel.port['A']);

BCI._reset(function () {
  BCI._start(function () {
    BCI._rdatac(function () {
      
    });
  });
});