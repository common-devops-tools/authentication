var cassandra = require('cassandra-driver');
var promise = require("bluebird");
var config = require("./config.js").config;

module.exports = {
  /* Connect with database and return connection object if connection done successfully */
  dbconnection : function(){
    return new promise(function (resolve, reject) {
  		global.client = new cassandra.Client({ contactPoints:[ config.databaseip ], keyspace: config.databasename });
  		client.connect(function(err){
  		  if(err){
  		    configlogger.sentry_error('Database connection error',{'IP ' : config.databaseip,'Error details':err});
          reject(err)
  		  }else {
          configlogger.info("Database connection done successfully");
          resolve(global.client);
  		  }
  		})
    })
  },
}
