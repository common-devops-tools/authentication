/*
File :- middleware.js
Description :- This file check every request for user authentication. It verifies that all request are valid or not.
Created Date :- 27-02-2017
Modify Date :- 24-03-2017
*/


var jwt = require("jsonwebtoken");
var moment = require("moment");
var promise = require("bluebird");
var config = require("../config.js").config;
var error = require("../error");
var response = require("../responsemessage/responsemessage.js");

if(client == null){
 require('../dbconnection.js').dbconnection();
}

module.exports = function (app) {

	/* Exclude below APIS's from middleware */
	var options = { "exclude": ['/user/muser/login', '/user/login', '/user/verify', '/user/checkmasteruserunique', '/user/checkappuserunique','/user/muser/refresh', '/user/refresh'] };
	var secretkey = "", returnmsg = "";

	/* middleware check content-type = 'application/json' set or not */
	var contenttypecheck = function (req, res, next) {
		if(req.method != "GET"){
			req.check({
				'content-type':{
					in: 'headers',
					notEmpty: {
						errorMessage: error.contenttype
					},
					matches: {
						options: [/\b(?:application\/json)\b/],
						errorMessage: error.icontenttype
					}
				}
			})
			req.getValidationResult().then(function(result){
				var errors =  result.useFirstErrorOnly().array();
				if(errors.length > 0){
					returnmsg = response.errorresponse(errors);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(JSON.stringify(returnmsg));
				}
				else {
					next();
				}
			})
		}
		else {
			next();
		}
	}

	/* middleware authenticate API's have token or not and if available then token is valid or not */
	var tokenauth = function (options) {
		return function (req, res, next) {
			if ((req.path == '/user/muser' || req.path == '/user/appuser') && req.method == "POST") {
				next();
			}
			else {
				if (options.exclude.indexOf(req.path) == -1) {
					getsecretkey(req, res).then(function (secretkey) {
						var token = req.headers['authorization'];
						if (token) {
							jwt.verify(token, secretkey, function (err, data) {
								if (err) {
									returnmsg = response.errorresponse(err);
                  configlogger.debug(error.tokenvalidationerror,returnmsg);
									res.status(400).send(returnmsg);
								} else {
									req.authorization = data;
									//Check token again credential updated on
									var fetchcredentialupdatedon = "";
									if(data.muserid != undefined) {
											fetchcredentialupdatedon = "select credentialupdatedon from masterusers where muserid = " + data.muserid + "";
									}
									else {
											fetchcredentialupdatedon = "select credentialupdatedon from users where userid = " + data.userid + "";
									}
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
															next();
													}
													else {
														returnmsg = response.errorresponse(error.credentialchangemessage);
                            configlogger.debug(error.credentialchangemessage,returnmsg);
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
					})
				}
				else {
					next();
				}
			}
		}
	}

	/* middleware for wrirting log */
	var logmanage = function (req, res, next) {
		console.log("Logger Here");
		next();
	}

	/* fetch secretkey to encrypt/decrypt token from database or config file */
	function getsecretkey(req, res) {
		return new promise(function (resolve, reject) {
			if (req.path == '/user/appuser' && (req.method == "PUT" || req.method == "GET")) {

					var clientid = req.headers['x-clientid'];

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
											resolve(secretkey);
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
                configlogger.debug(error.clientnotfound,returnmsg);
								res.status(404).send(returnmsg);
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
			else {
				secretkey = config.secretkey;
				resolve(secretkey);
			}
		});
	}

	/* middleware's */
	app.use(contenttypecheck);
	app.use(tokenauth(options));
	app.use(logmanage);

}
