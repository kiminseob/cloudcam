'use strict';
// ############################################################################
const Stream = require('./src'),
crypto = require('crypto'),
redis = require('redis'),
async = require('async'),
redisClient = redis.createClient(),
express = require('express'),
app = express(),
bodyParser = require('body-parser'),
networkUtils = require('./util/network'),
Proxy = require('./src/proxy');

let minPort = 30000;
let maxPort = 33000;
let activeStreams = [].slice();

let majorIp = "myIp";
let majorHttpPort = "3000";
let majorProxyPort = "2024";

var cors = require('cors'); //추가
// ############################################################################
/*
* Generates a hash for an URL
*/
function _generateHash(url) {
	let cryptoUrl = crypto.createHash('md5').update(url).digest("hex");
	/*
	console.log("_generateHash : " + "url = " + url + " / cryptoUrl = " + cryptoUrl);
	*/
	return cryptoUrl;
}

// ############################################################################
/*
* Recursively finds a port that is not currently in use, returns -1 if all
* ports in range are being used.
*/
function _getRandomPort(blackList) {
	let port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;

	console.log(">>>>>>>>>>>>>> blackList : " + blackList);

	/* Finding if all ports are on blackList by checking its length
	 * TODO: Find a more efficient way to do this
	 */
	if(blackList.length >= (maxPort - minPort) + 1) {
		// I don't like this:
		return -1;
	}

	if(blackList.indexOf(port) !== -1) {
		return _getRandomPort(blackList);
	}

	console.log(">>>>>>>>>>>>>> port : " + port);

	return port;
}

// ############################################################################
/*
 * Generates an unused random port from minPort to maxPort
 */
function _getVirginPort(cb, usedPorts, port) {
	if(port) {
		return cb(null, port);
	}

	if(!usedPorts) {
		usedPorts = [];
	}

	/*
	console.log(">>>> usedPorts : " + usedPorts);
	*/

	port = _getRandomPort(usedPorts);

	if(port === -1) {
		return cb(new Error('All ports used'));
	}

	redisClient.get('port:' + port, function(err, data) {
		if(data == null || err) {
			// Port is virgin
			_getVirginPort(cb, usedPorts, port);
		} else {
			usedPorts.push(port);
			_getVirginPort(cb, usedPorts);
		}
	});
}

// ############################################################################
/*
 * Finds if an stream is already hashed and returns its port
 */
function _findHashStream(hash, cb) {
	redisClient.get('hash:' + hash, function(err, port) {
		/*
		console.log("------------------------ _findHashStream ------------------------------");
		console.log("err : " + err + " / port : " + port);
		*/
		if(err != null) {
			return cb(err);
		}

		if(!port) {
			return cb(null, false);
		}

		cb(null, parseInt(port, 10));

		/*
		console.log("------------------------ _findHashStream ------------------------------");
		*/
	});
}

// ############################################################################
function _createStream(hash, port, url, cb) {
	let stream = new Stream({
		name : hash,
		streamUrl : url,
		wsPort : port
	});

	stream.on('clients', function(clientCount) {
		_handleClientConnection(clientCount, stream);
	});

	// Should register the stream PID on redis
	redisClient.set('port:' + port + ':pid', stream.pid, function(err) {
		return cb(err, stream);
	});
}

// ############################################################################
function _checkPid(pid) {
	try {
		return process.kill(pid, 0);
	}
	catch(e) {
		return e.code === 'EPERM';
	}
}

// ############################################################################
function _handleClientConnection(clientCount, stream) {
	if(clientCount < 1) {
		console.log('No more clients!');
		
		// do something
		// Kill the stream in 1s
		if(!stream.isDying) {
			stream.isDying = true;
			console.log("------> stream.isDying : " + stream.isDying)
			stream.closeStream();
			/*
			stream.death = setTimeout(function() {
				console.log('DEATH');
				stream.closeStream();
			}, 1000);
			*/
		}
	}
}

// ############################################################################
function _clearStream(port, cb) {
	// Getting the stored hash from port number:
	redisClient.get('port:' + port, function(err, hash) {
		if(err) {
			return cb(err);
		}

		async.parallel([
			// Killing the port:
			function(callback) {
				redisClient.del('port:' + port, function(err) {
					callback(err);
				});
			},
			// Killing the pid:
			function(callback) {
				redisClient.del('port:' + port + ':pid', function(err) {
					callback(err);
				});
			},
			// Killing the hash:
			function(callback) {
				redisClient.del('hash:' + hash, function(err) {
					callback(err);
				});
			}
		], function(err) {
			cb(err);
		});
	});
}

