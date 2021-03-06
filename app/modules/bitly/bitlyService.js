(function() {
	'use strict';

	/**
	 * @ngdoc function
	 * @name app.service:bitlyService
	 * @description
	 * # bitlyService
	 * Service of the app
	 */

	angular
		.module('bitly')
		//.factory('BitlyService', Bitly);
		.provider('BitlyService', Bitly);
		// Inject your dependencies as .$inject = ['$http', 'someSevide'];
		// function Name ($http, someSevide) {...}

		Bitly.$inject = [];

		function Bitly () {
			var config;
			return {

				cfgBitly: function(cfg){
					config = cfg;
					config.version = cfg.version || '3'; 
					config.domain = cfg.domain || 'http://api.bit.ly'; // api-ssl.bitly.com
					config.format = cfg.format || 'json';
				},

				$get: ['$http', '$q', '$window', function($http, $q, $window){

					return {

						// API info: http://dev.bitly.com/formats.html
						getShortUrl: function(url){
							var deferredRequest = $q.defer();
							var urlEncoded = encodeURIComponent(url);

							var urlPath = '/v3/shorten';
							var bitlyQuery = '?callback=JSON_CALLBACK&login='+config.login+'&apiKey='+config.api+'&format='+config.format+'&longUrl='+urlEncoded;
							var okPath = "status_code";
							var okCode = 200;

							if(/^2/.test(config.version)){
								urlPath = '/shorten';
								bitlyQuery = '?callback=JSON_CALLBACK&version='+config.version+'&login='+config.login+'&apiKey='+config.api+'&format='+config.format+'&longUrl='+urlEncoded;
								okPath = "errorCode";
								okCode = 0;
							}
							// start jsonp callbacks hack
							/*
							Problem: http://www.pixeldock.com/blog/working-with-jsonp-in-angularjs/
							Hack: http://stackoverflow.com/questions/16560843/json-callback-not-found-using-jsonp
							Discussion: https://github.com/angular/angular.js/issues/1551
							*/
							var c = $window.angular.callbacks.counter.toString(36);
							$window['angularcallbacks_' + c] = function(data) {
								$window.angular.callbacks['_' + c](data);
								delete $window['angularcallbacks_' + c];
							};
							// end hack

							var bitlyUrl = config.domain + urlPath + bitlyQuery;
							$http.jsonp(bitlyUrl)
								.success(function(response){
									if(response && response[okPath] === okCode){
										//console.log("bitly getShortUrl v"+config.version+" OK: ", response);
										if(/^3/.test(config.version)){
											deferredRequest.resolve(response.data.url);
										}else{
											deferredRequest.resolve(response.results[url].shortUrl);
										}
									}else{
										console.info("bitly getShortUrl v"+config.version+" OK with error: ", response);
										deferredRequest.reject(url);
									}
								}).error(function(error){
									console.error("bitly getShortUrl KO: ", error);
									deferredRequest.reject(url);
								});
							return deferredRequest.promise;
						}
					};
				}]
			};
		}

})();
