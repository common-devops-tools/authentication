module.exports = {
	errorresponse : function(message){
		if(typeof message == "object"){
			return JSON.parse('{"errormessage":' + JSON.stringify(message) +'}');
		}
		else{
			return JSON.parse('{"errormessage":"' + message +'"}');
		}
		
	},

	successresponse : function(message,result){
		if(result){
			return JSON.parse('{"success":"' + message +'","result":' + JSON.stringify(result) +'}');
		} else {
			return JSON.parse('{"success":"' + message +'"}');
		}
	}

}
