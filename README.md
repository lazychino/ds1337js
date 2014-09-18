# DS1337js

nodejs driver for RTC DS1337, enables reading and writing time to the RTC and
using the 2 RTC alarms

Was develop using a beaglebone it should work with rasberry pi also or any 
device that can use [node-i2c](https://github.com/kelly/node-i2c)

Basic usage

```javascript
var rtc = require('./ds1337.js'),
	clock = new rtc({device:'/dev/i2c-1'}); // change /dev/i2c-1 with your device
    
var now = new Date(); 

clock.setTime(now);

clock.getTime(function(datetime) {
    console.log(datetime+"\r");
});

```
