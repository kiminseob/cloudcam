(function() {
	'use strict';

	module.exports.getNetworkIp = function(callback, bypassCache) {
		const ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
		const exec = require('child_process').exec;

		// ############################################################
		/*
		callback(null, "192.168.0.80");
		return;
		*/
		// ############################################################

		let cached;
		let command;
		let filterRE;
		
		console.log("process.platform : " + process.platform);

		switch(process.platform) {
			case 'darwin' :
				command = 'ifconfig';
				filterRE = /\binet\s+([^\s]+)/g;
				break;
			default:
				command = 'ifconfig';
				filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
				break;
		}
		
		console.log("filterRE : " + filterRE);

		// Get host from env variable
		console.log("process.env.HOSTNAME : " + process.env.HOSTNAME);
		var isPass = false;
		if(isPass == false) {
			if(process.env.HOSTNAME) {
				/*
				callback(null, process.env.HOSTNAME);
				callback(null, "dev.ydns.co.kr");
				callback(null, "121.167.147.208");
				*/
				callback(null, process.env.HOSTNAME);
				return;
			}
		}

		// get cached value
		if(cached && !bypassCache) {
			callback(null, cached);
			return;
		}
		
		console.log("system call");
		// system call
		exec(command, function(error, stdout, sterr) {
			var ips = [];
		
			// extract IPs
			var matches = stdout.match(filterRE);

			// JS has no lookbehind REs, so we need a trick
			for(var i=0; i<matches.length; i++) {
				ips.push(matches[i].replace(filterRE, '$1'));
			}

			// filter BS
			for(var i=0, l=ips.length; i<l; i++) {
				if(!ignoreRE.test(ips[i])) {
					//if (!error) {
					cached = ips[i];
					//}
					callback(error, ips[i]);
					return;
				}
			}
		
			// nothing found
			callback(error, null);
		});
	}
})();