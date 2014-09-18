
//~ rtc.writeBytes(0x0F, [0x00], console.log);

var rtc = require('./ds1337.js'),
	clock = new rtc({device:'/dev/i2c-1'});

var d = new Date();

d.setHours(17,18,0);




console.log(clock.alarmOne);
//~ console.log(clock.alarmOneRate);
//~ clock.setAlarmOneRate(0,0,0,0,0);
//~ console.log(clock.alarmOne);
//~ console.log(clock.alarmOneRate);


clock.disableAlarmOne();
//~ clock.disableAlarmTwo();
//~ 
clock.clearAlarmOneFlag();
//~ clock.clearAlarmTwoFlag();


//~ console.log(clock.alarmTwo);
//~ console.log(clock.alarmTwoRate);
clock.setAlarmOne(d);
//~ clock.setAlarmTwo(d);
console.log(clock.alarmOne);
//~ console.log(clock.alarmTwo);
//~ 
clock.enableAlarmOne();
//~ clock.enableAlarmTwo();


