#!/usr/bin/env node

/*
File :- db.js
Description :- This file is used to create database & schema in cassandra.
This file is execute when we want to create new database of our application.
Created Date :- 27-02-2017
Modify Date :- 30-03-2017
*/
var config = require("../config").config;
var databaseip = config.databaseip;
var databasename = config.databasename;
var cassandra = require('cassandra-driver');
var winston = require('winston');
var sentry = require('winston-common-sentry');
var error = require('../error');

logger = new winston.Logger({
    transports: [
        new sentry({
                level: config.sentrylevel,
                dsn: config.sentrydsn
        })
    ],
});


const client = new cassandra.Client({ contactPoints: [databaseip]});

/**
* Creates a table and retrieves its information
*/
client.connect()
.then(function () {
  const query = "CREATE KEYSPACE IF NOT EXISTS " + databasename + " WITH replication =" +
  "{'class': 'SimpleStrategy', 'replication_factor': '1' }";
  return client.execute(query);
})
.then(function(){
  logger.debug(error.dbcreate);
})
.then(function () {
  const query1 = "CREATE TABLE " + databasename  + ".masterusers (muserid uuid PRIMARY KEY,emailid varchar,password varchar,firstname varchar,lastname varchar,phone varchar,create_ts timestamp,mod_ts timestamp,mod_by uuid,isactive boolean,isdelete boolean,metainfo map<varchar,varchar>, credentialupdatedon timestamp);";
  const query2 = "CREATE TABLE " + databasename  + ".appinfo (appid uuid PRIMARY KEY,muserid uuid,appname varchar,appdesc varchar,create_ts timestamp,mod_ts timestamp,mod_by uuid,	 secretkey varchar,isactive boolean,isdelete boolean,metainfo map<varchar,varchar> );";
  const query3 = "CREATE TABLE " + databasename  + ".users (userid uuid PRIMARY KEY,appid uuid,emailid varchar,password varchar,firstname varchar,lastname varchar,phone varchar,create_ts timestamp,mod_ts timestamp,mod_by uuid,isactive boolean,isdelete boolean,role list<uuid>,metainfo map<varchar,varchar>, credentialupdatedon timestamp); ";
  const query4 = "CREATE TABLE " + databasename  + ".role (roleid uuid PRIMARY KEY,appid uuid,rolename varchar,roledesc  varchar, create_ts timestamp,mod_ts timestamp,mod_by uuid,isactive boolean,isdelete boolean,metainfo map<varchar,varchar> );";
  const query5 = "CREATE TABLE " + databasename  + ".clientinfo (clientid uuid PRIMARY KEY,appid uuid,clientname varchar,clientdesc varchar,create_ts timestamp,mod_ts timestamp,mod_by uuid,	 defaultrole uuid,isactive boolean,isdelete boolean,metainfo map<varchar,varchar> );";
  client.execute(query1).then(dispalytable.bind(null,'masterusers'));
  client.execute(query2).then(dispalytable.bind(null,'appinfo'));
  client.execute(query3).then(dispalytable.bind(null,'users'));
  client.execute(query4).then(dispalytable.bind(null,'role'));
  client.execute(query5).then(dispalytable.bind(null,'clientinfo'));
}).then(function(){
  logger.debug(error.tablecreate);
})
.catch(function (err) {
  logger.error(error.dberrorquery,err);
  return client.shutdown();
});

//callback function
function dispalytable(tblname)
{
  console.log(tblname);
  client.metadata.getTable(databasename, tblname, function (err, table) {

    if (!err) {
      console.log("------------------------");
      console.log('Table %s', table.name);
      console.log("--------");
      table.columns.forEach(function (column) {
        console.log( column.name);
      });
      console.log("------------------------");
    }
  });
}
