/*
File :- rolemanage.js
Description :- This file is used to manage role of app.
Using this  file we can create role,update role,list role & get role of particular app.
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
	//This API is used for create Role
	app.post('/user/role', function (req, res) {
		//validate request data
		var schema = validation.validationcheck("/user/role", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function (result) {
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Return error message in response if request data is not valid.
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var id = cassandra.types.Uuid.random();
				//Fill default value
				var stfieldstr = '{ "roleid" :"' + id + '","create_ts":"' + moment.utc() + '","mod_ts":"' + moment.utc() + '","isactive" :"true","isdelete":"false","appid":"' + req.headers['x-appid'] + '" }';
				//merge default value with request data
				var result = mergeJSON.merge(JSON.parse(stfieldstr), req.body);
				//Insert into data base
				var query = "Insert into role json '" + JSON.stringify(result) + "'";
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						//Return success message if Role is inserted successfully
						returnmsg = response.successresponse(error.success, JSON.parse('{"roleid":"' + id + '"}'));
            configlogger.debug(error.rolecreated,returnmsg);
            res.status(201).send(returnmsg);
					}
				});
			}

		});
	});
	//This API is used for Update Role
	app.put('/user/role', function (req, res) {
		//validate request data
		var schema = validation.validationcheck("/user/role", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function (result) {
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Return error message in response if request data is not valid.
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var qparam = "", roleid = "";
        var logData = req.body;
				roleid = req.headers['x-roleid'];
				// generate dynamic query for update
				for (var key in req.body) {
					if (key == "roleid" || key == "appid") {
						//skip appid and roleid - no need to update roleid and appid
					}
					else if (typeof (req.body[key]) == "boolean") {
						qparam += key + " = " + req.body[key] + ",";
					}
					else if (typeof (req.body[key]) == "object") {
						qparam += key + " = " + JSON.stringify(req.body[key]).toString().replace(/"/g, "'") + ",";
					}
					else if (typeof (req.body[key]) == "string") {
						qparam += key + " = '" + req.body[key] + "',";
					}
				}
				// Fetch logged in user id from authorization object of request object.
				var muserid = req.authorization.muserid;
				// Add mofify by & modify time in query
				qparam += "mod_ts = '" + moment.utc() + "', mod_by = " + muserid + ",";
        var temp = '{"mod_ts ": "' + moment.utc() + '"," mod_by" : "' + muserid + '"}'
        logData = mergeJSON.merge(logData,JSON.parse(temp)) ;
				var query = "update role set " + qparam.slice(0, -1) + " where roleid=" + roleid;
				//Update Data
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						//Return success message if Role is updated successfully
						returnmsg = response.successresponse(error.success, null);
            configlogger.debug(error.roleupdated,logData);
						res.status(200).send(returnmsg);
					}
				});
			}
		});
	});
	//This api is used for Getting Role by Role ID
	app.get('/user/role', function (req, res) {
		//validate request data
		var schema = validation.validationcheck("/user/role", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function (result) {
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Return error message in response if request data is not valid.
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var roleid = req.query['roleid'];
				//Fetch Role detail of particular roleid
				var query = "Select * from role where roleid=" + roleid + " and isdelete = false ALLOW FILTERING";
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return result set if database operation completed successfully.
						returnmsg = response.successresponse(error.success, result.rows);
            configlogger.debug(error.getrole,returnmsg);
						res.status(200).send(returnmsg);
					}
				});
			}
		});
	});
	//This api is used for Getting all Role by App ID
	app.get('/user/role/list', function (req, res) {
		//validate request data
		var schema = validation.validationcheck("/user/role/list", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function (result) {
			var errors = result.useFirstErrorOnly().array();
			if (errors.length > 0) {
				// Return error message in response if request data is not valid.
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var appid = req.query['appid'];
				//Fetch all Roles for particular app
				var query = "Select * from role where appid=" + appid + " and isdelete = false ALLOW FILTERING";
				client.execute(query, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else {
						// Return result set if database operation completed successfully.
						returnmsg = response.successresponse(error.success, result.rows);
            configlogger.debug(error.getrole,returnmsg);
						res.status(200).send(returnmsg);
					}
				});
			}
		});
	});
}
