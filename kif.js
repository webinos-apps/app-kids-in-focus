/*
	This file is part of webinos project.
	
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
 */
/*
 * kif.js
 *
 * The app Kids in Focus WRT side.
 *
 * Katarzyna Włodarska, Wei Guo, Andrea Longo, Alexander Futasz
 * 06-12-2012
 */

// Kasia's module starts here - reworked by kwlodarska 29.03

/* lock/unlock play screen */

function showTextChat() {
   document.getElementById("chat").style.display = 'table-row';
   document.getElementById("textButton").setAttribute('onClick', 'hideTextChat();');
   //added to remove the incoming message notification A. Longo 30.04
   document.getElementById('textButton').style.border = 'none';
}

function hideTextChat() {
   document.getElementById("chat").style.display = 'none';
   document.getElementById("textButton").setAttribute('onClick', 'showTextChat();');
}

function lockGame() {
   var newElem = document.getElementById("newElem");
   newElem.className = 'disabled';

   var newButton = document.getElementById("newButton");
   newButton.removeAttribute('onClick');

   var lockButton = document.getElementById("lockButton");
   lockButton.innerHTML = "Unlock";
   lockButton.setAttribute('onClick', 'openPopup(); return false;');

   var endElem = document.getElementById("endElem");
   endElem.className = 'disabled';

   var endButton = document.getElementById("endButton");
   endButton.removeAttribute('onClick');
};

function closePopup() {
   var opacityBack = document.getElementById("opacityBack");
   opacityBack.parentNode.removeChild(opacityBack);

   var popBack = document.getElementById("popBack");
   popBack.parentNode.removeChild(popBack);
}

function openPopup() {
   var parent = document.getElementById("content");

   //semi-transparent background layer
   var opacityBack = document.createElement('div');
   opacityBack.setAttribute('id','opacityBack');
   opacityBack.className = 'opacity-background';
   parent.appendChild(opacityBack);

   var paragraph = document.createElement('p');
   paragraph.appendChild(document.createTextNode('Enter password to unlock game options.'));

   var input = document.createElement('input');
   input.setAttribute('type','password');
   input.setAttribute('id','password');

   var submit = document.createElement('input');
   submit.className = 'button';
   submit.setAttribute('type','submit');
   submit.setAttribute('value','Unlock');
   submit.setAttribute('onClick', 'unlockGame(); return false;');

   var cancel = document.createElement('input');
   cancel.className = 'button red';
   cancel.setAttribute('type','submit');
   cancel.setAttribute('value','Cancel');
   cancel.setAttribute('onClick', 'closePopup(); return false;');

   var subDiv = document.createElement('div');
   subDiv.className = 'popup-input';
   subDiv.appendChild(cancel);
   subDiv.appendChild(submit);

   var form = document.createElement('form');
   form.appendChild(paragraph);
   form.appendChild(input);
   form.appendChild(subDiv);

   // Popup container & positioning layers
   var insideDiv = document.createElement('div');
   insideDiv.className = 'popup-positioning';
   insideDiv.appendChild(form);

   var popup = document.createElement('div');
   popup.className = 'popup';
   popup.appendChild(insideDiv);

   var outsideDiv = document.createElement('div');
   outsideDiv.className = 'popup-positioning';
   outsideDiv.appendChild(popup);

   var popBack = document.createElement('div');
   popBack.setAttribute('id','popBack');
   popBack.className = 'popup-background';
   popBack.appendChild(outsideDiv);

   parent.appendChild(popBack);
}

function unlockGame() {
   var newElem = document.getElementById("newElem");
   var newButton = document.getElementById("newButton");
   newElem.className = "button2";
   newButton.setAttribute('onClick', 'newGame(); return false;');

   var lockButton = document.getElementById("lockButton");
   lockButton.setAttribute('onClick', 'lockGame(); return false;');
   lockButton.innerHTML = "Lock";

   var endElem = document.getElementById("endElem");
   var endButton = document.getElementById("endButton");
   endElem.className = "button2";
   endButton.setAttribute('onClick', 'exitGame(); return false;');

   var opacityBack = document.getElementById("opacityBack");
   opacityBack.parentNode.removeChild(opacityBack);

   var popBack = document.getElementById("popBack");
   popBack.parentNode.removeChild(popBack);
};

// mark option
function mark(attr) {
	 //changed without using jquery - A. Longo 19.03.12
	if((attr == null || gamet.currentTurn) && !gamet.newGameProposal)
		{
		   for(var i=1; i<=5; i++) {
			removeClass(document.getElementById('c1attr'+i),'marked');
		   }
		addClass(document.getElementById(attr),'marked');
		}
};

// Kasia's module ends here


