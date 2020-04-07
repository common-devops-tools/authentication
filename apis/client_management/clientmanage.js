/*
File :- clientmanage.js
Description :- This file is used to manage clients of app.
Using this  file we can create client,update client,list client & get client of particular app.
Created Date :- 27-02-2017
Modify Date :- 24-03-2017
*/

var cassandra = require('cassandra-driver');
var mergeJSON = require("merge-json");
var moment = require("moment");
var error = require("../../error");
var response = require("../../responsemessage/responsemessage.js");
var validation = require("../../validation/validation.js");

if(client == null){
 require('../dbconnection.js').dbconnection();
}

module.exports = function (app) {
	var returnmsg = "";
	//This API is used for create client
	app.post('/user/client', function (req, res) {

		// Build schema for validate request
		var schema = validation.validationcheck("/user/client", req.method);
		// check requested schema
		req.checkBody(schema);
		// Check validation errors
		req.getValidationResult().then(function (result) {
			// Fetch first error of our array of errors.
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Send validation in response
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				// Generate dynamic client id
				var id = cassandra.types.Uuid.random();
				//Remove appid from req.body if it is exists
				if (req.body['appid'] != undefined) {
					delete req.body['appid'];
				}
				var appid = req.headers['x-appid'];

				// Create dynamic json for internal used fields like create time,client id,is active etc.
				var stfieldstr = '{ "clientid" :"' + id + '","create_ts":"' + moment.utc() + '","appid":"' + appid + '","mod_ts":"' + moment.utc() + '","isactive" :"true","isdelete":"false" }';
				// Merge our internal field json with request body parameter
				var result = mergeJSON.merge(JSON.parse(stfieldstr), req.body);
				// Prepare query statement
				var query = "INSERT INTO clientinfo json '" + JSON.stringify(result) + "'";

				// Execute query in cassandra using its client object
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return success message if database operation completed successfully.
						returnmsg = response.successresponse(error.success, JSON.parse('{"clientid":"' + id + '"}'));
            configlogger.debug(error.clientcreated,returnmsg);
						res.status(201).send(returnmsg);
					}
				}
				)
			}
		})
	});

	//This API is used for update client.
	app.put('/user/client', function (req, res) {

		// Build schema for validate request
		var schema = validation.validationcheck("/user/client", req.method);
		// check requested schema
		req.checkBody(schema);
		// Check validation errors
		req.getValidationResult().then(function (result) {
			// Fetch first error of our array of errors.
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Send validation in response
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
        var logData = req.body;
				//Remove clientid from req.body if it is exists
				if (req.body['clientid'] != undefined) {
					delete req.body['clientid'];
				}
				var clientid = req.headers['x-clientid'];
				var qparam = "";

				// Iterate all key of request data to create our json for update data in database.
				for (var key in req.body) {
					// Key fields (i.e. clientid, appid etc.) & boolean datatype fields (i.e. isactive,isdelete) does not require single quote in update query.
					// So we prepare query parameter without single quote
					if ((typeof (req.body[key]) == "boolean") || key == 'defaultrole') {
						qparam += key + " = " + req.body[key] + ",";
					}
					// String type variables require single quote in query. So we prepare query parameter with single quote
					else if (typeof (req.body[key]) == "string") {
						qparam += key + " = '" + req.body[key] + "',";
					}
					// object type variables (i.e. metainfo) required single quote in its key-value pair. So we can replace its double quote with single quote.
					else if (typeof (req.body[key]) == "object") {
						qparam += key + " = " + JSON.stringify(req.body[key]).replace(/"/g, "'") + ",";
					}

				}
				// Fetch logged in user id from authorization object of request object.
				var muserid = req.authorization.muserid;
				// Add mofify by & modify time in query
				qparam += "mod_ts = '" + moment.utc() + "', mod_by = " + muserid + ",";
        var temp = '{"mod_ts ": "' + moment.utc() + '"," mod_by" : "' + muserid + '"}'
        logData = mergeJSON.merge(logData,JSON.parse(temp)) ;
				// Prepare query statement
				var query = 'UPDATE clientinfo SET ' + qparam.slice(0, -1) + ' WHERE clientid= ' + clientid;

				// Execute query in cassandra using its client object
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return success message if database operation completed successfully.
						returnmsg = response.successresponse(error.success, null);
            configlogger.debug(error.clientupdated,logData);
						res.status(200).send(returnmsg);
					}
				}
				)
			}
		})
	});

	//This API is used for get client by clientid.
	app.get('/user/client', function (req, res) {
		// Build schema for validate request
		var schema = validation.validationcheck("/user/client", req.method);
		// check requested schema
		req.checkBody(schema);
		// Check validation errors
		req.getValidationResult().then(function (result) {
			// Fetch first error of our array of errors.
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Send validation in response
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				// Fetch clientid from query string
				var clientid = req.query['clientid'];
				// Prepare query statement
				var query = "SELECT * FROM clientinfo where clientid = " + clientid;
				// Execute query in cassandra using its client object
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err);
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return result set if database operation completed successfully.
						returnmsg = response.successresponse(error.success, result.rows);
            configlogger.debug(error.clientget,returnmsg);
						res.status(200).send(returnmsg);
					}
				})
			}
		})

	});

	//This API is used for get all client by appid.
	app.get('/user/client/list', function (req, res) {
		// Build schema for validate request
		var schema = validation.validationcheck("/user/client/list", req.method);
		// check requested schema
		req.checkBody(schema);
		// Check validation errors
		req.getValidationResult().then(function (result) {
			// Fetch first error of our array of errors.
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Send validation in response
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				// Fetch appid from query string
				var appid = req.query['appid'];
				// Prepare query statement. Master user can only access its non deleted client
				var query = "SELECT * FROM clientinfo where isdelete = false and appid = " + appid + " ALLOW FILTERING";

				// Execute query in cassandra using its client object
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err);
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return result set if database operation completed successfully.
						returnmsg = response.successresponse(error.success,result.rows);
            configlogger.debug(error.clientget,returnmsg);
						res.status(200).send(returnmsg);
					}
				})
			}
		})
	});
}
