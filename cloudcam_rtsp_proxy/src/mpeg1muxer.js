(function() {
	'use strict';

	const childProcess = require('child_process'),
	util = require('util'),
	events = require('events');

	class Mpeg1Muxer extends events.EventEmitter {
		constructor(options) {
			super();
			this.url = options.url;
			console.log("this.url " + this.url);

			if(true) {
				//ffmpeg -rtsp_transport tcp -i "$1" -f mpeg1video -b:v 1000k -bf 0 -r 25 -video_size 1920x1080 -
				this.stream = childProcess.spawn('"ffmpegcall.sh" "' + this.url + '"', [
				], {
					detached : false,
					shell : true 
				});
			}
			if(false) {
				this.stream = childProcess.spawn('ffmpeg', [
					"-rtsp_transport", "tcp",
					"-i", this.url,
					"-f", "mpeg1video",
					/*
					"-b:v", "800k",
					"-r", "30",
					*/
					"-b:v", "1000k",
					"-bf", "0",
					"-r", "25",
					"-video_size", "1920x1080",
					"-"
				], {
					detached : false
				});
			}
		
			this.pid = this.stream.pid;
			this.inputStreamStarted = true;
			this.stream.stdout.on('data', (data) => {
				return this.emit('mpeg1data', data);
			});

			this.stream.stderr.on('data', (data) => {
				return this.emit('ffmpegError', data);
			});
		}
	
		closeMuxer() {
			if(this.stream != null) {
				/*
				console.log("closeMuxer : this.stream kill");
				*/
				this.stream.kill();
				this.stream.stdin.write('q');
			}
		}
	};

	module.exports = Mpeg1Muxer;
}());