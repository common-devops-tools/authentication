var mergeJSON = require("merge-json");
var error = require("../error");

module.exports = {
  validationcheck : function (url, method) {
    var schemacomplete = "", schemacommon = "", schemaoptional = "", schemaHeader = "";

    if ((url == "/user/muser" || url == "/user/appuser") && (method == "POST" || method == "PUT")) {
      if (method == "POST") {
        schemacommon = {
          'emailid': {
            isempty: {
              errorMessage: error.emptyemail
            },
            isEmail: {
              errorMessage: error.invalidemail
            }
          },
          'password': {
            isempty: {
              errorMessage: error.emptypassword
            },
            isstring: {
              errorMessage: error.notstring
            }
          }
        }
      }
      else {
        schemacommon = {
          'emailid': {
            optional: true,
            isempty: {
              errorMessage: error.emptyemail
            },
            isEmail: {
              errorMessage: error.invalidemail
            }
          },
          'password': {
            optional: true,
            isempty: {
              errorMessage: error.emptypassword
            },
            isstring: {
              errorMessage: error.notstring
            }
          }
        }
      }
      schemaoptional = {
        'firstname': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          },
          isempty:{
          errorMessage: error.emptyfirstname
          }
        },
        'lastname': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          },
          isempty: {
          errorMessage: error.emptylastname
          }
        },
        'metainfo': {
          optional: true,
          isobject: {
            errorMessage: error.notobject
          }
        },
        'phone': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          },
          isLength: {
            options: [{ min: 10, max: 10 }],
            errorMessage: error.tencharlong// Error message for the validator, takes precedent over parameter message
          }
        }
      }
      schemacomplete = mergeJSON.merge(schemacommon, schemaoptional);
      if (url == "/user/appuser" && method == "POST") {
        schemaHeader = {
          'x-clientid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyclientidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidclientid
            }
          }
        }
        schemacomplete = mergeJSON.merge(schemacomplete, schemaHeader);
      }
    }
    else if ((url == "/user/app") && (method == "POST" || method == "PUT")) {
      if (method == "POST") {
        schemacommon = {
          'appname': {
            isempty: {
              errorMessage: error.emptyappname
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'secretkey': {
            isempty: {
              errorMessage: error.emptysecretkey
            },
            isstring: {
              errorMessage: error.notstring
            }
          }
        }
      }
      else {
        schemacommon = {
          'appname': {
            optional: true,
            isempty: {
              errorMessage: error.emptyappname
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'secretkey': {
            optional: true,
            isempty: {
              errorMessage: error.emptysecretkey
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'x-appid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyappidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidappid
            }
          }
        }
      }
      schemaoptional = {
        'appdesc': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          }
        },
        'metainfo': {
          optional: true,
          isobject: {
            errorMessage: error.notobject
          }
        }
      }
      schemacomplete = mergeJSON.merge(schemacommon, schemaoptional);
    }
    else if ((url == "/user/role") && (method == "POST" || method == "PUT")) {
      if (method == "POST") {
        schemacommon = {
          'rolename': {
            isempty: {
              errorMessage: error.emptyrolename
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'x-appid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyappidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidappid
            }
          }
        }
      }
      else {
        schemacommon = {
          'rolename': {
            optional: true,
            isempty: {
              errorMessage: error.emptyrolename
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'x-roleid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyroleidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidroleid
            }
          }
        }
      }
      schemaoptional = {
        'roledesc': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          }
        },
        'metainfo': {
          optional: true,
          isobject: {
            errorMessage: error.notobject
          }
        }
      }
      schemacomplete = mergeJSON.merge(schemacommon, schemaoptional);
    }
    else if ((url == "/user/client") && (method == "POST" || method == "PUT")) {
      if (method == "POST") {
        schemacommon = {
          'clientname': {
            isempty: {
              errorMessage: error.emptyclientname
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'defaultrole': {
            isempty: {
              errorMessage: error.emptydefaultrole
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidroleid
            }
          },
          'x-appid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyappidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidappid
            }
          }
        }
      }
      else {
        schemacommon = {
          'clientname': {
            optional: true,
            isempty: {
              errorMessage: error.emptyclientname
            },
            isstring: {
              errorMessage: error.notstring
            }
          },
          'defaultrole': {
            optional: true,
            isempty: {
              errorMessage: error.emptydefaultrole
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidroleid
            }
          },
          'x-clientid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyclientidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidclientid
            }
          }
        }
      }
      schemaoptional = {
        'clientdesc': {
          optional: true,
          isstring: {
            errorMessage: error.notstring
          }
        },
        'metainfo': {
          optional: true,
          isobject: {
            errorMessage: error.notobject
          }
        }
      }
      schemacomplete = mergeJSON.merge(schemacommon, schemaoptional);
    }
    else if ((url == "/user/login" || url == "/user/muser/login") && method == "POST") {
      schemacommon = {
        'emailid': {
          isempty: {
            errorMessage: error.emptyemail
          },
          isEmail: {
            errorMessage: error.invalidemail
          }
        },
        'password': {
          isempty: {
            errorMessage: error.emptypassword
          },
          isstring: {
            errorMessage: error.notstring
          }
        }
      }
      if (url == "/user/login") {
        schemaoptional = {
          'x-clientid': {
            in: 'headers',
            isempty: {
              errorMessage: error.emptyclientidinheader
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidclientid
            }
          }
        }
        schemacomplete = mergeJSON.merge(schemacommon, schemaoptional);
      }
      else {
        schemacomplete = schemacommon;
      }
    }
    else if (url == '/user/verify') {
      schemacomplete = {
        'x-clientid': {
          in: 'headers',
          isempty: {
            errorMessage: error.emptyclientidinheader
          },
          isstring: {
            errorMessage: error.notstring
          },
          isUUID: {
            errorMessage: error.invalidclientid
          }
        }
      }
    }
    else if (method == "GET") {
      if (url == "/user/app" || url == "/user/role/list" || url == "/user/client/list" || url == "/user/appuser/list") {
        schemacomplete = {
          'appid': {
            in: 'query',
            isempty: {
              errorMessage: error.emptyappidinquery
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidappid
            }
          }
        }
      }
      else if (url == "/user/client") {
        schemacomplete = {
          'clientid': {
            in: 'query',
            isempty: {
              errorMessage: error.emptyclientidinquery
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidclientid
            }
          }
        }
      }
      else if (url == "/user/role") {
        schemacomplete = {
          'roleid': {
            in: 'query',
            isempty: {
              errorMessage: error.emptyroleidinquery
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidroleid
            }
          }
        }
      }
      else if (url == "/user/checkmasteruserunique" || url == "/user/checkappuserunique") {
        schemacomplete = {
          'emailid': {
            in: 'query',
            isempty: {
              errorMessage: error.emptyemail
            },
            isEmail: {
              errorMessage: error.invalidemail
            }
          }
        }
        if (url == "/user/checkappuserunique") {
          schemacommon = {
            'x-clientid': {
              in: 'headers',
              isempty: {
                errorMessage: error.emptyclientidinheader
              },
              isstring: {
                errorMessage: error.notstring
              },
              isUUID: {
                errorMessage: error.invalidclientid
              }
            }
          }
          schemacomplete = mergeJSON.merge(schemacomplete, schemacommon);
        }
      }
      else if(url == "/user/getappuser")
      {
        schemacomplete = {
          'userid': {
            in: 'query',
            isempty: {
              errorMessage: error.emptyuseridinquery
            },
            isstring: {
              errorMessage: error.notstring
            },
            isUUID: {
              errorMessage: error.invalidclientid
            }
          }
        }
      }
    }
    return schemacomplete;
  }
  
}
