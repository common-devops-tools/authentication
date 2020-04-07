/*
File :- appuser.js
Description :- This file is used to manage application users.
Using this  file we can create user,update user,list user & get user of particular app.
Created Date :- 27-02-2017
Modify Date :- 24-03-2017
*/

var cassandra = require('cassandra-driver');
var mergeJSON = require("merge-json");
var crypto = require("crypto");
var moment = require("moment");
var promise = require("bluebird");
var config = require("../../config").config;
var error = require("../../error");
var response = require("../../responsemessage/responsemessage.js");
var validation = require("../../validation/validation.js");

if(client == null){
 require('../dbconnection.js').dbconnection();
}

module.exports = function (app) {

	var returnmsg = "";
	//Endpoint For cretae appuser Under App -> client -> user
	app.post('/user/appuser', function (req, res) {

			var schema = validation.validationcheck("/user/appuser",req.method);
			req.checkBody(schema);
			req.getValidationResult().then(function(result){
				var errors =  result.useFirstErrorOnly().array();
				if(errors.length > 0){
					returnmsg = response.errorresponse(errors);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(JSON.stringify(returnmsg));
				}
				else{
					var id = cassandra.types.Uuid.random();
					var emailid = req.body.emailid;
					var clientid = req.headers['x-clientid'];
					useruniqueness(emailid,clientid).then(function(checkreturn){
						if(checkreturn){
							returnmsg = response.errorresponse(error.userexist);
              configlogger.debug(error.userexist,returnmsg);
							res.status(400).send(returnmsg);
						}
						else{
							//Prepare query statement
							var query_getappid = "select appid,defaultrole from clientinfo where isactive = true and isdelete = false and clientid = " + req.headers['x-clientid'] + " ALLOW FILTERING";
							//Fetch appid from clientid passed by client
							client.execute(query_getappid, function (err, result_getappid) {
								if (err) {
									// Return error message in response if error is occured during database operation.
									returnmsg = response.errorresponse(err);
                  configlogger.sentry_error(error.dberrorquery,err);
									res.status(500).send(returnmsg);
								}
								else {
									if (result_getappid.rows.length == 1) {
										//var defaultrole = result.rows[0].defaultrole;
										var query_checkapp = "select * from appinfo where isdelete = false and isactive = true and appid = " + result_getappid.rows[0].appid + " ALLOW FILTERING";
										client.execute(query_checkapp, function (err, result) {
											if (err) {
												returnmsg = response.errorresponse(err);
                        configlogger.sentry_error(error.dberrorquery,err);
												res.status(500).send(returnmsg);
											}
											else {
												if (result.rows.length == 1) {
													// Create dynamic json for internal used fields like create time,client id,is active etc.
													var stfieldstr = '{ "userid" :"' + id + '","appid" : "' + result_getappid.rows[0].appid + '","role" : ["' + result_getappid.rows[0].defaultrole + '"],"create_ts":"' + moment.utc() + '","mod_ts":"' + moment.utc() + '","credentialupdatedon":"' + moment.utc() + '","isactive" :"true","isdelete":"false" }';
													//Encrypt password
													var password = encryptpwd(req.body.password)
													req.body.password = password;
													//Exclude clientid from JSON because it is not updated
													delete req.body['clientid'];
													//Merge our internal field json with request body parameter
													var result = mergeJSON.merge(JSON.parse(stfieldstr), req.body);
													//Prepare query statement
													var query_userinsert = "insert into users json '" + JSON.stringify(result) + "'";
													client.execute(query_userinsert, function (err, result) {
														if (err) {
															// Return error message in response if error is occured during database operation.
															returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
                              configlogger.sentry_error(error.dberrorquery,err);
															res.status(500).send(returnmsg);
														} else {
															// Return success message if database operation completed successfully.
															returnmsg = response.successresponse(error.success, JSON.parse('{"userid":"' + id + '"}'));
                              configlogger.debug(error.usercreated,returnmsg);
                              res.status(201).send(returnmsg);
														}
													})
												}
												else {
													returnmsg = response.errorresponse(error.appnotactive);
                          configlogger.debug(error.appnotactive,returnmsg);
													res.status(404).send(returnmsg);
												}
											}
										})

									} else {
										returnmsg = response.errorresponse(error.clientidnotfound);
                    configlogger.debug(error.invalidrequest,returnmsg);
										res.status(404).send(returnmsg);
									}
								}
							})
						}
					})
				}
			})


	});

	//Endpoint For update appuser
	app.put('/user/appuser', function (req, res) {

		var schema = validation.validationcheck("/user/appuser",req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function(result){
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				if(req.body.emailid){
					returnmsg = response.errorresponse(error.removeemail);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(returnmsg);
				}
				else{
					var userid = req.authorization.userid;
					var qparam = "";
          var logData = req.body;
					delete req.body['clientid'];
					// Iterate all key of request data to create our json for update data in database.
					for (var key in req.body) {
						// Key fields (i.e. clientid, appid etc.) & boolean datatype fields (i.e. isactive,isdelete) does not require single quote in update query.
						// So we prepare query parameter without single quote
						if (typeof (req.body[key]) == "boolean") {
							qparam += key + " = " + req.body[key] + ",";
						}
						// String type variables require single quote in query. So we prepare query parameter with single quote
						else if (typeof (req.body[key]) == "string") {
							if (key == "password") {
								qparam += key + " = '" + encryptpwd(req.body[key]) + "',";
								//Update timestamp due to password Update
								qparam += "credentialupdatedon = '" + moment.utc() + "',";
							}
							else {
								qparam += key + " = '" + req.body[key] + "',";
							}
						}
						// object type variables (i.e. metainfo) required single quote in its key-value pair. So we can replace its double quote with single quote.
						else if (typeof (req.body[key]) == "object") {
							qparam += key + " = " + JSON.stringify(req.body[key]).replace(/"/g, "'") + ",";
						}
					}
					// Add mofify by & modify time in query
					qparam += "mod_ts = '" + moment.utc() + "', mod_by = " + userid + ",";
          var temp = '{"mod_ts ": "' + moment.utc() + '"," mod_by" : "' + userid + '"}'
          logData = mergeJSON.merge(logData,JSON.parse(temp)) ;


					//Prepare query statement
					var query = 'update users set ' + qparam.slice(0, -1) + ' where userid=' + userid + '';

					// Execute query in cassandra using its client object
					client.execute(query, function (err, result) {
						if (err) {
							// Return error message in response if error is occured during database operation.
							returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
              configlogger.sentry_error(error.dberrorquery,err);
							res.status(500).send(returnmsg);
						} else {
							// Return success message if database operation completed successfully.
							returnmsg = response.successresponse(error.success, null);
              configlogger.debug(error.userupdate,logData);
							res.status(200).send(returnmsg);
						}
					})
				}
			}
		})

	});

	//Endpoint  For CheckMasterUserUniques
	app.get('/user/checkappuserunique', function (req, res) {

			var schema = validation.validationcheck("/user/checkappuserunique",req.method);
			req.checkBody(schema);
			req.getValidationResult().then(function(result){
				var errors =  result.useFirstErrorOnly().array();
				if(errors.length > 0){
					returnmsg = response.errorresponse(errors);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(JSON.stringify(returnmsg));
				}
				else {
					var emailid = req.query.emailid;
					var clientid = req.headers['x-clientid'];
					useruniqueness(emailid,clientid).then(function(checkreturn){
						if(checkreturn){
							returnmsg = response.successresponse(error.success,"true");
						} else {
							returnmsg = response.successresponse(error.success,"false");
						}
            configlogger.debug(error.checkuserunique,returnmsg);
						res.status(200).send(returnmsg);
					})
					.catch(function(returnmsg){
						res.status(400).send(returnmsg);
					})
				}
			})

	})


	//Endpoint for getting detail of user
	app.get('/user/appuser', function (req, res) {
		var userid = req.authorization.userid;
		//Prepare query statement
		var query_listuser = "select emailid,firstname,lastname,metainfo,phone from users where userid = " + userid;
		// Execute query in cassandra using its client object
		client.execute(query_listuser, function (err, result) {
			if (err) {
				// Return error message in response if error is occured during database operation.
				returnmsg = response.errorresponse(err);
        configlogger.sentry_error(error.dberrorquery,err);
				res.status(500).send(returnmsg);
			} else {
				//Return Detail of users if query successfully execute
				returnmsg = response.successresponse(error.success, result.rows);
        configlogger.debug(error.mgetuser,returnmsg);
				res.status(200).send(returnmsg);
			}
		})
	});

	//Endpoint to listdown all users for particular app
	app.get('/user/appuser/list', function (req, res) {

		var schema = validation.validationcheck("/user/appuser/list",req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function(result){
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var appid = req.query['appid'];
				//Prepare query statement
				var query_listuser = "select * from users where isdelete = false and appid = " + appid + " ALLOW FILTERING";
				// Execute query in cassandra using its client object
				client.execute(query_listuser, function (err, result) {
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err);
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					} else {
						//Return list of users if query successfully execute
						returnmsg = response.successresponse(error.success,result.rows);
            configlogger.debug(error.getuser,returnmsg);
						res.status(200).send(returnmsg);
					}
				})
			}
		})
	});

	//Check user uniqueness
	function useruniqueness(emailid,clientid){
		return new promise(function (resolve, reject) {
			if(clientid)
			{
				var query_getappid = "select appid from clientinfo where isactive = true and isdelete = false and clientid = " + clientid + " ALLOW FILTERING";
				client.execute(query_getappid,function(err,result){
					if(err){
						returnmsg = response.errorresponse(err);
            configlogger.sentry_error(error.dberrorquery,err);
						reject(returnmsg);
					} else {
						if(result.rows.length == 1)
						{
							// Prepare query statement
							var query = "select emailid from users where isdelete = false and appid = " + result.rows[0].appid + " and emailid = '" + emailid + "' ALLOW FILTERING";
							client.execute(query, function (err, result) {
								if (err) {
									// Return error message in response if error is occured during database operation.
									returnmsg = response.errorresponse(err);
                  configlogger.sentry_error(error.dberrorquery,err);
									reject(returnmsg);
								} else {
									// Return True or False message if database operation completed successfully.
									if (result.rows.length == 1) {
										resolve(true)
									}
									else {
										resolve(false)
									}
								}

							})
						}
						else {
							returnmsg = response.errorresponse(error.clientidnotfound);
              configlogger.debug(error.invalidrequest,returnmsg);
							reject(returnmsg);
						}
					}
				})
			}
			else {
				returnmsg = response.errorresponse(error.clientidnotfound);
        configlogger.debug(error.invalidrequest,returnmsg);
				reject(returnmsg);
			}

		})
	}

	//password Encryption
	function encryptpwd(password) {
		var cipher = crypto.createCipher(config.algorithm, config.passwordkey);
		var crypted = cipher.update(password, 'utf8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	}

	//Endpoint for getting detail of user for master user
	app.get('/user/getappuser', function (req, res) {
		var schema = validation.validationcheck("/user/getappuser",req.method);
		req.checkBody(schema);

		req.getValidationResult().then(function(result){
				var errors =  result.useFirstErrorOnly().array();
				if(errors.length > 0){
					returnmsg = response.errorresponse(errors);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(JSON.stringify(returnmsg));
				}
				else {
					var userid = req.query['userid'];
					//Prepare query statement
					var query_listuser = "select emailid,firstname,lastname,metainfo,phone,role,userid,appid,isactive,isdelete from users where userid = " + userid;
					// Execute query in cassandra using its client object
					client.execute(query_listuser, function (err, result) {
						if (err) {
							// Return error message in response if error is occured during database operation.
							returnmsg = response.errorresponse(err);
              configlogger.sentry_error(error.dberrorquery,err);
							res.status(500).send(returnmsg);
						} else {
							//Return Detail of users if query successfully execute
							returnmsg = response.successresponse(error.success, result.rows);
              configlogger.debug(error.getuserbymuser,returnmsg);
							res.status(200).send(returnmsg);
						}
					})
				}
		})
	});
}
