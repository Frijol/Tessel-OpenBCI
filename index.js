// Talks on SPI
// SCK rates: 1MHz, 4MHz, 8MHz

// Defining variables from the Arduino library

var SPI_DATA_MODE = 0x04; //CPOL = 0; CPHA = 1 (Datasheet, p8)
var SPI_MODE_MASK = 0x0C;  // mask of CPOL and CPHA  on SPCR
var SPI_CLOCK_MASK = 0x03;  // SPR1 = bit 1, SPR0 = bit 0 on SPCR
var SPI_2XCLOCK_MASK = 0x01;  // SPI2X = bit 0 on SPSR
var SPI_CLOCK_DIV_2 = 0X04;	// 8MHz SPI SCK
var SPI_CLOCK_DIV_4 = 0X00;	// 4MHz SPI SCK
var SPI_CLOCK_DIV_16 = 0x01;    // 1MHz SPI SCK

// SPI Command Definition Byte Assignments (Datasheet, p35)
var _WAKEUP = 0x02; // Wake up from standby mode
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