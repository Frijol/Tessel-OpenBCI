var tessel = require('tessel');
var BCILib = require('./');
var BCI = BCILib.use(tessel.port['A']);

BCI._reset(function () {
  console.log('reset')
  BCI._start(function () {
    console.log('started')
    BCI._rdatac(function () {
      console.log('did something')
    });
  });
});