// Notifies listeners when the DOM finished parsing (while images and css may still load)
// Equivalent to jquery's ready()
(function(){
	var readyListener = [];

	var loaded = function() {
		window.removeEventListener("load", loaded, false);
		document.removeEventListener("DOMContentLoaded", loaded, false);

		for (var i = 0; i < readyListener.length; i++) {
			setTimeout(readyListener[i], 1);
		}
		readyListener = [];
	};

	// The case where ready() is called after the DOM is loaded already
	if (document.readyState === "complete") {
		// Handle it asynchronously to allow scripts the opportunity to delay ready
		return setTimeout(loaded, 1);
	}

	if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", loaded, false);

		// A fallback to window.onload, that will always work
		window.addEventListener("load", loaded, false);
	}

	// Call this to register your DOM ready listener function
	ready = function(listener) {
		readyListener.push(listener);
	};
})();

// function added by Polito
// this is a workaround. In the future, in multi-PZH scenarios, the plan is to obtain the userID from the platform.
// However, the option to change the userID obtained could be kept, keeping the following mechanism as well.
ready(function() {
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'),
		{
		onFound: function(service){
			var listenerID;
			eventAPIToUse = service;
			unavailableNames = [];
			myName = webinos.messageHandler.getOwnId();

			listenerID = eventAPIToUse.addWebinosEventListener(function(event){
				if (event.payload.type === 'nameResponse') {
					unavailableNames.push(event.payload.user);
				}
			});

			var callback = {};
			var ev = eventAPIToUse.createWebinosEvent('nameQuery');
			var evLoad = {};
			evLoad.type = 'nameQuery';
			evLoad.user = myName;
			ev.payload = evLoad;
			ev.dispatchWebinosEvent(callback);

			setTimeout(nameInput, 3000);

			function nameInput() {
				myName = prompt("please, insert your name");

				while (myName === '' || unavailableNames.indexOf(myName) !== -1) {
					myName = prompt("please insert a different name");
				}

				eventAPIToUse.removeWebinosEventListener(listenerID);

				if (myName !== null && myName !== undefined && myName !== '') {
					start(myName);
				}
				else {
					alert('username is missing');
				}
			}
		}
	});
});

