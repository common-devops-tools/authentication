module.exports = {
  config : {
    serverip : process.env.SERVERIP,
    serverport : process.env.SERVERPORT,
    databaseip : process.env.DATABASEIP,
    databaseport : process.env.DATABASEPORT,
    databasename : process.env.DATABASENAME,
    secretkey : process.env.SECRETKEY,
    sentrydsn : process.env.UM_SENTRYDSN,
    sentrylevel : process.env.UM_SENTRYLEVEL,
    algorithm: "aes-256-ctr",
    passwordkey: "d6F3Efeq",
    ismasteruserverify : false
   }
};
