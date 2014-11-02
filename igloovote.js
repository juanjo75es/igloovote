


/************************************************************************************/
/************************************************************************************/
/********************* CLASS VOTE_SYSTEM ********************************************/
/************************************************************************************/
/************************************************************************************/

var calc_size = function(obj) {     var size = 0, key;     for (key in obj) {         if (obj.hasOwnProperty(key)) size++;     }     return size; }; 

var vote_system= function()
{
	var crypt;
	var socket;
	var votos;
	var election_id;
	var user_id;
	var m_secret_passphrase;
	this.history=new Array();
	this.state='connecting';
	this.connections=new Array();
	this.crypt = new JSEncrypt({default_key_size: 1024});
	this.crypt2 = new JSEncrypt({default_key_size: 1024});
	key = this.crypt.getKey();
    publicKey = key.getPublicKey();
	privateKey = key.getPrivateKey();
	this.g_ballot_id='';

	PassPhrase = makeid(64);
    var Bits = 1024;	  
    
	  rsa = new RSAKey();
	  rsa.readPrivateKeyFromPEMString(privateKey);
    

};


vote_system.prototype.send_msg = function (msg)
{
      // Alternate the values.
	  //var sigValueHex = this.crypt.encrypt(msg);
	  //$('#echo_msg').val(sigValueHex);
	  OutputLog('Sent: '+msg);
 	  socket.send(msg);
};

/************************************************************************************/
/************************************************************************************/
/************************************************************************************/

function OutputLog(msg){
				var content = '<p>' + msg + '</p><p>&nbsp;</p>';
				$('#consolebox').append(content);
				var objDiv = document.getElementById("consolebox");
				objDiv.scrollTop = objDiv.scrollHeight;
			};

function split_ballots(remaining)
{
	var a=new Array();
	var n=remaining.length;
	for(i=0;i<n;i++)
	{
		var option=remaining[i].substr(0,2);
		if(a[option]===undefined)
			a[option]=new Array();
		a[option][a[option].length]=remaining[i];	
	}
	
	return a;
}

function delete_connection(id)
{
	var n=votos.connections.length;
	for(i=0;i<n;i++)
	{
		if(votos.connections[i][0]==id)
		{
			votos.connections.splice(i,1);
			n=votos.connections.length;
		}
	}
}