// function modified by Polito
// this is the former ready function, renamed to start and called from the current ready function
var start = function(myName) { // former ready function

/*ready(function() {

	// modified by Polito
	// webinos events findServices moved to ready function
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'),

		// callback
		{
		onFound: function(service){

			eventAPIToUse = service;*/

			eventAPIToUse.addWebinosEventListener(function(event){
				if (typeof kidsinfocusUsers === 'undefined'){
					alert("kidsinfocusUsers undefined!");
					kidsinfocusUsers = new Array();
				}

				for(var i in kidsinfocusUsers)
					console.log(kidsinfocusUsers[i]);

				switch(event.payload.type){
				// event added by Polito
				case 'nameQuery':
					var callback = {};
					var ev = eventAPIToUse.createWebinosEvent('nameResponse');
					var evLoad = {};
					evLoad.type = 'nameResponse';
					evLoad.user = myName;
					ev.payload = evLoad;
					ev.dispatchWebinosEvent(callback);
					break;

				case 'login':
					if (event.payload.user !== myName){

						if(typeof kidsinfocusUsers[event.payload.user] === 'undefined' || kidsinfocusUsers[event.payload.user] === 'offline'){
							kidsinfocusUsers[event.payload.user] = event.addressing.source;
							if(document.getElementById('liContact' + event.payload.user) == null){
								htmlLoggedinContact=
									'<li id="liContact'+event.payload.user+'"><label id=labelContact'+event.payload.user+'>'
									+ event.payload.user + '</label><a class="button" name="'
									+ event.payload.user + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
									+ event.payload.user + '">Invite</a></li>';
								document.getElementById("onlineContacts").innerHTML += htmlLoggedinContact;
							}
						}
						//if im not invisible i send the event online
						if(!invisible)
						{
							var callback = {};
							var ev = eventAPIToUse.createWebinosEvent('online');
							var evLoad = {};
							evLoad.type = 'online';
							evLoad.user = myName;
							evLoad.status = engaged;
							ev.payload = evLoad;
							ev.dispatchWebinosEvent(callback);
						}
					}
					break;

				case 'online':        			    		//modified the filter for the policy management A. Longo 24.04.12
					if (event.payload.user !== myName &&
							(typeof kidsinfocusUsers[event.payload.user] === 'undefined' || kidsinfocusUsers[event.payload.user] == 'offline')
					){ // Filter
						kidsinfocusUsers[event.payload.user] = event.addressing.source;
						htmlLoggedinContact = '';

						//if the player status is not engaged, i can invite him to play
						if(event.payload.status == 'undefined' || event.payload.status == '')
						{
						htmlLoggedinContact+=
							'<li id="liContact'+event.payload.user+'"><label id=labelContact'+event.payload.user+'>'
							+ event.payload.user + '</label><a class="button" name="'
							+ event.payload.user + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
							+ event.payload.user + '">Invite</a></li>';
						}
						//otherwise the UI shows that the player is currently playing
						else
						{
							htmlLoggedinContact+='<li id="liContact'+event.payload.user+'"><label id=labelContact'+event.payload.user+'>'
							+ event.payload.user + '</label><a class="button red" name="'
							+ event.payload.user + '" id="abuttonContact'
							+ event.payload.user + '">Playing</a></li>';
						}

						document.getElementById("onlineContacts").innerHTML += htmlLoggedinContact;
					}
					break;

				case 'logout':
					kidsinfocusUsers[event.payload.user] = 'offline';

					if (engaged != event.payload.user)
						{
							//remove the player from the online contacts
							licontact = document.getElementById("liContact" + event.payload.user);
							if(licontact != null)
								document.getElementById("onlineContacts").removeChild(document.getElementById("liContact" + event.payload.user));
							//if the player who is logging out, had invited me, i remove the invitation
							lilivecontact = document.getElementById('liInviter'+event.payload.user);
							if(lilivecontact != null)
								document.getElementById("liveInvitations").removeChild(lilivecontact);
						}
					else{
						leftbox = '<p class="header">Your online contacts:</p><ul id="onlineContacts"></ul>';
						rightbox = '<p class="header">Your invitations:</p><ul id="liveInvitations"></ul>';

						for (var i in kidsinfocusUsers)
							if (kidsinfocusUsers[i] !== 'offline')
								leftbox +=  '<li id="liContact'+i+'"><label id=labelContact'+i+'>'
								+ i + '</label><a class="button" name="'
								+ i + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
								+ i + '">Invite</a></li>';
						leftbox += '</ul>';

					}
					break;

				case 'gameClosed':
						if(event.payload.user === engaged)
						{
							switchUICard("1", "b", "");
							switchUICard("2", "b", "");
							document.getElementById("status-text").innerHTML = oName + " closed the game!";

							leftbox = '<p class="header">Your online contacts:</p><ul id="onlineContacts"></ul>';
							rightbox = '<p class="header">Your invitations:</p><ul id="liveInvitations"></ul>';

							kidsinfocusUsers = new Array();
							engaged = '';
							useMyDeck = false;
							oName = "";

							//if i'm not invisible i send the event loging, showing my presence
							if(!invisible)
							{
								var callback = {};
								var ev = eventAPIToUse.createWebinosEvent('login');
								var evLoad = {};
								evLoad.type = 'login';
								evLoad.user = myName;
								ev.payload = evLoad;
								ev.dispatchWebinosEvent(callback);
							}

							//update my status in notPlaying
							var callback2 = {};
							var ev2 = eventAPIToUse.createWebinosEvent('notPlaying');
							var evLoad2 = {};
							evLoad2.type = 'notPlaying';
							evLoad2.user = myName;
							ev2.payload = evLoad2;
							ev2.dispatchWebinosEvent(callback2);

							document.getElementById('leftbox').innerHTML = leftbox;
							document.getElementById('rightbox').innerHTML = rightbox;
							setTimeout("gameClosed()",3000);
						}
					break;

				case 'invite':
					if(event.payload.invitee === myName && document.getElementById('liInviter' + event.payload.inviter) === null)
					{
						htmlInvitation =
							'<li id="liInviter'+event.payload.inviter+'"><label><span>'
							+ event.payload.inviter
							+ '</span> invites you for a game.</label><a class="button" name="'
							+ event.payload.inviter
							+ '" onclick="acceptInvitation(this.name)">Accept</a></li>';
						document.getElementById("liveInvitations").innerHTML += htmlInvitation;
					}
					break;

				case 'cancelInvite':
					if(event.payload.invitee === myName){
						document.getElementById("liveInvitations").removeChild(document.getElementById("liInviter" + event.payload.inviter));
					}
					break;

				case 'acceptInvitation':
					if(event.payload.inviter === myName){

						//changed without using jquery - A. Longo 19.03.12
						document.getElementById("home").style.display = 'none';
						document.getElementById("game").style.display = 'block';
						loadGameUI();
						engaged = event.payload.invitee;

						//update my status in 'playing'
						var callback = {};
						var ev = eventAPIToUse.createWebinosEvent('playing');
						var evLoad = {};
						evLoad.type = 'playing';
						evLoad.user = myName;
						ev.payload = evLoad;
						ev.dispatchWebinosEvent(callback);

						// Enter Stage 3: Start the game.

					}
					break;

				case 'playing':
						if(event.payload.user != myName)
						{
							licontact = document.getElementById("liContact"+event.payload.user);
							if(licontact == null)
							{
								htmlLoggedinContact=
							'<li id="liContact'+event.payload.user+'"><label id=labelContact'+event.payload.user+'>'
								+ event.payload.user + '</label><a class="button red" name="'
								+ event.payload.user + '" id="abuttonContact'
								+ event.payload.user + '">Playing</a></li>';
							document.getElementById("onlineContacts").innerHTML += htmlLoggedinContact;
							}
							else
							{
								licontact.innerHTML = '<label id=labelContact'+event.payload.user+'>'
								+ event.payload.user + '</label><a class="button red" name="'
								+ event.payload.user + '" id="abuttonContact'
								+ event.payload.user + '">Playing</a></li>';
							}
							//if one of the player who changed state in playing, had invited me, i remove the invitation
							liinvite = document.getElementById('liInviter'+event.payload.user);
							if(liinvite != null)
								document.getElementById("liveInvitations").removeChild(liinvite);
						}
						break;
				case 'notPlaying':
						if(event.payload.user != myName)
						{
							licontact = document.getElementById("liContact"+event.payload.user);
							if(licontact != 'undefined')
							{
								licontact.innerHTML = '<label id=labelContact'+event.payload.user+'>'
								+ event.payload.user + '</label><a class="button" name="'
								+ event.payload.user + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
								+ event.payload.user + '">Invite</a></li>';
							}
						}
						break;

				case 'sendDeckData':

					if(event.payload.receiver === myName)
					{
						cardData = eval(event.payload.data);
						init();
					}
					break;
				case 'setCardsClassName':

					if(event.payload.receiver === myName)
					{
						setCardsClassName(event.payload.data);
					}
					break;
				case 'myCards':
					if(event.payload.receiver === myName)
					{
						gamet.myCards = event.payload.data;
					}
					break;
				case 'nextTurn':
					if(event.payload.receiver === myName)
					{
						if(event.payload.data != null)
						{
							//I moved status div to game.html - kwlodarska 14.03.2012 i.e. webinos_trumps.html Wei Guo 06-12-2012
							gamet.started = true;
							document.getElementById("cont-button").innerHTML = '<a id="continue" class="button" onClick="cont();">Continue</a>';
							gamet.currentTurn = event.payload.data;
							var newElem = document.getElementById("newElem");
							var newButton = document.getElementById("newButton");
							newElem.className = "button2";
							newButton.setAttribute('onClick', 'newGame(); return false;');

							var endElem = document.getElementById("endElem");
							endElem.className = "button2";
						}
						nextTurn();
					}
					break;
				case 'attrChosen':
					if(event.payload.receiver === myName)
					{
						var turn = gamet.currentTurn;
						evaluateAttr(event.payload.data);
						if(!turn)
						{
							event.payload.data.card = gamet.myCurrentCard;
							sendMsg('attrChosen', event.payload.data);
						}
					}
					break;
				case 'chat':
					if(event.payload.receiver === myName)
					{
						document.getElementById('chatBox').innerHTML += '<p class="opponentLine"><span style="font-size:'+opponentSettings.size+';color:'+opponentSettings.color+'">'+event.payload.sender+': </span><span style="font-family:'+opponentSettings.family+';font-size:'+opponentSettings.size+';color:'+opponentSettings.color+'">' + event.payload.data + '</span></p>';

						var objDiv = document.getElementById("chatBox");
						objDiv.scrollTop = objDiv.scrollHeight;

						//indicates incoming chate messages
						if(document.getElementById('chat').style.display == "none" || document.getElementById('chat').style.display == "")
								document.getElementById('textButton').style.border = "3px solid red";
					}
					break;
				case 'newGame':
					if(event.payload.receiver === myName)
					{
						document.getElementById("cont-button").innerHTML = '';
						document.getElementById("status-text").style.color = '#000000';
						gamet.newGameProposal = true;
						status = event.payload.sender+' wants to start a New Game';
						// ok/cancel buttons moved to 'cont-button' div - kwlodarska 26.03
		                document.getElementById("status-text").innerHTML = status;
		                document.getElementById("cont-button").innerHTML = '<a class="button" onClick="newGameAccepted(false);">OK</a><a class="button red" onClick="newGameRefused();">Cancel</a>';
					}
					break;
				case 'newGameAccepted':
					if(event.payload.receiver === myName)
					{
						newGameAccepted(true);
					}
					break;
				case 'newGameRefused':
					if(event.payload.receiver === myName)
					{
						gamet.newGameProposal = false;
						updateUI();
						document.getElementById("status-text").innerHTML += event.payload.sender+ " refused to start a new game!";
					}
					//continue button restored - kwlodarska 26.03
					if(gamet.currentTurn)
						document.getElementById("cont-button").innerHTML = '<a id="continue" class="button" onClick="cont();">Continue</a>';
					else
						document.getElementById("cont-button").innerHTML = '';
					break;
				} // End of swtich(event.payload.type)
			});

			// commented out by Polito
			/*function getURLParameter(name) {
				return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
			}
			myName = getURLParameter("user");*/
			if(!invisible)
			{
				var callback = {};
				var ev = eventAPIToUse.createWebinosEvent('login');
				var evLoad = {};
				evLoad.type = 'login';
				evLoad.user = myName;
				ev.payload = evLoad;
				ev.dispatchWebinosEvent(callback);
			}

		};
