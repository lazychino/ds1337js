
var RTC = function(options) {
	var i2c = require('i2c');
	this.device = options.device;
	this.address = 0x68;
	this.rtc = new i2c(this.address, {device: this.device});
	this.updateAlarmOneInfo();
	this.updateAlarmTwoInfo();
}

RTC.prototype.getTime = function(callback) {
	this.rtc.readBytes(0x00, 0x07, function(err, res) {	
		var sec = (res[0] >> 4)*10 + (res[0] & 0x0F); 				// seconds	
		var min = (res[1] >> 4)*10 + (res[1] & 0x0F); 				// minutes	
		var hour = ((res[2] & 0x30) >> 4)*10 + (res[2] & 0x0F); 	// hours	
		var mode = (res[2] & 0x40) >> 6 ? "12h" : "24h"; 			// hour mode default 24
		var day = res[3];											// day of week
		var mday = (res[4] >> 4)*10 + (res[4] & 0x0F); 				// day of month
		var month = ((res[5] & 0x10) >> 4)*10 + (res[5] & 0x0F);	// month
		var year = (res[6] >> 4)*10 + (res[6] & 0x0F);				// year
		
		callback(new Date(2000+year, --month, mday, hour, min, sec));
	});
};

RTC.prototype.writeToSystem = function() {
	this.getTime(function(datetime){
		var spawn = require('child_process').spawn,
			setDate = spawn('date', ['--set', datetime.toString()]);  
		
		setDate.on('close', function (code) {
			if(code)
				console.log('error! exited with code ' + code);
		});
	});
};

RTC.prototype.setTime = function(datetime) {
	if(!datetime instanceof Date) throw new Error();
	
	var bytes = [];
	bytes[0] = Math.floor(datetime.getSeconds()/10) << 4 | datetime.getSeconds()%10;
	bytes[1] = Math.floor(datetime.getMinutes()/10) << 4 | datetime.getMinutes()%10;
	bytes[2] = Math.floor(datetime.getHours()/10) << 4 | datetime.getHours()%10;
	bytes[3] = datetime.getDay() + 1;
	bytes[4] = Math.floor(datetime.getDate()/10) << 4 | datetime.getDate()%10;
	var month = datetime.getMonth() + 1;
	bytes[5] = Math.floor(month/10) << 4 | month%10;
	var year = datetime.getYear()%100;
	bytes[6] = Math.floor(year/10) << 4 | year%10;
	
	//~ console.log(bytes);
	//~ 
	//~ for(var i=0; i < bytes.length; i++) {
		//~ console.log(bytes[i].toString(16));
	//~ }
	
	this.rtc.writeBytes(0x00, bytes);
};

RTC.prototype.alterRegister = function(register, mask, clearSet) {
	var byte = mask;
	this.rtc.readBytes(register, register+1, function(err, res) {
		if(clearSet == "clear")
			byte &= res[0];
		else
			byte |= res[0];
	});
	this.rtc.writeBytes(register, [ byte ]);
};

RTC.prototype.enableAlarmOne = function() {
	this.alterRegister(0x0E, 0x01, "set");
};

RTC.prototype.enableAlarmTwo = function() {
	this.alterRegister(0x0E, 0x02, "set");
};

RTC.prototype.disableAlarmOne = function() {
	this.alterRegister(0x0E, 0xFE, "clear");
};

RTC.prototype.disableAlarmTwo = function() {
	this.alterRegister(0x0E, 0xFD, "clear");
};

RTC.prototype.setAlarmOne = function(datetime) {
	if(!datetime instanceof Date) throw new Error();
	
	var bytes = [];
	
	this.rtc.readBytes(0x07, 0x0B, function(err, res) {
		bytes[0] = res[0] & 0x80;
		bytes[1] = res[1] & 0x80;
		bytes[2] = res[2] & 0x80;
		bytes[3] = res[3] & 0x80;
		
		bytes[0] |= Math.floor(datetime.getSeconds()/10) << 4 | datetime.getSeconds()%10;
		bytes[1] |= Math.floor(datetime.getMinutes()/10) << 4 | datetime.getMinutes()%10;
		bytes[2] |= Math.floor(datetime.getHours()/10) << 4 | datetime.getHours()%10;
		bytes[3] |= Math.floor(datetime.getDate()/10) << 4 | datetime.getDate()%10;
	});
	
	this.rtc.writeBytes(0x07, bytes);
	this.updateAlarmOneInfo();
};

