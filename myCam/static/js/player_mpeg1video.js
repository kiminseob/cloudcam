(function(window, document) {
	'use strict';

	function Player(body, videoCanvasId) {
		console.log(body,"호롤로:", videoCanvasId)
		this.client = null;
		this.player = document.querySelector('.player');
		this.body = body;
		this.canvas = document.getElementById(videoCanvasId);
	}

	Player.prototype.init = function() {
		var ctx = this.canvas.getContext('2d');
		ctx.fillStyle = '#444';
		ctx.fillText('Loading...', this.canvas.width/2-30, this.canvas.height/3);

		this._jsonRequest('http://59.26.206.241:2022/get_stream', this.body, function(data) {
	
			if(typeof data !== 'object') {
				data = JSON.parse(data);
			}

			this._playVideo(data.proxy, data.port);
		}.bind(this));
	};

	// Taken from Underscore.js
	Player.prototype._debounce = function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this,
			args = arguments;
			var later = function() {
				timeout = null;
				if(!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if(callNow) func.apply(context, args);
		};
	};

	Player.prototype._jsonRequest = function(url, body, callback) {
		var xhr = new XMLHttpRequest();
		console.log("_jsonRequest body : " +  JSON.stringify(body));

		xhr.open('POST', url, true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify(body));

		xhr.onloadend = function() {
			console.log("xhr.onloadend : xhr.response " + xhr.response);
			callback(xhr.response);
		};
	};

	Player.prototype._generateCss = function(data) {
		var string = "";
		string += 'transparent url(data:image/jpeg;base64,' + data;
		string += ') top left / 100% 100% no-repeat';

		return string;
	};

	Player.prototype._isValidImageUrl = function(url, callback) {
		var image = new Image();
		image.onerror = callback.apply(this, [false]);
		image.onload = callback.apply(this, [null]);
		image.src = url;
	};


	Player.prototype._updateImage = function(image) {
		if(false) {
			this._isValidImageUrl('data:image/jpeg;base64,' + image, function(err) {
				if(err) {
					console.log('Invalid image.');
					return;
				}

				/*
				* Updates the div background image to display images if it was a video.
				*/
				this.player.style.background = this._generateCss(image);

				/*
				* Debounced call to reconnect to request the stream again
				* every 5 seconds.
				*/
				if(!this.checkConnection) {
					console.log('No check connection');
					this.checkConnection = this._debounce(function() {
						console.log('Retrying connection.');
						this.init();
					}.bind(this), 5000);

					this.checkConnection();
				} else {
					this.checkConnection();
				}
			}.bind(this));
		}
	};

	Player.prototype._playVideo = function(url, port) {
		if(this.client && this.client.onmessage) {
			this.client.onmessage = null;
			this.client = null;
		}

		console.log("Player.prototype._playVideo " + url);

		/*
		this.client = new WebSocket(url);
		this.client.onopen = function(event) {
			console.log("onopen");
			console.log("this.client " + this.client);
		}

		this.client.onmessage = function(res) {
			console.log("this.client.onmessag");
			this._updateImage(res.data);
		}.bind(this);
		*/

		this.client = new WebSocket(url);
		//sleep(3000);
		new jsmpeg(this.client, {canvas : this.canvas});
/*
		sleep(1000);
		console.log("this.canvas.toDataURL() : " + this.canvas.toDataURL());
		if(this.canvas.toDataURL() == null || this.canvas.toDataURL() == "") {
			if(!this.checkConnection) {
				console.log('No check connection');
				this.checkConnection = this._debounce(function() {
					console.log('Retrying connection.');
					this.init();
				}.bind(this), 5000);

				this.checkConnection();
			} else {
				this.checkConnection();
			}
		}
*/
/*
		if(!this.checkConnection) {
			console.log('No check connection');
			this.checkConnection = this._debounce(function() {
				console.log('Retrying connection.');
				this.init();
			}.bind(this), 5000);

			this.checkConnection();
		} else {
			this.checkConnection();
		}
*/
	};

	window.Player = Player;
}(window, document));