//	});
//});

var kidsinfocusUsers = new Array();
var engaged = '';
var useMyDeck = false;
var oName = "";

window.onbeforeunload = function(){
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent('logout');
   	var evClose = {};
   	evClose.type = 'logout';
   	evClose.user = myName;
   	ev.payload = evClose;
   	ev.dispatchWebinosEvent(callback);

   	var callback2 = {};
   	var ev2 = eventAPIToUse.createWebinosEvent('gameClosed');
   	var evClose2 = {};
   	evClose2.type = 'gameClosed';
   	evClose2.user = myName;
   	ev2.payload = evClose2;
   	ev2.dispatchWebinosEvent(callback2);
};

// Called when the "Cancel" button is clicked on.
function cancelInvitation(invitee){

	//modified for a correct policy management handling A. Longo 23/04/12

   /*leftbox = '<p class="header">Your online contacts:</p><ul id="onlineContacts">';
   rightbox = '<p class="header">Your invitations:</p><ul id="liveInvitations"></ul>';

   for (var i in kidsinfocusUsers)
      if (kidsinfocusUsers[i] !== 'offline')
         leftbox +=  '<li id="liContact'+i+'"><label id=labelContact'+i+'>'
               + i + '</label><a class="button" name="'
               + i + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
               + i + '">Invite</a></li>';
   leftbox += '</ul>';
   document.getElementById('leftbox').innerHTML = leftbox;
   document.getElementById('rightbox').innerHTML = rightbox;*/

   licontact = document.getElementById("liContact"+invitee);
	if(licontact != 'undefined')
	{
		licontact.innerHTML = '<label id=labelContact'+invitee+'>'
		+ invitee + '</label><a class="button" name="'
		+ invitee + '" onclick="onclickContactAction(this.name);" id="abuttonContact'
		+ invitee + '">Invite</a></li>';
	}


    // Send the cancel invitation event.
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	var evCancelInvite = {};
   	evCancelInvite.type = 'cancelInvite';
   	evCancelInvite.inviter = myName;
   	evCancelInvite.invitee = invitee;
   	ev.payload = evCancelInvite;
   	ev.dispatchWebinosEvent(callback);

	myDeck=false;
	oName="";
}

