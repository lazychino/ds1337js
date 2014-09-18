
var rtc = require('./ds1337.js'),
	clock = new rtc({device:'/dev/i2c-1'});

var run = function() {
	clock.getTime(function(datetime) {
		console.log(datetime+"\r");
	});
};

run();

var loop = setInterval(run, 1000);
