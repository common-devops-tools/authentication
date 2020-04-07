/*
File :- logger.js
Description :- This file is used to handle logger operations.
Created Date :- 30-03-2017
Modify Date :- 30-03-2017
*/

var winston = require('winston');
var sentry = require('winston-common-sentry');
var config = require("./config.js").config;

module.exports = function () {
	//Creation of logger
	logger = new winston.Logger({
	    transports: [
	        new sentry({
	                level: config.sentrylevel,
	                dsn: config.sentrydsn
	        })
	    ],
	});

	//Log level log Function
	log = function(){
	    logger.log.apply(logger,arguments);
	    consolelog(arguments);
	};

	//Info level log Function
	info = function(){
	    logger.info.apply(logger,arguments);
	    consolelog(arguments);
	};

	//Warn level log Function
	warn = function(){
	    logger.warn.apply(logger,arguments);
	    consolelog(arguments);
	};

	//Error level log Function
	sentry_error = function(){
	    logger.error.apply(logger,arguments);
	    consolelog(arguments);
	};

	//Debug level log Function
	debug = function(){
	    logger.debug.apply(logger,arguments);
	    consolelog(arguments);
	};

	consolelog = function(arguments){
		console.log(arguments[0]);
		if (arguments[1] != undefined) {
			console.log(arguments[1]);
		}
	}

	return this;
}