// The button click event handler.
function onclickContactAction(contactName) {
	// Invite and go to Stage 2, waiting for response from invitee.

	//modified for a correct policy management handling A. Longo 23/04/12

     /* document.getElementById('leftbox').innerHTML = '<p class="header">Your online contacts:</p><ul id="onlineContacts">'
         + '<li><label>Inviting <span>'
         + contactName + '</span>...  Waiting for response...</label><a class="button red" name="'
         + contactName + '" onclick="cancelInvitation(this.name);">Cancel</a></li></ul>';*/

    licontact = document.getElementById("liContact"+contactName);
	licontact.innerHTML = '<label id=labelContact'+contactName+'>Inviting <span>'+contactName+'</span>...Waiting for response...</label><a class="button red" name="'	+ contactName + '" id="abuttonContact'	+ contactName + '" onclick="cancelInvitation(this.name);">Cancel</a></li>';

    // Send the invitation event.
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	var evInvite = {};
   	evInvite.type = 'invite';
   	evInvite.inviter = myName;
   	evInvite.invitee = contactName;
   	ev.payload = evInvite;
   	ev.dispatchWebinosEvent(callback);

	useMyDeck = true;
	oName = contactName;
}

//Called when the "Accept" button is clicked on.
function acceptInvitation(inviter){
    // Enter Stage 3: Start the game.

   //changed without using jquery - A. Longo 19.03.12
   document.getElementById("home").style.display = 'none';
   document.getElementById("game").style.display = 'block';

   loadGameUI();

    engaged = inviter;

    // Send the invitation event.
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	var evAcceptInvitation = {};
   	evAcceptInvitation.type = 'acceptInvitation';
   	evAcceptInvitation.inviter = inviter;
   	evAcceptInvitation.invitee = myName;
   	ev.payload = evAcceptInvitation;
   	ev.dispatchWebinosEvent(callback);

   	// Send the playing event
   	var callback = {};
	var ev = eventAPIToUse.createWebinosEvent('playing');
	var evLoad = {};
	evLoad.type = 'playing';
	evLoad.user = myName;
	ev.payload = evLoad;
	ev.dispatchWebinosEvent(callback);

	useMyDeck=false;
	oName = inviter;
};

//Andrea's module starts here

function hasClass(ele,cls) {
  return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
};

function addClass(ele,cls) {
if(ele != null)
  if (!hasClass(ele,cls)) ele.className += " "+cls;
};

function removeClass(ele,cls) {
if(ele != null)
  if (hasClass(ele,cls)) {
      var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      ele.className=ele.className.replace(reg,' ');
  }
};


//generic function which generates an event
function sendMsg(msgType, msgData)
{
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	var evSendMsg = {};
   	evSendMsg.type = msgType;
   	evSendMsg.sender = myName;
   	evSendMsg.receiver = oName;
   	evSendMsg.data = msgData;
   	ev.payload = evSendMsg;
   	ev.dispatchWebinosEvent(callback);
};

