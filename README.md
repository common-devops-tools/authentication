<b>rdm-authentication-usermanagement </b>
<br>
RDM authentication & usermanagement application is Node.js application using [Express 4](http://expressjs.com/).
<br>
Running Locally<br>
Make sure you have [Node.js](http://nodejs.org/)
<br>
git clone git@vm38.einfochips.com:ei-rdm/rdm-auth-usermanagement.git or clone your own fork <br>
cd rdm-auth-usermanagement <br>
npm install
<br>
npm run rundb  - (Create database) <br>
npm start - (Execute the project)
<br><br>
<b>Pre-requisites</b>
<br><br>
<b>Registering the following environment variables</b>
<br>
LOCAL SERVER PORT <br>
SERVERPORT="8090"
<br><br>
LOCAL DATABASE IP <br>
DATABASEIP="" 
<br><br>
LOCAL DATABASE PORT/OR ELSE EMPTY IF USING DEFAULT <br>
DATABASEPORT=""
<br><br>
DATABASE SCHEMA <br>
DATABASENAME=""
<br><br>
SECRET KEY FOR MASTER USER JWT AUTHENTICATION <br>
SECRETKEY=""
<br><br>
In addition to above parameters the following are also mentioned as environment variables
<br>
Logger Information
<br>
DSN of sentry <br>
UM_SENTRYDSN=""
<br>
Log level <br>
UM_SENTRYLEVEL=""
<br><br>