RTC.prototype.updateAlarmOneInfo = function() {
	var esto = this;
	this.rtc.readBytes(0x07, 0x0B, function(err, res) {
		esto.alarmOneRate = {
			'DYDT': (res[3] & 0x40) >> 6, 
			'A1M4': (res[3] & 0x80) >> 7, 
			'A1M3': (res[2] & 0x80) >> 7,
			'A1M2': (res[1] & 0x80) >> 7,
			'A1M1': (res[0] & 0x80) >> 7
		};
		
		var sec = ((res[0] & 0x70) >> 4)*10 + (res[0] & 0x0F); 				// seconds	
		var min = ((res[1] & 0x70) >> 4)*10 + (res[1] & 0x0F); 				// minutes	
		var hour = ((res[2] & 0x30) >> 4)*10 + (res[2] & 0x0F); 	// hours	
		var mode = (res[2] & 0x40) >> 6 ? "12h" : "24h"; 			// hour mode default 24
		var mday = ((res[3] & 0x30) >> 4)*10 + (res[3] & 0x0F); 				// day of month
		
		esto.alarmOne = {
			'date': mday, 
			'hour': hour,
			'min': min,
			'sec': sec, 
			'12/24': mode
		};
	});
};

RTC.prototype.setAlarmTwo = function(datetime) {
	if(!datetime instanceof Date) throw new Error();
	
	var bytes = [];
	
	this.rtc.readBytes(0x0B, 0x0E, function(err, res) {
		bytes[0] = res[0] & 0x80;
		bytes[1] = res[1] & 0x80;
		bytes[2] = res[2] & 0x80;
		
		bytes[0] |= (Math.floor(datetime.getMinutes()/10) << 4 | datetime.getMinutes()%10);
		bytes[1] |= (Math.floor(datetime.getHours()/10) << 4 | datetime.getHours()%10);
		bytes[2] |= (Math.floor(datetime.getDate()/10) << 4 | datetime.getDate()%10);
	});
	
	this.rtc.writeBytes(0x0B, bytes);
	this.updateAlarmTwoInfo();
};

RTC.prototype.updateAlarmTwoInfo = function() {
	var esto = this;
	this.rtc.readBytes(0x0B, 0x0E, function(err, res) {

		esto.alarmTwoRate = {
			'DYDT': (res[2] & 0x40) >> 6, 
			'A2M4': (res[2] & 0x80) >> 7, 
			'A2M3': (res[1] & 0x80) >> 7,
			'A2M2': (res[0] & 0x80) >> 7
		};
		
		var min = ((res[0] & 0x70) >> 4)*10 + (res[0] & 0x0F); 			// minutes	
		var hour = ((res[1] & 0x30) >> 4)*10 + (res[1] & 0x0F); 		// hours	
		var mode = (res[1] & 0x40) >> 6 ? "12h" : "24h"; 				// hour mode default 24
		var mday = ((res[2] & 0x30) >> 4)*10 + (res[2] & 0x0F); 		// day of month
		
		esto.alarmTwo = {
			'date': mday,
			'hour': hour,
			'min': min,
			'12/24': mode
		};
	});
};

RTC.prototype.clearAlarmOneFlag = function() {
	this.alterRegister(0x0F, 0xFE, "clear");
};
RTC.prototype.clearAlarmTwoFlag = function() {
	this.alterRegister(0x0F, 0xFD, "clear");
};

RTC.prototype.setAlarmOneRate =  function(dydt, m4, m3, m2, m1) {
	//add error missing params and input val
	var bytes = [];
	
	this.rtc.readBytes(0x07, 0x0B, function(err, res) {
		bytes[0] = (res[0] & 0x7F) | (m1 << 7);
		bytes[1] = (res[1] & 0x7F) | (m2 << 7);
		bytes[2] = (res[2] & 0x7F) | (m3 << 7);
		bytes[3] = (res[3] & 0x3F) | (m4 << 7) | (dydt << 6);
		
		//~ console.log(bytes);
	});
	
	this.rtc.writeBytes(0x07, bytes);
	this.updateAlarmOneInfo();
};


module.exports = RTC;