//GAME UI
function loadGameUI(){
	var ajaxRequest;
	try{ ajaxRequest = new XMLHttpRequest(); }
	catch (e){
		alert("Excepiton: " + e);
		return false;
	}

	ajaxRequest.onreadystatechange = function(){
		if(ajaxRequest.readyState == 4){
			var ajaxDisplay = document.getElementById('game');
			ajaxDisplay.innerHTML = ajaxRequest.responseText;

			document.getElementById("myN").innerHTML = myName;
			document.getElementById("opponentN").innerHTML = oName;
			document.getElementById("chatText").innerHTML = '<input type="text" id="chatTx" onkeypress="{if (event.keyCode==13) sendChat()}">';
			//document.getElementById("chatBox").innerHTML = '<input type="text" id="chatBx" height="200">';
			document.getElementById("chatButton").innerHTML = '<a class="button" onclick="sendChat();">Send</a>';

         //buttons below should be greyed(look like disabled) only when lock feature is active - kwlodarska 23.04
			//var newElem = document.getElementById("newElem");
   		//	newElem.className = 'disabled';
   		//	var endElem = document.getElementById("endElem");
   		//	endElem.className = 'disabled';


   			//initialize chat settings
   			document.getElementById("chatTx").style.color = "black";
   			document.getElementById("chatTx").style.fontFamily = "sans-serif";
   			document.getElementById("chatTx").style.fontSize = "100%";
   			opponentSettings.color = "black";
   			opponentSettings.family = "sans-serif";
   			opponentSettings.size = "100%";

			if(useMyDeck)
			{
				choseDeck();
			}
			else
				document.getElementById("status-text").innerHTML = "Waiting for the dealer...";
			}
	}
	ajaxRequest.open("GET", "webinos_trumps.html", true);
	ajaxRequest.send(null);
};

function choseDeck(){
	var ajaxRequest;
	try{ ajaxRequest = new XMLHttpRequest(); }
	catch (e){
		alert("Excepiton: " + e);
		return false;
	}

	ajaxRequest.onreadystatechange = function(){
		if(ajaxRequest.readyState == 4){
			decks = eval(ajaxRequest.responseText);
			var html ='';
			for(i = 0; i < decks.length; i++)
			{
				html += '<div class="picture button2" onclick="loadDeck('+i+');">'
				html += '<p>'+decks[i].name+'</p><p>Cards: '+decks[i].NumberOfCards+'</p>';
				html += '</div>'
			}
			//html += '</div>';
			document.getElementById("deck-box").style.display = 'block';
         document.getElementById("play-box").style.display = 'none';
			//document.getElementById("status-text").innerHTML = "Chose the deck:";
			document.getElementById("deck-box").innerHTML = html;
		}
	}
	ajaxRequest.open("GET", "webinos_trumps_decks.js", true);
	ajaxRequest.send(null);
};

function loadDeck(i)
{
	var ajaxRequest;

	try{ ajaxRequest = new XMLHttpRequest(); }
	catch (e){
		alert("Excepiton: " + e);
		return false;
	}

	document.getElementById("deck-box").style.display = 'none';
    document.getElementById("play-box").style.display = 'block';

	ajaxRequest.onreadystatechange = function(){
		if(ajaxRequest.readyState == 4){
			cardData = eval(ajaxRequest.responseText);
			sendMsg('sendDeckData', ajaxRequest.responseText);
			sendMsg('setCardsClassName', decks[i].className);
			setCardsClassName(decks[i].className);
			init();
		}
	};
	ajaxRequest.open("GET", "webinos_trumps_decks/"+decks[i].url , true);
	ajaxRequest.send(null);
	document.getElementById("status-text").innerHTML = 'Click start to Play';
	document.getElementById("cont-button").innerHTML ='<a href="#" id="play" class="button" onClick="play();">Start</a>';
	deckIndex = i;
};

var setCardsClassName = function(className) {
	document.getElementById('card1').className = "card-front "+className;
	document.getElementById('card2').className = "card-front "+className;
	document.getElementById('card1b').className = "card-back "+className;
	document.getElementById('card2b').className = "card-back "+className;
}

function initializeAttributes(data)
{
	var attributes = new Array();
	var cardHTML = '';
	var skip=0;
  	var count=1;
	for (i in data[0])
	   {
	      if(skip < 3)
	      {
			 skip++;
			 continue;
	      }
	      attributes.push(i);
	      cardHTML = document.getElementById('card1').innerHTML;
	      cardHTML += "<div class='line' id='c1attr"+count+"' onClick='lineChosen("+count+");mark(this.id);'><span id='ac1"+count+"n'>"+i+"</span><span id='ac1"+count+"v'></span></div>";
	      document.getElementById('card1').innerHTML = cardHTML;
	      cardHTML = document.getElementById('card2').innerHTML;
	      cardHTML += "<div id='c2attr"+count+"' onClick='lineChosen("+count+");mark(this.id);'><span id='ac2"+count+"n'>"+i+"</span><span id='ac2"+count+"v'></span></div>";
	      document.getElementById('card2').innerHTML = cardHTML;
	      count++;
	   }
	return attributes;
};


