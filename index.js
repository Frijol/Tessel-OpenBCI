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

// // We want the ability to emit events
// util.inherits(BCI, EventEmitter);

BCI.prototype._wakeUp = function (callback) {
  // only allowed to send WAKEUP after sending STANDBY
  this.chipSelect.output(false);
  this.spi.transfer(new Buffer([_WAKEUP]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    setTimeout(function () {
      this.chipSelect.output(true);
      if (callback) {
        callback(null, rxbuf);
      }
    }, 3); //must wait 4 tCLK cycles before sending another command (Datasheet, pg. 35)
  });
};

BCI.prototype._standby = function (callback) {
  this.chipSelect.output(false);
  this.spi.transfer(new Buffer([_STANDBY]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    this.chipSelect.output(true);
    if (callback) {
      callback(null, rxbuf);
    }
  });
};

// Reset all the registers to default settings
BCI.prototype._reset = function (callback) {
  var self = this;
  self.chipSelect.output(false);
  self.spi.transfer(new Buffer([_RESET]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    setTimeout(function () {
      self.chipSelect.output(true);
      if (callback) {
        callback(null, rxbuf);
      }
    }, 12); //must wait 18 tCLK cycles to execute this command (Datasheet, pg. 35)
  });
};

// Start data conversion
BCI.prototype._start = function (callback) {
  this.chipSelect.output(false);
  this.spi.transfer(new Buffer([_START]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    this.chipSelect.output(true);
    if (callback) {
      callback(null, rxbuf);
    }
  });
};

// Stop data conversion
BCI.prototype._stop = function (callback) {
  this.chipSelect.output(false);
  this.spi.transfer(new Buffer([_STOP]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    this.chipSelect.output(true);
    if (callback) {
      callback(null, rxbuf);
    }
  });
};

// Read data continuously
BCI.prototype._rdatac = function (callback) {
  var self = this;
  self.chipSelect.output(false);
  self.spi.transfer(new Buffer([_RDATAC]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    setTimeout(function () {
      self.chipSelect.output(true);
      if (callback) {
        callback(null, rxbuf);
      }
    }, 3);
  });
};

// Send data continuously
BCI.prototype._sdatac = function (callback) {
  var self = this;
  self.chipSelect.output(false);
  self.spi.transfer(new Buffer([_SDATAC]), function (err, rxbuf) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return err;
    }
    setTimeout(function () {
      self.chipSelect.output(true);
      if (callback) {
        callback(null, rxbuf);
      }
    }, 3); //must wait 4 tCLK cycles after executing this command (Datasheet, pg. 37)
  });
};

// BCI.prototype._getDeviceID = function (callback) {
//   // byte ADS1299::getDeviceID() {			// simple hello world com check
//   //   byte data = RREG(0x00);
//   //   if(verbose){						// verbose otuput
//   //     Serial.print(F("Device ID "));
//   //     printHex(data);	
//   //   }
//   //   return data;
//   // }
// }
// 
// BCI.prototype._readOneRegister = function (address, callback) {
//   var opcode1 = 
// }


/***** unimplemented Arduino functions ******/