// ############################################################################
function stream(streamUrl, cb) {
	/*
	let hash = _generateHash(streamUrl);
	*/
//	streamUrl = "rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov";
//	streamUrl = "rtsp://211.252.223.178/217/video1d";

//	streamUrl = "rtsp://vc-net2-ss9.sktelecom.com:8558/live?camID=117127&authtoken=DujPjs1larZJUObH%2FB7hbH6Rg8RMOOYIUf8Ox4ugfY3MZobQowi0Z%2FfGYD196W1GZt2ERCwuCwDSjvdBb7KNUB44unQ4wRDUCs6J%2FQeZIYHgbBB5BOfyXihmSXkfneaonZkpUV%2FVx3i8KPGHbCLmJdUvWENEofOsZHShP0%2FnY051L3sxIMbePA%3D%3D&rtspURI=rtsp://116.122.207.189:10915/117127/0";

//	streamUrl = "rtsp://vc-net2-ss14.sktelecom.com:8558/live?camID=117127&authtoken=DujPjs1larZJUObH%2FB7hbGxVwObCj3TW9JRX7cZxMAlnkqlv83VNIC1xYz57trRT1DmhF1smTyU%2Feik%2FqGmBXdgdKwAvS13Db%2B5kPMFhZLrIi3jTLGdTKxQSYdHIJ2Vmg5AxFmLpJAK9dTIhPP8DLYF%2Bf9cPsLkJr7UWmx1NOhkYYr6yr8rBJw%3D%3D&rtspURI=rtsp://116.122.207.189:10915/117127/0";
/*
	var targetUrl = streamUrl;
	if(streamUrl.indexOf("camID=") > -1 && streamUrl.indexOf("authtoken=") > -1 && streamUrl.indexOf("rtspURI=") > -1) {
		targetUrl = streamUrl.substring(
			streamUrl.indexOf("rtspURI=") + 8, streamUrl.length
		);
	}
*/
	/*
	console.log("targetUrl " + targetUrl);
	*/

	let hash = _generateHash(streamUrl);

	/*
	console.log("------------------------------ function stream(streamUrl, cb) ----------------------------------");
	console.log("let hash = _generateHash(streamUrl) : " + hash);
	*/

	_findHashStream(hash, function(err, port) {
		/*
		console.log("err : " + err + " / port = " + port);
		*/
		if(err) {
			// do something
			return cb(err);
		}

		if(!port) {
			// Create the stream
			_getVirginPort(function(err, port) {
				/*
				console.log("_getVirginPort err : " + err + " / port = " + port);
				*/
				if(err) {
					// do something
					return cb(err);
				}
				
				if(!port) {
					// do something too
					return cb(new Error('No ports are available'));
				}

				let stream = _createStream(hash, port, streamUrl, function(err, stream) {
					activeStreams.push(stream);

					// Setting the hash to the port on REDIS
					redisClient.set('hash:' + hash, port, function(err) {
						if(err) {
							return cb(err);
						}
						
						// Setting the port to the hash on REDIS
						redisClient.set('port:' + port, hash, function(err) {
							cb(err, port);
						});
					});
				});
			});
		} else {
			// Already has the port and is active
			redisClient.get('port:' + port + ':pid', function(err, pid) {
				let isAlive = _checkPid(pid);
				if(!isAlive) {
					// Clearing the stream from REDIS and trying to create it
					// again
					_clearStream(port, function(err) {
						if(err) {
							return cb(err);
						}

						// Trying again
						return stream(streamUrl, cb);
					});
				} else {
					cb(null, port);
				}
			});
		}
	});
}

// ############################################################################
app.use(bodyParser.json());

// ############################################################################
/*
 * Serve client folder statically
 */
app.use(express.static('client'));

// ############################################################################
let proxy = new Proxy();

app.get('/close_stream', function(req, res) {
	console.log("this.VideoStream : " + VideoStream);
});

/*
 * Configure express.js route to get stream
 */
// CORS 설정
app.use(cors());

app.post('/get_stream', function(req, res) {
	/*
	let url = decodeURIComponent(req.body.streamUrl);
	*/
	let url = req.body.streamUrl;
	
	/*
	console.log("------------------------------ app.post('/get_stream' star ----------------------------------");
	*/
	console.log("req.body.streamUrl : " + url);

	stream(url, function(err, port) {
		/*
		console.log("app.post('/get_stream' port : " + port);
		*/

		networkUtils.getNetworkIp(function (error, ip) {
			if(error) {
				ip = '127.0.0.1';
				console.log('Error getting ip, defaulting to 127.0.0.1');
			}

			let hash = _generateHash(url);
			
			/*
			let proxyUrl = ip + '/streams/' + hash;
			*/
			let proxyUrl = majorIp + ":" + majorProxyPort + '/streams/' + hash;
			proxy.register(hash, proxyUrl, 'http://localhost:' + port);
			res.send({
				proxy : 'ws://' + proxyUrl,
				hash : hash,
				port : port
			});
		}, false);
	});
});

// ############################################################################

app.get('/client', function(req, res) {
	console.log("client");
	res.sendFile(__dirname + '/client/player.html');
});


// ############################################################################
app.listen(majorHttpPort);

// ############################################################################

	module.exports._generateHash = _generateHash;
	module.exports._getVirginPort = _getVirginPort;
	module.exports._maxPort = maxPort;
	module.exports._minPort = minPort;
	module.exports._findHashStream = _findHashStream;
	module.exports._createStream = _createStream;
	module.exports.stream = stream;
	module.exports._limitPorts = function(min, max) {
		maxPort = max;
		minPort = min;
	};