//sends chat message
function sendChat()
{
	var msgDiv = document.getElementById('chatTx');
	var msg = msgDiv.value;
	if(msg!='') {
		msgDiv.value = "";
		sendMsg('chat', msg);
		var objDiv = document.getElementById("chatBox");
		objDiv.innerHTML += '<p><span style="font-size:'+msgDiv.style.fontSize+';color:'+msgDiv.style.color+'">Me: </span><span style="font-family:'+msgDiv.style.fontFamily+';font-size:'+msgDiv.style.fontSize+';color:'+msgDiv.style.color+'">' + msg + '</span></p>';
		objDiv.scrollTop = objDiv.scrollHeight;
	}
};

function confirmExitGame()
{
	document.getElementById("cont-button").innerHTML = '';
	document.getElementById("status-text").style.color = '#000000';
	status = 'Are you sure you want to exit?';
    document.getElementById("status-text").innerHTML = status;
    document.getElementById("cont-button").innerHTML = '<a class="button" onClick="exitGame();">OK</a><a class="button red" onClick="cancelExitGame();">Cancel</a>';
};

function cancelExitGame()
{
		document.getElementById("cont-button").innerHTML = '';
		if(useMyDeck)
		{
			 document.getElementById("status-text").innerHTML = 'Click Start to Play';
			 document.getElementById("cont-button").innerHTML ='<a href="#" id="play" class="button" onClick="play();">Start</a>';
		}
		else
			 document.getElementById("status-text").innerHTML = 'Waiting for the dealer...';
		if(gamet != 'undefined' && gamet != null && gamet.started)
		{
			updateUI();
			if(gamet.currentTurn)
				document.getElementById("cont-button").innerHTML = '<a id="continue" class="button" onClick="cont();">Continue</a>';
			else
				document.getElementById("cont-button").innerHTML = '';
		}
};

function exitGame()
{
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent('gameClosed');
   	var evClose = {};
   	evClose.type = 'gameClosed';
   	evClose.user = myName;
   	ev.payload = evClose;
   	ev.dispatchWebinosEvent(callback);

   	var callback2 = {};
	var ev2 = eventAPIToUse.createWebinosEvent('notPlaying');
	var evLoad2 = {};
	evLoad2.type = 'notPlaying';
	evLoad2.user = myName;
	ev2.payload = evLoad2;
	ev2.dispatchWebinosEvent(callback2);

	// modified by Polito
	// in order to not exit from the app but just from the game

	//location.reload();

	// vars inizialization
	kidsinfocusUsers = new Array();
	engaged = '';
	useMyDeck = false;
	oName = "";

	// display empty page
	leftbox = '<p class="header">Your online contacts:</p><ul id="onlineContacts"></ul>';
	rightbox = '<p class="header">Your invitations:</p><ul id="liveInvitations"></ul>';
	document.getElementById('leftbox').innerHTML = leftbox;
	document.getElementById('rightbox').innerHTML = rightbox;
	gameClosed();

	//if i'm not invisible i send the event login, showing my presence
	if(!invisible)
	{
		callback = {};
		ev = eventAPIToUse.createWebinosEvent('login');
		evLoad = {};
		evLoad.type = 'login';
		evLoad.user = myName;
		ev.payload = evLoad;
		ev.dispatchWebinosEvent(callback);
	}

	// end of Polito modifications
};

//get the index to set the current color settings in the dropdown list
function getColorIndex ( obj )
{
var sc;
switch(obj)
	{
		case 'black':	 sc = 0;
						break;
		case 'red':		 sc = 1;
						break;
		case 'green': 	 sc = 2;
						break;
		case 'blue': 	 sc = 3;
						break;
	}
	return sc;

};

//get the index to set the current font family settings in the dropdown list
function getFamilyIndex ( obj )
{
var sf;

	switch(obj)
	{
		case 'Standard':sf = 0;
						break;
		case 'ANaRcHy':	sf = 1;
						break;
	}
	return sf;
};

//get the index to set the current font size settings in the dropdown list
function getSizeIndex ( obj )
{
var ss;

	switch(obj)
	{
		case '100%':	ss = 0;
						break;
		case '120%':	ss = 1;
						break;
		case '150%': 	ss = 2;
						break;
	}
	return ss;
};