// // Register Read/Write Commands
// 
// 
// byte ADS1299::RREG(byte _address) {		//  reads ONE register at _address
//     byte opcode1 = _address + 0x20; 	//  RREG expects 001rrrrr where rrrrr = _address
//     digitalWrite(CS, LOW); 				//  open SPI
//     transfer(opcode1); 					//  opcode1
//     transfer(0x00); 					//  opcode2
//     regData[_address] = transfer(0x00);//  update mirror location with returned byte
//     digitalWrite(CS, HIGH); 			//  close SPI	
// 	if (verbose){						//  verbose output
// 		printRegisterName(_address);
// 		printHex(_address);
// 		Serial.print(", ");
// 		printHex(regData[_address]);
// 		Serial.print(", ");
// 		for(byte j = 0; j<8; j++){
// 			Serial.print(bitRead(regData[_address], 7-j));
// 			if(j!=7) Serial.print(", ");
// 		}
// 		
// 		Serial.println();
// 	}
// 	return regData[_address];			// return requested register value
// }
// 
// // Read more than one register starting at _address
// void ADS1299::RREGS(byte _address, byte _numRegistersMinusOne) {
// //	for(byte i = 0; i < 0x17; i++){
// //		regData[i] = 0;					//  reset the regData array
// //	}
//     byte opcode1 = _address + 0x20; 	//  RREG expects 001rrrrr where rrrrr = _address
//     digitalWrite(CS, LOW); 				//  open SPI
//     transfer(opcode1); 					//  opcode1
//     transfer(_numRegistersMinusOne);	//  opcode2
//     for(int i = 0; i <= _numRegistersMinusOne; i++){
//         regData[_address + i] = transfer(0x00); 	//  add register byte to mirror array
// 		}
//     digitalWrite(CS, HIGH); 			//  close SPI
// 	if(verbose){						//  verbose output
// 		for(int i = 0; i<= _numRegistersMinusOne; i++){
// 			printRegisterName(_address + i);
// 			printHex(_address + i);
// 			Serial.print(", ");
// 			printHex(regData[_address + i]);
// 			Serial.print(", ");
// 			for(int j = 0; j<8; j++){
// 				Serial.print(bitRead(regData[_address + i], 7-j));
// 				if(j!=7) Serial.print(", ");
// 			}
// 			Serial.println();
// 		}
//     }
//     
// }
// 
// void ADS1299::WREG(byte _address, byte _value) {	//  Write ONE register at _address
//     byte opcode1 = _address + 0x40; 	//  WREG expects 010rrrrr where rrrrr = _address
//     digitalWrite(CS, LOW); 				//  open SPI
//     transfer(opcode1);					//  Send WREG command & address
//     transfer(0x00);						//	Send number of registers to read -1
//     transfer(_value);					//  Write the value to the register
//     digitalWrite(CS, HIGH); 			//  close SPI
// 	regData[_address] = _value;			//  update the mirror array
// 	if(verbose){						//  verbose output
// 		Serial.print(F("Register "));
// 		printHex(_address);
// 		Serial.println(F(" modified."));
// 	}
// }
// 
// void ADS1299::WREGS(byte _address, byte _numRegistersMinusOne) {
//     byte opcode1 = _address + 0x40;		//  WREG expects 010rrrrr where rrrrr = _address
//     digitalWrite(CS, LOW); 				//  open SPI
//     transfer(opcode1);					//  Send WREG command & address
//     transfer(_numRegistersMinusOne);	//	Send number of registers to read -1	
// 	for (int i=_address; i <=(_address + _numRegistersMinusOne); i++){
// 		transfer(regData[i]);			//  Write to the registers
// 	}	
// 	digitalWrite(CS,HIGH);				//  close SPI
// 	if(verbose){
// 		Serial.print(F("Registers "));
// 		printHex(_address); Serial.print(F(" to "));
// 		printHex(_address + _numRegistersMinusOne);
// 		Serial.println(F(" modified"));
// 	}
// }
// 
// 
// void ADS1299::updateChannelData(){
// 	byte inByte;
// 	int nchan=8;  //assume 8 channel.  If needed, it automatically changes to 16 automatically in a later block.
// 	digitalWrite(CS, LOW);				//  open SPI
// 	
// 	// READ CHANNEL DATA FROM FIRST ADS IN DAISY LINE
// 	for(int i=0; i<3; i++){			//  read 3 byte status register from ADS 1 (1100+LOFF_STATP+LOFF_STATN+GPIO[7:4])
// 		inByte = transfer(0x00);
// 		stat_1 = (stat_1<<8) | inByte;				
// 	}
// 	
// 	for(int i = 0; i<8; i++){
// 		for(int j=0; j<3; j++){		//  read 24 bits of channel data from 1st ADS in 8 3 byte chunks
// 			inByte = transfer(0x00);
// 			channelData[i] = (channelData[i]<<8) | inByte;
// 		}
// 	}
// 	
// 	if (isDaisy) {
// 		nchan = 16;
// 		// READ CHANNEL DATA FROM SECOND ADS IN DAISY LINE
// 		for(int i=0; i<3; i++){			//  read 3 byte status register from ADS 2 (1100+LOFF_STATP+LOFF_STATN+GPIO[7:4])
// 			inByte = transfer(0x00);
// 			stat_2 = (stat_1<<8) | inByte;				
// 		}
// 		
// 		for(int i = 8; i<16; i++){
// 			for(int j=0; j<3; j++){		//  read 24 bits of channel data from 2nd ADS in 8 3 byte chunks
// 				inByte = transfer(0x00);
// 				channelData[i] = (channelData[i]<<8) | inByte;
// 			}
// 		}
// 	}
// 	
// 	digitalWrite(CS, HIGH);				//  close SPI
// 	
// 	//reformat the numbers
// 	for(int i=0; i<nchan; i++){			// convert 3 byte 2's compliment to 4 byte 2's compliment	
// 		if(bitRead(channelData[i],23) == 1){	
// 			channelData[i] |= 0xFF000000;
// 		}else{
// 			channelData[i] &= 0x00FFFFFF;
// 		}
// 	}
// }
// 
// 	
// //read data
// void ADS1299::RDATA() {				//  use in Stop Read Continuous mode when DRDY goes low
// 	byte inByte;
// 	stat_1 = 0;							//  clear the status registers
// 	stat_2 = 0;	
// 	int nchan = 8;	//assume 8 channel.  If needed, it automatically changes to 16 automatically in a later block.
// 	digitalWrite(CS, LOW);				//  open SPI
// 	transfer(_RDATA);
// 	
// 	// READ CHANNEL DATA FROM FIRST ADS IN DAISY LINE
// 	for(int i=0; i<3; i++){			//  read 3 byte status register (1100+LOFF_STATP+LOFF_STATN+GPIO[7:4])
// 		inByte = transfer(0x00);
// 		stat_1 = (stat_1<<8) | inByte;				
// 	}
// 	
// 	for(int i = 0; i<8; i++){
// 		for(int j=0; j<3; j++){		//  read 24 bits of channel data from 1st ADS in 8 3 byte chunks
// 			inByte = transfer(0x00);
// 			channelData[i] = (channelData[i]<<8) | inByte;
// 		}
// 	}
// 	
// 	if (isDaisy) {
// 		nchan = 16;
// 		
// 		// READ CHANNEL DATA FROM SECOND ADS IN DAISY LINE
// 		for(int i=0; i<3; i++){			//  read 3 byte status register (1100+LOFF_STATP+LOFF_STATN+GPIO[7:4])
// 			inByte = transfer(0x00);
// 			stat_2 = (stat_1<<8) | inByte;				
// 		}
// 		
// 		for(int i = 8; i<16; i++){
// 			for(int j=0; j<3; j++){		//  read 24 bits of channel data from 2nd ADS in 8 3 byte chunks
// 				inByte = transfer(0x00);
// 				channelData[i] = (channelData[i]<<8) | inByte;
// 			}
// 		}
// 	}
// 	
// 	for(int i=0; i<nchan; i++){			// convert 3 byte 2's compliment to 4 byte 2's compliment	
// 		if(bitRead(channelData[i],23) == 1){	
// 			channelData[i] |= 0xFF000000;
// 		}else{
// 			channelData[i] &= 0x00FFFFFF;
// 		}
// 	}
// 	
//     
// }
// 
// 
// 
// // String-Byte converters for RREG and WREG
// void ADS1299::printRegisterName(byte _address) {
//     if(_address == ID){
//         Serial.print(F("ID, ")); //the "F" macro loads the string directly from Flash memory, thereby saving RAM
//     }
//     else if(_address == CONFIG1){
//         Serial.print(F("CONFIG1, "));
//     }
//     else if(_address == CONFIG2){
//         Serial.print(F("CONFIG2, "));
//     }
//     else if(_address == CONFIG3){
//         Serial.print(F("CONFIG3, "));
//     }
//     else if(_address == LOFF){
//         Serial.print(F("LOFF, "));
//     }
//     else if(_address == CH1SET){
//         Serial.print(F("CH1SET, "));
//     }
//     else if(_address == CH2SET){
//         Serial.print(F("CH2SET, "));
//     }
//     else if(_address == CH3SET){
//         Serial.print(F("CH3SET, "));
//     }
//     else if(_address == CH4SET){
//         Serial.print(F("CH4SET, "));
//     }
//     else if(_address == CH5SET){
//         Serial.print(F("CH5SET, "));
//     }
//     else if(_address == CH6SET){
//         Serial.print(F("CH6SET, "));
//     }
//     else if(_address == CH7SET){
//         Serial.print(F("CH7SET, "));
//     }
//     else if(_address == CH8SET){
//         Serial.print(F("CH8SET, "));
//     }
//     else if(_address == BIAS_SENSP){
//         Serial.print(F("BIAS_SENSP, "));
//     }
//     else if(_address == BIAS_SENSN){
//         Serial.print(F("BIAS_SENSN, "));
//     }
//     else if(_address == LOFF_SENSP){
//         Serial.print(F("LOFF_SENSP, "));
//     }
//     else if(_address == LOFF_SENSN){
//         Serial.print(F("LOFF_SENSN, "));
//     }
//     else if(_address == LOFF_FLIP){
//         Serial.print(F("LOFF_FLIP, "));
//     }
//     else if(_address == LOFF_STATP){
//         Serial.print(F("LOFF_STATP, "));
//     }
//     else if(_address == LOFF_STATN){
//         Serial.print(F("LOFF_STATN, "));
//     }
//     else if(_address == GPIO){
//         Serial.print(F("GPIO, "));
//     }
//     else if(_address == MISC1){
//         Serial.print(F("MISC1, "));
//     }
//     else if(_address == MISC2){
//         Serial.print(F("MISC2, "));
//     }
//     else if(_address == CONFIG4){
//         Serial.print(F("CONFIG4, "));
//     }
// }
// 
// //SPI communication methods
// byte ADS1299::transfer(byte _data) {
// 	cli();
//     SPDR = _data;
//     while (!(SPSR & _BV(SPIF)))
//         ;
// 	sei();
//     return SPDR;
// }
// 
// // Used for printing HEX in verbose feedback mode
// void ADS1299::printHex(byte _data){
// 	Serial.print("0x");
//     if(_data < 0x10) Serial.print("0");
//     Serial.print(_data, HEX);
// }

/**** end unimplemented Arduino functions ****/

function use (hardware, callback) {
  if(!hardware) {
    console.log(new Error('Improperly specified Tessel port.'));
  }
  return new BCI(hardware, callback);
}

exports.BCI = BCI;
exports.use = use;