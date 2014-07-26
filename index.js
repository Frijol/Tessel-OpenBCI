var SPI_DATA_MODE = 0x04; //CPOL = 0; CPHA = 1 (Datasheet, p8)
var SPI_MODE_MASK = 0x0C;  // mask of CPOL and CPHA  on SPCR
var SPI_CLOCK_MASK = 0x03;  // SPR1 = bit 1, SPR0 = bit 0 on SPCR
var SPI_2XCLOCK_MASK = 0x01;  // SPI2X = bit 0 on SPSR
var SPI_CLOCK_DIV_2 = 0X04;	// 8MHz SPI SCK
var SPI_CLOCK_DIV_4 = 0X00;	// 4MHz SPI SCK
var SPI_CLOCK_DIV_16 = 0x01;    // 1MHz SPI SCK

// SPI Command Definition Byte Assignments (Datasheet, p35)
var _WAKEUP = 0x02; // Wake up from Standby mode
var _STANDBY = 0x04; // Enter Standby mode
var _RESET = 0x06; // Reset the device registers to default
var _START = 0x08; // Start and restart (synchronize) conversions
var _STOP = 0x0A; // Stop conversion
var _RDATAC = 0x10; // Enable Read Data Continuous mode (default mode at power-up)
var _SDATAC = 0x11; // Stop Read Data Continuous mode
var _RDATA = 0x12; // Read data by command; supports multiple read back


// Register Addresses
var ID = 0x00;
var CONFIG1 = 0x01;
var CONFIG2 = 0x02;
var CONFIG3 = 0x03;
var LOFF =  0x04;
var CH1SET= 0x05;
var CH2SET = 0x06;
var CH3SET = 0x07;
var CH4SET = 0x08;
var CH5SET = 0x09;
var CH6SET = 0x0A;
var CH7SET = 0x0B;
var CH8SET = 0x0C;
var BIAS_SENSP = 0x0D;
var BIAS_SENSN = 0x0E;
var LOFF_SENSP = 0x0F;
var LOFF_SENSN = 0x10;
var LOFF_FLIP = 0x11;
var LOFF_STATP = 0x12;
var LOFF_STATN = 0x13;
var GPIO = 0x14;
var MISC1 = 0x15;
var MISC2 = 0x16;
var CONFIG4 = 0x17;


// This commented mess is all from the Ambient module

function BCI(hardware, callback) {

  this.hardware = hardware;

  // Set the reset pin
  this.reset = hardware.digital[2].output(true);
  
  // Set up our IRQ as a pull down
  this.irq = hardware.digital[1].input().rawWrite('low');
  
  // Set chip select
  this.chipSelect = hardware.digital[0].output(true);
  
  // // Global connected. We may use this in the future
  // this.connected = false;
  // 
  // Initialize SPI in SPI mode 2 (data on falling edge)
  // Chip Select delay of 500us to accommodate SPI setup time of 50-300us
  // Currently hardcoded to 4MHz
  this.spi = new hardware.SPI({clockSpeed:4*1000*1000, mode:0, chipSelect:this.chipSelect, chipSelectDelayUs:500});
  
  var self = this;
  // 
  // // Make sure we can communicate with the module
  // self._establishCommunication(5, function(err, version) {
  //   if (err) {
  //     // Emit the error
  //     self.emit('error', err);
  // 
  //     // Call the callback with an error
  //     if (callback) {
  //       callback(err);
  //     }
  // 
  //     return null;
  //   } else {
  //     self.connected = true;
  // 
  //     // Start listening for IRQ interrupts
  //     self.irq.once('high', self._fetchTriggerValues.bind(self));
  // 
  //     // If someone starts listening
  //     self.on('newListener', function(event) {
  //       // and there weren't listeners before
  //       if (!self.listeners(event).length)
  //       {
  //         // start retrieving data for this type of buffer
  //         self._setListening(true, event);
  //       }
  //     });
  // 
  //     // if someone stops listening
  //     self.on('removeListener', function(event)
  //     {
  //       // and there are none left
  //       if (!self.listeners(event).length)
  //       {
  //         // stop retrieving data
  //         self._setListening(false, event);
  //       }
  //     });
  // 
  //     // Emit the ready event
  //     callback && callback(null, self);
  //     self.emit('ready');
  //   }
  // });
}

// We want the ability to emit events
util.inherits(BCI, EventEmitter);

BCI.prototype._wakeUp = function (callback) {
  // only allowed to send WAKEUP after sending STANDBY
  this.chipSelect.output(false);
  this.spi.send(_WAKEUP, function (err) {
    setTimeout(function () {
      this.chipSelect.output(true);
      if (callback) {
        callback();
      }
    }, 3); //must wait 4 tCLK cycles before sending another command (Datasheet, pg. 35)
  });
};

BCI.prototype._standby = function (callback) {
  this.chipSelect.output(false);
  this.spi.send(_STANDBY, function (err) {
    this.chipSelect.output(true);
    if (callback) {
      callback();
    }
  });
};

// Reset all the registers to default settings
BCI.prototype._reset = function (callback) {
  this.chipSelect.output(false);
  this.spi.send(_RESET, function (err) {
    setTimeout(function () {
      this.chipSelect.output(true);
      if (callback) {
        callback();
      }
    }, 12); //must wait 18 tCLK cycles to execute this command (Datasheet, pg. 35)
  });
};

// Start data conversion
BCI.prototype._start = function (callback) {
  this.chipSelect.output(false);
  this.spi.send(_START, function (err) {
    this.chipSelect.output(true);
    if (callback) {
      callback();
    }
  });
};

// Stop data conversion
BCI.prototype._stop = function (callback) {
  this.chipSelect.output(false);
  this.spi.send(_STOP, function (err) {
    this.chipSelect.output(true);
    if (callback) {
      callback();
    }
  });
};

// Read data continuously
BCI.prototype._rdatac = function (callback) {
  this.chipSelect.output(false);
  this.spi.send(_RDATAC, function (err) {
    setTimeout(function () {
      this.chipSelect.output(true);
      if (callback) {
        callback();
      }
    }, 3);
  });
};

// Send data continuously
BCI.prototype._sdatac = function (callback) {
  this.chipSelect.output(false);
  this._send(_SDATAC, function (err) {
    setTimeout(function () {
      this.chipSelect.output(true);
      if (callback) {
        callback();
      }
    }, 3); //must wait 4 tCLK cycles after executing this command (Datasheet, pg. 37)
  });
};


function use (hardware, callback) {
  if(!hardware) {
    console.log(new Error('Improperly specified Tessel port.'));
  }
  return new BCI(hardware, callback);
}

exports.BCI = BCI;
exports.use = use;