//loads the settings UI
function settings()
{
	sett = '';
   sett += '<div class="box"><div class="group"><p class="header">Chat Settings:</p><p class="options">Font Color: ';
	sett += '<select id="mcolor" name="color"><option value="black">Black</option><option value="red">Red</option><option value="green">Green</option><option value="blue">Blue</option></select></p>';
   sett += '<p class="options">Font Style: ';
	sett += '<select id="mfamily" name="style"><option value="sans-serif">Dafault</option><option value="ANaRcHy">ANaRcHy</option></select></p>';
   sett += '<p class="options">Font Size: ';
	sett += '<select id="msize" name="size"><option value="100%">100%</option><option value="120%">120%</option><option value="150%">150%</option></select></p></div>';
	sett += '<div class="group"><p class="header">Opponent Chat:</p><p class="options">Font Color: ';
	sett += '<select id="ocolor" name="color"><option value="black">Black</option><option value="red">Red</option><option value="green">Green</option><option value="blue">Blue</option></select></p>';
   sett += '<p class="options">Font Style: ';
	sett += '<select id="ofamily" name="style"><option value="sans-serif">Dafault</option><option value="ANaRcHy">ANaRcHy</option></select></p>';
   sett += '<p class="options">Font Size: ';
	sett += '<select id="osize" name="size"><option value="100%">100%</option><option value="120%">120%</option><option value="150%">150%</option></select></p></div>';

   sett += '<div class="group"><p class="header">Policy Settings: </p><p class="options">Status: ';
   sett += '<select id="mstatus" name="status"><option value="available">Available</option><option value="offline">Invisible</option></select></p></div>';
   sett += '<div class="group"><a class="button red" onclick="cancelSettings();">Cancel</a>';
   sett += '<a class="button" onclick="saveSettings();">Save</a></div></div>';

	document.getElementById("sett").innerHTML = sett;

	//load previous settings in the dropdown lists
	document.getElementById("mcolor").selectedIndex = getColorIndex(document.getElementById("chatTx").style.color);
	document.getElementById("mfamily").selectedIndex = getFamilyIndex(document.getElementById("chatTx").style.fontFamily);
	document.getElementById("msize").selectedIndex = getSizeIndex(document.getElementById("chatTx").style.fontSize);
	document.getElementById("ocolor").selectedIndex = getColorIndex(opponentSettings.color);
	document.getElementById("ofamily").selectedIndex = getFamilyIndex(opponentSettings.family);
	document.getElementById("osize").selectedIndex = getSizeIndex(opponentSettings.size);
	if(invisible)
		document.getElementById("mstatus").selectedIndex = 1;

	document.getElementById("sett").style.display = 'block';
	document.getElementById("game").style.display = 'none';
};

function saveSettings()
{
	mfc = document.getElementById("mcolor");
	document.getElementById("chatTx").style.color = mfc.options[mfc.selectedIndex].value;
	mff = document.getElementById("mfamily");
	document.getElementById("chatTx").style.fontFamily = mff.options[mff.selectedIndex].value;
	mfs = document.getElementById("msize");
	document.getElementById("chatTx").style.fontSize = mfs.options[mfs.selectedIndex].value;

	ofc = document.getElementById("ocolor");
	opponentSettings.color = ofc.options[ofc.selectedIndex].value;
	off = document.getElementById("ofamily");
	opponentSettings.family = off.options[off.selectedIndex].value;
	ofs = document.getElementById("osize");
	opponentSettings.size = ofs.options[ofs.selectedIndex].value;

	mst = document.getElementById("mstatus");
	kidsinfocusUsers[myName] = mst.options[mst.selectedIndex].value;

	if(kidsinfocusUsers[myName] == 'offline')
	{
		invisible = true;
		var callback = {};
		var ev = eventAPIToUse.createWebinosEvent('logout');
		var evLoad = {};
		evLoad.type = 'logout';
		evLoad.user = myName;
		evLoad.status = engaged;
		ev.payload = evLoad;
		ev.dispatchWebinosEvent(callback);
	}
	else
	{
		invisible = false;
		var callback = {};
		var ev = eventAPIToUse.createWebinosEvent('online');
		var evLoad = {};
		evLoad.type = 'online';
		evLoad.status = engaged;
		evLoad.user = myName;
		ev.payload = evLoad;
		ev.dispatchWebinosEvent(callback);
	}

	document.getElementById("sett").innerHTML = '';
	document.getElementById("game").style.display = 'block';
	document.getElementById("sett").style.display = 'none';

	//scroll down the chat box
	var objDiv = document.getElementById("chatBox");
	objDiv.scrollTop = objDiv.scrollHeight;
};

function cancelSettings()
{
	document.getElementById("sett").innerHTML = '';
	document.getElementById("game").style.display = 'block';
	document.getElementById("sett").style.display = 'none';

	//scroll down the chat box
	var objDiv = document.getElementById("chatBox");
	objDiv.scrollTop = objDiv.scrollHeight;
};

function gameClosed()
{
	document.getElementById("home").style.display = 'block';
	document.getElementById("game").style.display = 'none';
};

function anotherGame()
{
	if(useMyDeck)
	{
   document.getElementById("status-text").innerHTML = 'New Game?';
   document.getElementById("status-text").removeAttribute('class');
   document.getElementById("cont-button").innerHTML = '<a class="button" onClick="newGameAccepted(false);">Yes</a><a class="button red" onClick="exitGame();">No</a>';
	}
	else
		document.getElementById("status-text").innerHTML = 'Waiting for the dealer...';
};

/**
 *	Proposes to start a new game
 */

function newGame(){
	if(gamet.inputEnable)
	{
		document.getElementById("cont-button").innerHTML = '';
		document.getElementById("status-text").innerHTML = "Waiting for an answer...";
		gamet.newGameProposal = true;
		sendMsg('newGame', null);
	}
	else
		document.getElementById("status-text").innerHTML = "Not Allowed!";
};

var decks;
var cardData;
var opponentSettings = {};
var invisible = false;
// Andrea's module ends here

// End of file.
