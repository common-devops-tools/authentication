/*
File :- appmanage.js
Description :- This file is used to manage application.
Using this  file we can create app,update app,list app & get app of particular master user.
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

module.exports = function(app){

	var returnmsg = "";
	//This API is used for create app
	app.post('/user/app',function(req,res){
		// Build schema for validate request
		var schema = validation.validationcheck("/user/app",req.method);
		// check requested schema
		req.checkBody(schema);
		// Check validation errors
		req.getValidationResult().then(function(result){
			// Fetch first error of our array of errors.
			var errors =  result.useFirstErrorOnly().array();
			if(errors.length > 0){
				// Send validation in response
				returnmsg = response.errorresponse(errors);
        configlogger.debug(error.invalidrequest,returnmsg);
				res.status(400).send(JSON.stringify(returnmsg));
			}
			else {
				//Remove muserid from req.body if it is exists
        if(req.body['muserid'] != undefined)
        {
            delete req.body['muserid'];
        }
				// Fetch logged in user id from authorization object of request object.
				var muserid = req.authorization.muserid;
				// Generate dynamic app id
				var id = cassandra.types.Uuid.random();


				// Create dynamic json for internal used fields like create time,app id,is active etc.
				var stfieldstr = '{ "appid" :"' + id + '","create_ts":"'+ moment.utc() + '","mod_ts":"'+ moment.utc() + '", "muserid" : "' + muserid + '","isactive" :"true","isdelete":"false" }' ;

				// Merge our internal field json with request body parameter
				var result = mergeJSON.merge(JSON.parse(stfieldstr),req.body) ;
				// Prepare query statement
				var query = "INSERT INTO appinfo json '" + JSON.stringify(result) + "'";

				// Execute query in cassandra using its client object
				client.execute(query,function(err, result) {
					if (err){
						// Return error message in response if error is occured during database operation.
						returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
            configlogger.sentry_error(error.dberrorquery,err);
						res.status(500).send(returnmsg);
					} else {
						// Return success message if database operation completed successfully.
						returnmsg = response.successresponse(error.success,JSON.parse('{"appid":"'+ id + '"}'));
            configlogger.debug(error.appcreated,returnmsg);
						res.status(201).send(returnmsg);
					}
				}
			)
		}

	})


});

//This API is used for update app.
app.put('/user/app',function(req,res){
	// Build schema for validate request
	var schema = validation.validationcheck("/user/app",req.method);
	// check requested schema
	req.checkBody(schema);
	// Check validation errors
	req.getValidationResult().then(function(result){
		// Fetch first error of our array of errors.
		var errors =  result.useFirstErrorOnly().array();
		if(errors.length > 0){
			// Send validation in response
			returnmsg = response.errorresponse(errors);
      configlogger.debug(error.invalidrequest,returnmsg);
			res.status(400).send(JSON.stringify(returnmsg));
		}
		else {
      var logData = req.body;
			//Remove appid from req.body if it is exists
			if(req.body['appid'] != undefined)
			{
				delete req.body['appid'];
			}
			var appid = req.headers['x-appid'];
			var qparam = "";

			// Iterate all key of request data to create our json for update data in database.
			for(var key in req.body) {
				// Key fields (i.e. muserid, appid etc.) & boolean datatype fields (i.e. isactive,isdelete) does not require single quote in update query.
				// So we prepare query parameter without single quote
				if(typeof(req.body[key]) == "boolean")
				{
					qparam += key + " = " + req.body[key] + ",";
				}
				// String type variables require single quote in query. So we prepare query parameter with single quote
				else if(typeof(req.body[key]) == "string")
				{
					qparam += key + " = '" + req.body[key] + "',";
				}
				// object type variables (i.e. metainfo) required single quote in its key-value pair. So we can replace its double quote with single quote.
				else if(typeof(req.body[key]) == "object")
				{
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
			var query = 'UPDATE appinfo SET '+ qparam.slice(0, -1) +' WHERE appid= ' + appid;

			// Execute query in cassandra using its client object
			client.execute(query,function(err, result) {
				if (err){
					// Return error message in response if error is occured during database operation.
					returnmsg = response.errorresponse(err.message.replace(/"/g, " "));
          configlogger.sentry_error(error.dberrorquery,err);
					res.status(500).send(returnmsg);
				} else {
					// Return success message if database operation completed successfully.
					returnmsg = response.successresponse(error.success,null);
          configlogger.debug(error.appupdated,logData);
					res.status(200).send(returnmsg);
				}
			}
		)
	}
})
});

//This API is used for get app by appid.
app.get('/user/app',function(req,res){
	// Build schema for validate request
	var schema = validation.validationcheck("/user/app",req.method);
	// check requested schema
	req.checkBody(schema);
	// Check validation errors
	req.getValidationResult().then(function(result){
		// Fetch first error of our array of errors.
		var errors =  result.useFirstErrorOnly().array();
		if(errors.length > 0){
			// Send validation in response
			returnmsg = response.errorresponse(errors);
      configlogger.debug(error.invalidrequest,returnmsg);
			res.status(400).send(JSON.stringify(returnmsg));
		}
		else {
			// Fetch appid from header
			var appid = req.query['appid'];
			// Prepare query statement
			var query = "SELECT * FROM appinfo where appid = " + appid;
			// Execute query in cassandra using its client object
			client.execute(query,function(err,result){
				if(err)
				{
					// Return error message in response if error is occured during database operation.
					returnmsg = response.errorresponse(err);
          configlogger.sentry_error(error.dberrorquery,err);
					res.status(500).send(returnmsg);
				}
				else{
					// Return result set if database operation completed successfully.
					returnmsg = response.successresponse(error.success,result.rows);
          configlogger.debug(error.appget,returnmsg);
					res.status(200).send(returnmsg);
				}
			})
		}
	})
});

//This API is used for get all apps by masteruserid.
app.get('/user/app/list',function(req,res){
	// Fetch logged in user id from authorization object of request object.
	var muserid = req.authorization.muserid;
	// Prepare query statement. Master user can only access its non deleted apps
	var query = "SELECT * FROM appinfo where isdelete = false and muserid = " + muserid + " ALLOW FILTERING";
	// Execute query in cassandra using its client object
	client.execute(query,function(err,result){
		if(err)
		{
			// Return error message in response if error is occured during database operation.
			returnmsg = response.errorresponse(err);
      configlogger.sentry_error(error.dberrorquery,err);
			res.status(500).send(returnmsg);
		}
		else{
			// Return result set if database operation completed successfully.
			returnmsg = response.successresponse(error.success,result.rows);
      configlogger.debug(error.appget,returnmsg);
			res.status(200).send(returnmsg);
		}

	})
});

}
