/*
File :- mumanage.js
Description :- This file is used to manage master user. Using this  file we can create master user,update master user & get master user.
We can also check user uniqueness from this file. Master user login is also check using this file.
Created Date :- 27-02-2017
Modify Date :- 24-03-2017
*/

var cassandra = require('cassandra-driver');
var jwt = require("jsonwebtoken");
var mergeJSON = require("merge-json");
var crypto = require("crypto");
var jwtRefresh = require("jsonwebtoken-refresh");
var moment = require("moment");
var promise = require("bluebird");
var config = require("../../config").config;
var error = require("../../error");
var response = require("../../responsemessage/responsemessage.js");
var validation = require("../../validation/validation.js");

if(client == null){
 require('../dbconnection.js').dbconnection();
}

module.exports = function(app){

	var returnmsg = "";
	//Endpoint  For CretaeMasterUsers
	app.post('/user/muser',function(req,res){

			var schema = validation.validationcheck("/user/muser",req.method);
			req.checkBody(schema);
			req.getValidationResult().then(function(result){
				var errors =  result.useFirstErrorOnly().array();
				if(errors.length > 0){
					returnmsg = response.errorresponse(errors);
          configlogger.debug(error.invalidrequest,returnmsg);
					res.status(400).send(JSON.stringify(returnmsg));
				}
				else {
					var id = cassandra.types.Uuid.random();
					var stfieldstr = "";
					var emailid = req.body.emailid;
					useruniqueness(emailid).then(function(checkreturn){
						if(checkreturn){
							returnmsg = response.errorresponse(error.userexist);
							res.status(400).send(returnmsg);
						}
						else{
							var password = encryptpwd(req.body.password);
							req.body.password = password;

							//check verification is enable or disable by default it is false
							if(config.ismasteruserverify)
							{
								stfieldstr = '{ "muserid" :"' + id + '","create_ts":"'+ moment.utc() + '","mod_ts":"'+ moment.utc() + '","credentialupdatedon":"'+ moment.utc() + '","isactive" :"false","isdelete":"false" }' ;
							}
							else
							{
								stfieldstr = '{ "muserid" :"' + id + '","create_ts":"'+ moment.utc() + '","mod_ts":"'+ moment.utc() + '","credentialupdatedon":"'+ moment.utc() + '","isactive" :"true","isdelete":"false" }' ;
							}

							// Merge our internal field json with request body parameter
							var result = mergeJSON.merge(JSON.parse(stfieldstr),req.body) ;
							// Prepare query statement
							var query = "insert into masterusers json '" + JSON.stringify(result) + "'";
							// Execute query in cassandra
							client.execute(query,function(err, result) {
								if (err){
									// Return error message in response if error is occured during database operation.
									returnmsg = response.errorresponse(err);
                  configlogger.sentry_error(error.dberrorquery,err);
									res.status(500).send(returnmsg);
								}else {
									// Return success message if database operation completed successfully.
									returnmsg = response.successresponse(error.success,JSON.parse('{"muserid":"'+ id + '"}'));
                  configlogger.debug(error.musercreated,returnmsg);
									res.status(201).send(returnmsg);
								}
							})
						}
					}).catch(function(returnmsg){
						res.status(400).send(returnmsg);
					})
				}
			})

	})

	//Endpoint  For UpdateMasterUsers
	app.put('/user/muser',function(req,res){
		var schema = validation.validationcheck("/user/muser",req.method);
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
					//Get muserid from token(Extract In Middleware) pass by Client
					var muserid = req.authorization.muserid;
					var qparam = "";
					var logData = req.body;
					// Iterate all key of request data to create our json for update data in database.
					for(var key in req.body) {
						// Key fields (i.e. clientid, appid etc.) & boolean datatype fields (i.e. isactive,isdelete) does not require single quote in update query.
						// So we prepare query parameter without single quote
						if(typeof(req.body[key]) == "boolean")
						{
							qparam += key + " = " + req.body[key] + ",";
						}
						// String type variables require single quote in query. So we prepare query parameter with single quote
						else if(typeof(req.body[key]) == "string")
						{
							if(key == "password")
							{
								qparam += key + " = '" + encryptpwd(req.body[key]) + "',";
								//Update timestamp due to password Update
								qparam += "credentialupdatedon = '" + moment.utc() + "',";
							}
							else {
								qparam += key + " = '" + req.body[key] + "',";
							}
						}
						// object type variables (i.e. metainfo) required single quote in its key-value pair. So we can replace its double quote with single quote.
						else if(typeof(req.body[key]) == "object")
						{
							qparam += key + " = " + JSON.stringify(req.body[key]).replace(/"/g, "'") + ",";
						}
					}
					// Add mofify by & modify time in query
					qparam += "mod_ts = '" + moment.utc() + "', mod_by = " + muserid + ",";
          var temp = '{"mod_ts ": "' + moment.utc() + '"," mod_by" : "' + muserid + '"}'
          logData = mergeJSON.merge(logData,JSON.parse(temp)) ;
					// Prepare query statement
					var query = 'update masterusers set '+ qparam.slice(0, -1) +' where muserid=' + muserid + '';
					client.execute(query,function(err, result) {
						if (err)
						{
							// Return error message in response if error is occured during database operation.
							returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
              configlogger.sentry_error(error.dberrorquery,err);
							res.status(500).send(returnmsg);
						}
						else {
							// Return success message if database operation completed successfully.
							returnmsg = response.successresponse(error.success,null);
              configlogger.debug(error.muserupdate,logData);
							res.status(200).send(returnmsg);
						}
					})
				}
			}
		})
	})

	//Endpoint  For CheckMasterUserUniques
	app.get('/user/checkmasteruserunique',function(req,res){

			var schema = validation.validationcheck("/user/checkmasteruserunique",req.method);
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
					useruniqueness(emailid).then(function(checkreturn){
						if(checkreturn){
							returnmsg = response.successresponse(error.success,"true");
						} else {
							returnmsg = response.successresponse(error.success,"false");
						}
            configlogger.debug(error.mcheckappuserunique,returnmsg);
						res.status(200).send(returnmsg);
					})
					.catch(function(returnmsg){
						res.status(400).send(returnmsg);

					})
				}
			})

	})

	//Endpoint return data for master user
	app.get('/user/muser',function(req,res){

		var muserid = req.authorization.muserid;
		// Prepare query statement
		var query = "select firstname,lastname,emailid,metainfo,phone from masterusers where muserid = " + muserid + "";
		client.execute(query,function(err,result){
			if(err){
				// Return error message in response if error is occured during database operation.
				returnmsg = response.errorresponse(err);
        configlogger.sentry_error(error.dberrorquery,err);
				res.status(500).send(returnmsg);
			}else{
				// Return Detail of masteruser if database operation completed successfully.
				returnmsg = response.successresponse(error.success,result.rows);
        configlogger.debug(error.getuser,returnmsg);
				res.status(200).send(returnmsg);
			}
		})
	})

	//Endpoint  For masterusers Login
	app.post('/user/muser/login',function(req,res){

		var schema = validation.validationcheck("/user/muser/login",req.method);
		req.checkBody(schema);
		req.getValidationResult().then(function(result){
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				var emailid = req.body.emailid;
				var password = encryptpwd(req.body.password);
				// Prepare query statement
				query = "select * from masterusers where isdelete = false and isactive = true and emailid = '" + emailid + "' and password = '" + password + "' ALLOW FILTERING";
				client.execute(query,function(err,result){
					if (err) {
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err);
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					}
					else
					{
						if(result.rows.length == 1)
						{
							//Prepare Payload data for token
							var userData = {muserid:result.rows[0].muserid,emailid:result.rows[0].emailid};
							//Generate Token
							var resulttoken = jwt.sign(userData,config.secretkey,{expiresIn:50000});
							var responsejson = {authtoken:resulttoken};
							//Send Token to client
							returnmsg = response.successresponse(error.success,responsejson);
              configlogger.debug(error.loginsuccess,returnmsg);
							res.status(200).send(returnmsg);
						}
						else
						{
							//message apper if login is Failed
							returnmsg = response.errorresponse(error.loginfailed);
              configlogger.debug(error.loginfailed,returnmsg);
							res.status(401).send(returnmsg);
						}
					}
				})
			}
		})
	})

	//Refresh Tokens
	app.post('/user/muser/refresh',function(req,res){
		//Fetch old token from header
		var token = req.headers['authorization'];
		if (token) {
			//Get secretkey from request
			var secretkey = config.secretkey;

			//decode token data
			var decodedToken = jwt.decode(token, {complete: true});

			//Check token again credential updated on
			var fetchcredentialupdatedon = "select credentialupdatedon from masterusers where muserid = " + decodedToken.payload.muserid;
			client.execute(fetchcredentialupdatedon, function (err, result) {
				if (err) {
					returnmsg = response.errorresponse(err);
          configlogger.sentry_error(error.dberrorquery,err);
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
              configlogger.debug(error.refreshsuccess,returnmsg);
							res.status(200).send(returnmsg);
						}
						else {
							// Return message if credential is change
							returnmsg = response.errorresponse(error.credentialchangemessage);
              configlogger.debug(error.credentialchangemessage,returnmsg);
							res.status(401).send(returnmsg);
						}
					}
					else {
						// Return message if no record found.
						returnmsg = response.errorresponse(error.notfound);
            configlogger.debug(error.invalidrequest,returnmsg);
						res.status(404).send(returnmsg);
					}
				}
			});

		}
		else {
			// Return message if no tokan available
			returnmsg = response.errorresponse(error.tokennotavailable);
      configlogger.debug(error.invalidrequest,returnmsg);
			res.status(400).send(returnmsg);
		}
	})

	//check user uniqueness
	function useruniqueness(emailid){
		return new promise(function (resolve, reject) {
			// Prepare query statement
			var query = "select emailid from masterusers where isdelete = false and  emailid = '" + emailid + "' ALLOW FILTERING";
			client.execute(query,function(err,result){
				if(err){
					// Return error message in response if error is occured during database operation.
					returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
          configlogger.sentry_error(error.dberrorquery,err);
					reject(returnmsg);
				}else{
					// Return True or False message if database operation completed successfully.
					if(result.rows.length == 1){
						resolve(true)
					} else {
						resolve(false);
					}
				}
			})
		})
	}

	//password Encryption
	function encryptpwd(password){
		var cipher = crypto.createCipher(config.algorithm,config.passwordkey);
		var crypted = cipher.update(password,'utf8','hex');
		crypted += cipher.final('hex');
		return crypted;
	}
}
