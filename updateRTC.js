var rtc = require('./ds1337.js'),
	clock = new rtc({device:'/dev/i2c-1'});

var d = new Date();
clock.setTime(d);
console.log(d);

