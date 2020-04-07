/*
File :- login.js
Description :- This file is used to check login & verify token of app user.
Any other application can use this apis for check & verify user authentication.
Created Date :- 27-02-2017
Modify Date :- 30-03-2017
*/

var jwt = require("jsonwebtoken");
var crypto = require("crypto");
var jwtRefresh = require("jsonwebtoken-refresh");
var moment = require("moment");
var config = require("../config.js").config;
var error = require("../error");
var response = require("../responsemessage/responsemessage.js");
var validation = require("../validation/validation.js");

if(client == null){
 require('../dbconnection.js').dbconnection();
}

module.exports = function(app)
{
	var returnmsg = "";
	//Endpoint to check Login For appuser & generate Tokens
	app.post('/user/login',function(req,res){
		var schema = validation.validationcheck("/user/login", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function(result){
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else{
				/* query to get appid of user from customer id */
				var query_getappid = "select appid from clientinfo where isactive = true and isdelete = false and clientid = " + req.headers['x-clientid'] + " ALLOW FILTERING";
				client.execute(query_getappid,function(err,result){
					if(err){
            configlogger.sentry_error(error.dberrorquery,err);
						returnmsg = response.errorresponse(err);
						res.status(500).send(returnmsg);
					}
					else {
						if(result.rows.length == 1)
						{
							var appid = result.rows[0].appid;
							var query_checkappid = "select * from appinfo where isactive = true and isdelete = false and appid = " + appid +" ALLOW FILTERING";
							client.execute(query_checkappid,function(err,result){
								if(err){
                  configlogger.sentry_error(error.dberrorquery,err);
									returnmsg = response.errorresponse(err);
									res.status(500).send(returnmsg);
								}
								else{
									if(result.rows.length == 1){
										var secretkey = result.rows[0].secretkey;
										var password = encryptpwd(req.body.password);
										var query_checkuser = "Select * from users Where emailid = '"+ req.body.emailid + "' and password = '" + password + "' and appid = "+ appid +" and isactive = true and isdelete = false ALLOW FILTERING";
										client.execute(query_checkuser,function(err,result){
											if(err){
                        configlogger.sentry_error(error.dberrorquery,err);
												returnmsg = response.errorresponse(err);
												res.status(500).send(returnmsg);
											}
											else {
												if(result.rows.length == 1){
													var userData = {userid:result.rows[0].userid,emailid:result.rows[0].emailid};
													var result1 = jwt.sign(userData,secretkey,{expiresIn:50000});
													var responsejson = {authtoken:result1,role:result.rows[0].role};
													returnmsg = response.successresponse(error.success,responsejson);
                          configlogger.info(error.loginsuccess,returnmsg);
													res.status(200).send(returnmsg);
												}
												else {
													returnmsg = response.errorresponse(error.loginfailed);
                          configlogger.debug(error.loginfailed,returnmsg);
													res.status(401).send(returnmsg);
												}
											}
										})
									}
									else{
										returnmsg = response.errorresponse(error.appidnotfound);
                    configlogger.debug(error.appidnotfound,returnmsg);
										res.status(400).send(returnmsg);
									}
								}
							})
						}
						else {
							returnmsg = response.errorresponse(error.clientidnotfound);
              configlogger.debug(error.clientidnotfound,returnmsg);
							res.status(400).send(returnmsg);
						}
					}
				})
			}
		})
	})

	//Endpoint to verify token for appuser
	app.post('/user/verify',function(req,res){
		var schema = validation.validationcheck("/user/verify", req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function(result){
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else{
				var query_getappid = "select appid from clientinfo where isactive = true and isdelete = false and clientid = " + req.headers['x-clientid'] + " ALLOW FILTERING";
				client.execute(query_getappid,function(err,result){
					if(err){
            configlogger.sentry_error(error.dberrorquery,err);
						returnmsg = response.errorresponse(err);
						res.status(500).send(returnmsg);
					}
					else {
						if(result.rows.length == 1){
							var query_getsecretkey = "select secretkey from appinfo where isactive = true and isdelete = false and appid = " + result.rows[0].appid + " ALLOW FILTERING";
							client.execute(query_getsecretkey,function(err,result){
								if(err){
                  configlogger.sentry_error(error.dberrorquery,err);
									returnmsg = response.errorresponse(err);
									res.status(500).send(returnmsg);
								}
								else {
									if(result.rows.length == 1){
										var token =  req.headers['authorization'];
										if(token){
											jwt.verify(token,result.rows[0].secretkey,function(err,data){
												if(err){
													returnmsg = response.errorresponse(error.notvalidtoken);
                          configlogger.debug(error.tokenvalidationerror,returnmsg);
													res.status(400).send(returnmsg);
												}
												else{

													//Check token again credential updated on
													var fetchcredentialupdatedon = "select credentialupdatedon from users where userid = " + data.userid ;

													client.execute(fetchcredentialupdatedon, function (err, result) {
														if (err) {
                              configlogger.sentry_error(error.dberrorquery,err);
															returnmsg = response.errorresponse(err);
															res.status(500).send(returnmsg);
														}
														else {
															if (result.rows.length == 1) {
																	if(moment.unix(data.iat).utc().format() > moment(result.rows[0].credentialupdatedon).utc().format())
																	{
																		returnmsg = response.successresponse(error.success,null);
                                    configlogger.info(error.tokenverify,returnmsg);
																		res.status(200).send(returnmsg);
																	}
																	else {
																		returnmsg = response.errorresponse(error.credentialchangemessage);
                                    configlogger.info(error.notvalidtoken,returnmsg);
																		res.status(401).send(returnmsg);
																	}
															}
															else {
																returnmsg = response.errorresponse(error.notfound);
                                configlogger.debug(error.notfound,returnmsg);
																res.status(404).send(returnmsg);
															}
														}
													});
												}
											});
										}
										else {
											returnmsg = response.errorresponse(error.tokennotavailable);
                      configlogger.debug(error.invalidrequest,returnmsg);
											res.status(400).send(returnmsg);
										}
									}
									else{
										returnmsg = response.errorresponse(error.appidnotfound);
                    configlogger.debug(error.appidnotfound,returnmsg);
										res.status(404).send(returnmsg);
									}
								}
							})
						}
						else{
							returnmsg = response.errorresponse(error.clientidnotfound);
              configlogger.debug(error.clientidnotfound,returnmsg);
							res.status(400).send(returnmsg);
						}
					}
				})
			}
		})

	})

	//Refresh Tokens
	app.post('/user/refresh',function(req,res){
		//Fetch old token from header
		var token = req.headers['authorization'];
		if (token) {
			//Get secretkey from request
			var secretkey = "";
			var clientid = "";
			if (req.headers['x-clientid'] != undefined) {
				clientid = req.headers['x-clientid'];
			}
			if (clientid) {
				var query_getappid = "select appid from clientinfo where isactive = true and isdelete = false and clientid = " + clientid + " ALLOW FILTERING";
				client.execute(query_getappid, function (err, result) {
					if (err) {
            configlogger.sentry_error(error.dberrorquery,err);
						returnmsg = response.errorresponse(err);
						res.status(500).send(returnmsg);
					}
					else {
						if (result.rows.length == 1) {
							var query_getsecretkey = "select secretkey from appinfo where isactive = true and isdelete = false and appid = " + result.rows[0].appid + " ALLOW FILTERING";
							client.execute(query_getsecretkey, function (err, result) {
								if (err) {
                  configlogger.sentry_error(error.dberrorquery,err);
									returnmsg = response.errorresponse(err);
									res.status(500).send(returnmsg);
								}
								else {
									if(result.rows.length == 1)
									{
										secretkey = result.rows[0].secretkey;
										//decode token data
										var decodedToken = jwt.decode(token, {complete: true});

										//Check token again credential updated on
										var fetchcredentialupdatedon = "select credentialupdatedon from users where userid = " + decodedToken.payload.userid;
										client.execute(fetchcredentialupdatedon, function (err, result) {
											if (err) {
                        configlogger.sentry_error(error.dberrorquery,err);
												returnmsg = response.errorresponse(err);
												res.status(500).send(returnmsg);
											}
											else {
												if (result.rows.length == 1) {
														if(moment.unix(decodedToken.payload.iat).utc().format() > moment(result.rows[0].credentialupdatedon).utc().format())
														{
															//Generate new token with decoded data
															var refreshedToken = jwtRefresh.refresh(decodedToken, 50000, secretkey);
															//Prepare response json for send response
															var responsejson = {authtoken:refreshedToken};
															returnmsg = response.successresponse(error.success,responsejson);
                              configlogger.debug(error.tokenrefresh,returnmsg);
															res.status(200).send(returnmsg);
														}
														else {
															returnmsg = response.errorresponse(error.credentialchangemessage);
                              configlogger.debug(error.notvalidtoken,returnmsg);
															res.status(401).send(returnmsg);
														}
												}
												else {
													returnmsg = response.errorresponse(error.notfound);
                          configlogger.debug(error.notfound,returnmsg);
													res.status(404).send(returnmsg);
												}
											}
										});
									} else {
										returnmsg = response.errorresponse(error.appnotactive);
                    configlogger.debug(error.appnotactive,returnmsg);
										res.status(404).send(returnmsg);
									}
								}
							})
						}
						else {
							returnmsg = response.errorresponse(error.notfound);
              configlogger.debug(error.appidnotfound,returnmsg);
							res.status(404).send(returnmsg);
						}
					}
				})
			}
			else {
				returnmsg = response.errorresponse(error.emptyclientidinheader);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(returnmsg);
			}
		}
		else {
			returnmsg = response.errorresponse(error.tokennotavailable);
      configlogger.debug(error.invalidrequest,returnmsg);
			res.status(400).send(returnmsg);
		}
	})

	//password Encryption
	function encryptpwd(password){
		var cipher = crypto.createCipher(config.algorithm,config.passwordkey);
		var crypted = cipher.update(password,'utf8','hex');
		crypted += cipher.final('hex');
		return crypted;
	}
}
