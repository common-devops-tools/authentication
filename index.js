/*
File :- index.js
Description :- This file is entry point of our system. We can include all our apis file here.
Created Date :- 27-02-2017
Modify Date :- 30-03-2017
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var path = require('path');
var expressValidator = require("express-validator");
var config = require("./config.js").config;
var response = require("./responsemessage/responsemessage.js");
var error = require("./error");

global.client = null;
global.configlogger = null;

/* Logger configuration */
configlogger = require("./logger.js")();

/* bodyParser middleware check that Request body data contain proper json format or not */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }),function(err, req, res, next){
  if(err){
    returnmsg = response.errorresponse(error.jsonformat);
    configlogger.debug(error.invalidrequest,returnmsg);
    res.status(400).send(returnmsg);
  }else {
    next();
  }
});

/* custome validation to check data is in proper format or not */
app.use(expressValidator({
  customValidators: {
    isobject: function(value) {
      if(typeof value == 'object'){
        return true
      } else {
        return false
      }
    },
    isstring: function(value) {
      if(typeof value == 'string'){
        return true
      } else {
        return false
      }
    },
    isempty: function (value) {
      if (value != undefined && !((/^\s*$/).test(value))) {
        return true
      } else {
        return false
      }
    }
  }
}));


/* Set path for different API modules */
app.set('apis',path.join(__dirname,'apis'));
app.set('login',path.join(__dirname,'login'));
app.set('middleware',path.join(__dirname,'middleware'));
app.set('responsemessage',path.join(__dirname,'responsemessage'));
app.set('validation',path.join(__dirname,'validation'));

require("./dbconnection.js").dbconnection().then(function(result){
  configlogger.info("Database connection done successfully");
}).catch(function(err){
  configlogger.sentry_error('Database connection error',{'IP ' : config.databaseip,'Error details':err});
});

//middleware
require("./middleware/middleware.js")(app,bodyParser);

//Load Login & verify API's
require('./login/login.js')(app);

//Load masteruser ,clientmanage ,appmanage ,appuser ,rolemanage API's
require('./apis/application_management/appmanage.js')(app);
require('./apis/client_management/clientmanage.js')(app);
require('./apis/master_user_login/mumanage.js')(app);
require('./apis/role_management/rolemanage.js')(app);
require('./apis/app_user_login/appuser.js')(app);


//PORT declaration
app.set('port', process.env.PORT || config.serverport );
server.listen(app.get('port'),function(err){
  if(err){
    console.log('Server is Not Started');
    console.log(err);
  }else {
    configlogger.info('Server start-up successful',{'Server port ' : app.get('port')});
  }
});