function makeid(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function join_remaining(remaining_options)
{
	var a=new Array();
	var n=remaining_options.length;
	for(option in remaining_options)
	{
		for(ballot in remaining_options[option])
		{
			a[a.length]=remaining_options[option][ballot];
		}
	}
	shuffle(a);
	return a;
}

function check_remaining_ballots(remaining)
{
	var a=new Array();
	var n=remaining.length;
	for(option in remaining)
	{
		for(h in votos.history)
		{
			if(remaining[option]==votos.history[h])
			{
				OutputLog('Error in check : '+ remaining[option] +' was chosen');	
				return false;
			}
		}
	}
	//falta mirar que no haya más de la cuenta de cada opción
	//depende del número de agentes
	return true;
}

var key;
var publicKey;
var privateKey;
var rsa;
var PassPhrase;
var final_remaining;
var b_errors_enabled=true;

function reconnect_websocket()
{
	hide_error();
	votos.state=0;
	votos.connections=new Array();
	votos.history=new Array();
	votos.verifications=new Array();
	shuffle(votos.round_option);
	b_errors_enabled=true;
	
	for(o in votos.my_options)
	{
		votos.my_options[o]=new Array();
	}
	
	document.getElementById('status-1').className="inprogress";
	document.getElementById('status-2').className="undone";
	document.getElementById('status-3').className="undone";
	document.getElementById('status-4').className="undone";
	document.getElementById('progress-1').style.visibility="visible";
	document.getElementById('progress-2').style.visibility="hidden";
	document.getElementById('progress-3').style.visibility="hidden";
	document.getElementById('progress-4').style.visibility="hidden";
	document.getElementById('done1').style.display="none";
	document.getElementById('done2').style.display="none";
	document.getElementById('done3').style.display="none";
	document.getElementById('done4').style.display="none";
	document.getElementById('progress-1').value=0;
	document.getElementById('progress-2').value=0;
	document.getElementById('progress-3').value=0;
	document.getElementById('progress-4').value=0;
	var host = "wss://www.igloovote.com:8080";
	try{
				socket = new WebSocket(host,'dumb-increment-protocol');
				OutputLog('Socket Status: '+socket.readyState);
				socket.onopen = function(){
					OutputLog('Socket Status: '+socket.readyState+' (open)');
					var pseudoName = votos.user_id;
					//votos.send_msg('CONNECT_CLUSTER#000000001#'+pseudoName+'#'+MattsPublicKeyString);
					votos.send_msg('CONNECT_CLUSTER#'+votos.election_id+'#'+pseudoName+'#'+publicKey);
				}
				
				socket.onmessage = function(msg){
					var str = "";
					str = msg.data;
					//OutputLog('Recibido : '+str);
					var id  = str.substr(0, 1);
					var separator = str.indexOf("|");
					var arg1 = "";
					var arg2 = "";
					if(separator != -1)
					{
						arg1 = str.substr(1, separator-1);
						arg2 = str.substr(separator+1);
					}
					else
						arg1 = str.substr(1);				
					
					if(id == "0"){
						OutputLog('Server reply : '+arg1);	
						
						//OutputLog("Command: "+command);
					}
					if(id == "1"){
						OutputLog('Server msg : '+arg1);	
					}
					if(id == "2"){
						OutputLog(arg1 + ' said : ' + arg2);	 						
					}
					if(id == "3"){
						OutputLog('Server broadcasted : ' + arg1);	 						
					}
					if(id == "4"){
						OutputLog('Server streamed : '+arg1);	
					}

					
					var arguments=arg1.split("#");
					var command=arguments[0];
					switch(command)
					{
						case 'Connected':
							votos.g_ballotbox_id=arguments[1];
							OutputLog("BallotBox Id:"+votos.g_ballotbox_id);
						break;
						case 'Connection':
							votos.connections[votos.connections.length]=[arguments[1],arguments[2]];
							document.getElementById('progress-1').value=votos.connections.length*100/votos.clustersize;
						break;
						case 'Disconnection':
							if(votos.state<4)
							{
								delete_connection(arguments[1]);
								document.getElementById('progress-1').value=votos.connections.length*100/votos.clustersize;
							}
						break;
						case 'Cancellation':
							if(votos.state<4)
							{
								var err=arguments[1];
								show_error(err,arguments);
							}
						break;
						case 'NEW_STATE':
							var state=arguments[1];
							votos.state=state;
							{
								switch(state)
								{
								case "1":
									document.getElementById('status-1').className="done";
									document.getElementById('status-2').className="inprogress";
									document.getElementById('progress-1').style.visibility="hidden";
									document.getElementById('progress-2').style.visibility="visible";
									document.getElementById('done1').style.display="inline";
									setTimeout("show_warning('Please don\\'t disconnect until the voting ends or you could be unable to reconnect for a few minutes',15000)", 3000);
								break;
								case "2":
									document.getElementById('status-2').className="done";
									document.getElementById('status-3').className="inprogress";
									document.getElementById('progress-2').style.visibility="hidden";
									document.getElementById('progress-3').style.visibility="visible";
									document.getElementById('done2').style.display="inline";
								break;
								case "3":
									document.getElementById('status-3').className="done";
									document.getElementById('status-4').className="inprogress";
									document.getElementById('progress-3').style.visibility="hidden";
									document.getElementById('progress-4').style.visibility="visible";
									document.getElementById('done3').style.display="inline";
								break;
								case "4":
									document.location.href="http://www.igloovote.com/get_ballot.php?id="+votos.g_ballotbox_id+"&user="+votos.user_id+"&eid="+votos.election_id;
									document.getElementById('status-4').className="done";		
									document.getElementById('progress-4').style.visibility="hidden";
									document.getElementById('done4').style.display="inline";
								break;
								}
							}
							break;
						case 'SIGN_RESULT':
							
							var certificado;
							certificado=votos.user_id+'@'+votos.election_id+'@'+votos.g_ballotbox_id+'@'
								+final_remaining;
							var hSig = rsa.signString(certificado, 'sha1');
						    var signature = linebrk(hSig, 64);
						    votos.send_msg('SIGNED_RESULT#'+certificado+'#'+signature);
							break;
						case 'OPTION_BALLOT_FROM':
							var option=arguments[1];
							var pos=arguments[2];
							var ballot_id=arguments[3];
							a_ballot_id=ballot_id.split('@');
							ballot_id=a_ballot_id[0];
							document.getElementById('progress-3').value=pos*100/votos.connections.length;
							var secret_passphrase=a_ballot_id[1];
							secret_passphrase=votos.crypt.decrypt(secret_passphrase);
							//var ballot_id = cryptico.decrypt(ballot_id, MattsRSAkey).plaintext;
							var ballot_id = hex2a(CryptoJS.TripleDES.decrypt(ballot_id, secret_passphrase).toString());
							OutputLog("Check ballot: "+ballot_id);
							if(ballot_id.substr(0,2)!=option)
							{
								OutputLog("E1");
								votos.send_msg('ERROR_IN_BALLOT_VALIDATION#'+ballot_id);
								break;
							}
							//check that ballot is not in list of not used ballots
							for(o in final_remaining)
							{
								if(final_remaining[o]==ballot_id)	
								{
									OutputLog("E2");
									votos.send_msg('ERROR_IN_BALLOT_VALIDATION#'+ballot_id);
									break;	
								}
							}
							//check that nobody else(including us) used the same ballot id
							for(o in votos.history)
							{
								if(votos.history[o]==ballot_id)
								{
									OutputLog("E3");
									votos.send_msg('ERROR_IN_BALLOT_VALIDATION#'+ballot_id);
									break;
								}
							}
							for(o in votos.verifications)
							{
								if(votos.verifications[o]==ballot_id)
								{
									OutputLog("E4");
									//hacer que envíe aquí ids de los dos que repiten papeleta
									votos.send_msg('ERROR_IN_BALLOT_VALIDATION#'+ballot_id+'#'+o);
									break;
								}
							}
							votos.verifications[pos]=ballot_id;
							
						break;
						case 'GIVE_OPTION_BALLOT_TO':
							var option=arguments[1];
							var public_key_to_send=arguments[2];
							var myposition=arguments[3];
							var position_of_asker=arguments[4];
							if(public_key_to_send!==undefined)
							{
								//votos.crypt.setPublicKey();
								var o;
								if(votos.my_options[option].length==1)
									o=votos.my_options[option][0];
								else
								{
									if(votos.es_tramposo)
									{
										var e=Math.floor(Math.random()*(votos.connections.length-1));
										o=option+e;
									}
									else
									{
										var e=Math.floor(Math.random()*votos.my_options[option].length);
										o=votos.my_options[option][e];
									}
								}
								//var encrypted=cryptico.encrypt(o, public_key_to_send);
								//votos.send_msg('MY_OPTION_BALLOT#'+position_of_asker+'#'+votos.g_ballotbox_id+'#'+encrypted.cipher);
								var secret_passphrase=votos.m_secret_passphrase;
								var encrypted = CryptoJS.TripleDES.encrypt(o, secret_passphrase);
								votos.crypt2.setPublicKey(public_key_to_send);
								secret_passphrase=votos.crypt2.encrypt(secret_passphrase);
								votos.send_msg('MY_OPTION_BALLOT#'+position_of_asker+'#'+encrypted+'@'+secret_passphrase);
}
							
							break;
						case 'CHOOSE_BALLOT':
							var _round=arguments[1];
							var x=parseInt(_round)*100/(calc_size(votos.my_options)+1);
							document.getElementById('progress-2').value=x;
							var pos=arguments[2];
							OutputLog("Round "+_round);
							var sremaining=arguments[3];
							var public_key_to_send=arguments[4];
							if(_round>0 || pos>0)
							{
								//sremaining=votos.crypt.decrypt(sremaining);
								var aremaining=sremaining.split('@');
								var secret_passphrase=aremaining[1];
								secret_passphrase=votos.crypt.decrypt(secret_passphrase);
								sremaining=aremaining[0];
								sremaining = hex2a(CryptoJS.TripleDES.decrypt(sremaining, secret_passphrase).toString());
								
								//sremaining = cryptico.decrypt(sremaining, MattsRSAkey).plaintext;
							}
							var remaining=sremaining.split(";");
							if(!check_remaining_ballots(remaining))
							{
								if(!votos.es_tramposo)
								{
								
								}
							}
							var option=votos.round_option[_round];
							if(votos.es_tramposo)
							{
									option=votos.myoption;
									 
							}
													
							var remaining_options=split_ballots(remaining);
							var no;
							try
							{
							no=remaining_options[option].length;
							}
							catch (e)
							{
								if(!votos.es_tramposo)
								{
									votos.send_msg('ERROR_IN_REMAINING_BALLOTS#'+remaining.join(";"));
								}
							}
							if(no==0)
							{
								//somebody cheated
								if(votos.es_tramposo)
								{
									votos.send_msg('ERROR_IN_REMAINING_BALLOTS#'+remaining.join(";"));
								}
								break;
							}
							var e=Math.floor(Math.random()*no);
							votos.history[_round]=remaining_options[option][e];
							votos.my_options[option][votos.my_options[option].length]=votos.history[_round];
							OutputLog('Chosen : '+ votos.history[_round]);
							remaining_options[option].splice(e,1);
							remaining=join_remaining(remaining_options);
							var secret_passphrase=votos.m_secret_passphrase;
							if(public_key_to_send!==undefined)
							{
								//votos.crypt.setPublicKey();
								var encrypted = CryptoJS.TripleDES.encrypt(remaining.join(";"), secret_passphrase);
								votos.crypt2.setPublicKey(public_key_to_send);
								secret_passphrase=votos.crypt2.encrypt(secret_passphrase);
								votos.send_msg('REMAINING_BALLOTS#'+votos.g_ballotbox_id+'#'+votos.g_ballotbox_id+'#'+encrypted+'@'+secret_passphrase);
								//var encrypted=cryptico.encrypt(remaining.join(";"), public_key_to_send);
								//votos.send_msg('REMAINING_BALLOTS#000000001#'+votos.g_ballotbox_id+'#'+encrypted.cipher);
							}
							else
								votos.send_msg('REMAINING_BALLOTS#'+votos.g_ballotbox_id+'#'+votos.g_ballotbox_id+'#'+remaining.join(";"));
							break;
						case 'FINAL_REMAINING_BALLOTS':
							var remaining=arguments[1].split(";");
							final_remaining=remaining;
							if(!check_remaining_ballots(remaining))
								votos.send_msg('ERROR_IN_REMAINING_BALLOTS#'+remaining.join(";"));
							
							break;
						case 'WARNING':
							var sa1=arguments[1];
							var unit=arguments[2];
							var p=arguments[3];
							show_warning('WARNING: '+p+' '+unit+' '+sa1,3000);
							break;
						case 'ERROR':
							var e=arguments[1];
							show_error(e,arguments);
							break;
}
				
														
				}
				
				socket.onclose = function(){
					OutputLog('Socket Status: '+socket.readyState+' (Closed)');
				}			
					
	} catch(exception){
			OutputLog('Error'+exception);
	}
	
}
