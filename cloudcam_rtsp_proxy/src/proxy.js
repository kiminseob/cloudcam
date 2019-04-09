(function() {
	'use strict';

	const redbird = require('redbird'),
	networkUtils = require('../util/network');

	class Proxy {
		constructor(port) {
			this.registeredRoutes = {};
			this.proxy = redbird({
				port : port || 9001,
				xfwd : false
			});

			networkUtils.getNetworkIp((error, ip) => {
				if(error) {
					console.log('error:', error);
					process.exit(1);
				}
				else {
					console.log("ip >>>> " + ip);
				}
				
				console.log("------------------------ constructor register ------------------------------");
				this.proxy.register(ip + '/get_stream', 'http://localhost/get_stream');
				this.proxy.register(ip, 'http://localhost');

				/*
				ip = "121.167.147.208:30006";
				this.proxy.register(ip + '/get_stream', 'http://localhost/get_stream');
				this.proxy.register(ip, 'http://localhost');
				*/
			}, true);
		}

		register(hash, from, to) {
			if(this.registeredRoutes.hasOwnProperty(hash)) {
				console.log("------------------------ unregister in register ------------------------------");
				this.proxy.unregister(this.registeredRoutes[hash]);
			}
			console.log("------------------------ register start------------------------------");
			console.log(hash + " / " + from + " / " + to);
			this.registeredRoutes[hash] = from;
			this.proxy.register(from, to);
			console.log("------------------------ register end------------------------------");
		}

		unregister(hash) {
			console.log("------------------------ unregister start ------------------------------");
			if(this.registeredRoutes.hasOwnProperty(hash)) {
				this.proxy.unregister(this.registeredRoutes[hash]);
			}
			console.log("------------------------ unregister end ------------------------------");
		}
	}

	module.exports = Proxy;
}());