/******************************************************************************
* Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2012-2013
*   Antenna Software,
*   Samsung R&D Institute UK,
*   University of Catania
*******************************************************************************
* app-kids-in-focus/kif.js
*
* The app Kids in Focus WRT side.
*
* Authors:
*   Katarzyna Włodarska,
*   Michał T. Kozak,
*   Wei Guo,
*   Andrea Longo,
*   Alexander Futasz
*
* Last update: 29-01-2013
******************************************************************************/

/* GLOBALS */


var kif = {}; //this will hold other variables to avoid global namespace pollution
var kifElements = {}; //this will hold html elements so we can avoid excessive DOM search

// Set initial values
kif.users = [];
kif.useMyDeck = false;

kif.settings = {};
kif.settings.predefined = {
   color: "black",
   fontFamily: "sans-serif",
   fontSize: "100%"
};
kif.settings.opponent = {};
kif.settings.mine = {};
//we can't copy the whole object, because they would be tied together;
//possible TODO: add object cloning function (but right now this is enough)
kif.settings.opponent.color = kif.settings.mine.color = kif.settings.predefined.color;
kif.settings.opponent.fontFamily = kif.settings.mine.fontFamily = kif.settings.predefined.fontFamily;
kif.settings.opponent.fontSize = kif.settings.mine.fontSize = kif.settings.predefined.fontSize;

kif.invisible = false;

var eventAPIToUse = null;

/* GENERAL USE functions */

//TODO: I would opt for using indexOf instead of RegExp's
function hasClass(ele,cls) {
   return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
};

function addClass(ele,cls) {
   if(ele != null) {
      if (!hasClass(ele,cls)) ele.className += " "+cls;
   }
};

function removeClass(ele,cls) {
   if(ele != null) {
      if (hasClass(ele,cls)) {
         var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
         ele.className=ele.className.replace(reg,' ');
      }
   }
};


/* functions creating and dispatching WEBINOS EVENTS */


function sendStatus(type, engaged) {
   var callback = {};
   var ev = eventAPIToUse.createWebinosEvent(type);
   ev.payload = {
      type: type,
      user: kif.myName
   };
   if(engaged) ev.payload.status = kif.engaged;
   ev.dispatchWebinosEvent(callback);
};

function sendMsg(msgType, msgData) {
   var callback = {};
      var ev = eventAPIToUse.createWebinosEvent();
      ev.payload = {
      type: msgType,
      sender: kif.myName,
      receiver: kif.oName,
      data: msgData
   };
      ev.dispatchWebinosEvent(callback);
};

function sendInvitation(type, inviter, invitee) {
   var callback = {};
      var ev = eventAPIToUse.createWebinosEvent();
      ev.payload = {
      type: type,
      inviter: inviter,
      invitee: invitee
   };
      ev.dispatchWebinosEvent(callback);
}


/* Equivalent to jquery's ready()
 * Notifies listeners when the DOM finished parsing (while images and css may still load) */


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
   };

   if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", loaded, false);

      // A fallback to window.onload, that will always work
      window.addEventListener("load", loaded, false);
   };

   // Call this to register your DOM ready listener function
   ready = function (listener) {
      readyListener.push(listener);
   };
})();


// function added by Polito
// this is a workaround. In the future, in multi-PZH scenarios, the plan is to
// obtain the userID from the platform. However, the option to change the
// userID obtained could be kept, keeping the following mechanism as well.
ready(function () {
    var findHandle = webinos.ServiceDiscovery.findServices(
            {api: 'http://webinos.org/api/events'},
            {
                onFound: onEventsApiFound,
                onError: function (error) {
                    // error is the DOMError.
                    switch (error.name) {
                    case 'TimeoutError':
                        alert('Events API not found. Kids in Focus cannot run without Events API.');
                        break;
                    case 'SecurityError':
                        console.log('Received SecurityError. Discovery probably is denied by remote.');
                        break;
                    case 'AbortError':
                        console.log('Received AbortError. Discovery probably is cancelled.');
                        break;
                    default:
                        console.warn('Unknown WP DOMError returned by finding services Events API.');
                    }
                },
                onLost: function () {
                    // TODO Implement it when WP implements this.
                }
            },
            {timeout: 5000} // In millisecond.
    );

    function onEventsApiFound(eventsApiService) {
        if (typeof findHandle !== 'undefined' && findHandle != null) {
            // Abort the asynchronous discovery. Only choose the first returned
            // Events API.
            findHandle.cancel();
            findHandle = undefined;

            eventAPIToUse = eventsApiService;
            kif.unavailableNames = [];
            kif.myName = webinos.messageHandler.ownSessionId;

            var listenerID = eventAPIToUse.addWebinosEventListener(function (event) {
                if (event.payload.type === 'nameResponse') {
                    kif.unavailableNames.push(event.payload.user);
                }
            });
            sendStatus('nameQuery');
            setTimeout(function(){nameInput(listenerID);}, 1000);
            // TODO check why there's a timeout here
        } else {
            console.log('Received Events API service for an invalid discovery. Ignored.');
        }
    }

   //rip out of dom elements, that we will frequently use later
   kifElements.status = document.getElementById("status-text");
   kifElements.contButton = document.getElementById("cont-button");
   kifElements.onlineContacts = document.getElementById("onlineContacts");
   kifElements.liveInvitations = document.getElementById("liveInvitations");

   kifElements.home = document.getElementById("home");
   kifElements.game = document.getElementById("game");
   kifElements.settings = document.getElementById("sett");
   kifElements.password = document.getElementById("password");

   kifElements.homeScreenName = document.getElementById("myName2");

   kifElements.newElem = document.getElementById("newElem");
   kifElements.newButton = document.getElementById("newButton");
   kifElements.endElem = document.getElementById("endElem");
   kifElements.endButton = document.getElementById("endButton");
   kifElements.lockButton = document.getElementById("lockButton");
   kifElements.setButton = document.getElementById("setButton");

   kifElements.opacityBack = document.getElementById("opacityBack");
   kifElements.popup = document.getElementById("popup");

   kifElements.myName = document.getElementById("myName");
   kifElements.opponentName = document.getElementById("opponentName");
   kifElements.chat = document.getElementById("chat");
   kifElements.chatBox = document.getElementById("chatBox");
   kifElements.chatText = document.getElementById("chatText");
   kifElements.chatButton = document.getElementById("chatButton");
   kifElements.chatInput = document.getElementById("chatInput");
   kifElements.textButton = document.getElementById("textButton");

   kifElements.card1 = document.getElementById('card1');
   kifElements.card2 = document.getElementById('card2');
   kifElements.card1back = document.getElementById('card1b');
   kifElements.card2back = document.getElementById('card2b');
   kifElements.card1attributes = document.getElementById('cardAttributes1');
   kifElements.card2attributes = document.getElementById('cardAttributes2');
   kifElements.cardContainer2 = document.getElementById('cardcontainer2');
   kifElements.myCardsNo = document.getElementById("myCardsNo");
   kifElements.opCardsNo = document.getElementById("opCardsNo");

   //set initial onclick actions
   kifElements.textButton.onclick = function() {showTextChat();};
   kifElements.endButton.onclick = function() {confirmExitGame();};
   kifElements.setButton.onclick = function() {setSettings();};
   kifElements.lockButton.onclick = function() {lockGame();};
   kifElements.newButton.onclick = function() {newGame();};
   kifElements.chatButton.onclick = function() {sendChat();};

   kifElements.chatInput.onkeypress = function() {if (event.keyCode==13) sendChat();};

   document.getElementById("cancelsettings").onclick = function() {cancelSettings();};
   document.getElementById("savesettings").onclick = function() {saveSettings();};
   document.getElementById("popunlock").onclick = function() {unlockGame(); return false;};
   document.getElementById("popcancel").onclick = function() {closePopup(); return false;};
});


window.onbeforeunload = function(){ //that's probably unreliable
      sendStatus('logout');
      sendStatus('gameClosed');
};


function nameInput(listenerID) {
   kif.myName = prompt("please, insert your name");

   while (kif.myName === '' || kif.unavailableNames.indexOf(kif.myName) !== -1) {
      kif.myName = prompt("please insert a different name");
   }

   eventAPIToUse.removeWebinosEventListener(listenerID);

   if (kif.myName !== null && kif.myName !== undefined && kif.myName !== '') {
      start();
      setScreenName();
   } else {
      alert('username is missing');
   }
}

// function modified by Polito
// this is the former ready function, renamed to start and called from the current ready function
var start = function() {

   eventAPIToUse.addWebinosEventListener(function(event){
      //debug
      /*for(var i in kif.users) {
         console.log(kif.users[i]);
      }*/

      switch(event.payload.type){
      // event added by Polito
      case 'nameQuery':
         sendStatus('nameResponse');
         break;

      case 'login':
         if (event.payload.user !== kif.myName){
            if(typeof kif.users[event.payload.user] === 'undefined' || kif.users[event.payload.user] === 'offline'){
               kif.users[event.payload.user] = event.addressing.source;
               if(userNotListed(event.payload.user)){
                  addContact(event.payload.user);
               }
            }
            //if im not invisible i send the event online
            if(!kif.invisible) {
               sendStatus('online', true);
            }
         }
         break;

      case 'online': //modified the filter for the policy management A. Longo 24.04.12
         if (event.payload.user !== kif.myName &&
               (typeof kif.users[event.payload.user] === 'undefined' || kif.users[event.payload.user] == 'offline')
         ){ // Filter
            kif.users[event.payload.user] = event.addressing.source;

            //if the player status is not kif.engaged, i can invite him to play
            if(typeof event.payload.status == 'undefined' || event.payload.status == '') {
               addContact(event.payload.user);
            } else { //otherwise the UI shows that the player is currently playing
               addContact(event.payload.user);
               setContactPlaying(event.payload.user);
            }
         }
         break;

      case 'logout':
         kif.users[event.payload.user] = 'offline';

         if (kif.engaged != event.payload.user) {
            removeContact(event.payload.user);
         } else {
            //TODO check why it's like that, with a loop, instead of a remove
            kifElements.onlineContacts.innerHTML = '';
            for (var user in kif.users) {
               if (kif.users[user] !== 'offline') {
                  addContact(user);
               }
            }
         }
         break;

      case 'gameClosed':
            if(event.payload.user === kif.engaged) {
               setStatusMessage(kif.oName + " closed the game!");

               resetApp();

               //if i'm not invisible i send the event loging, showing my presence
               if(!kif.invisible) {
                  sendStatus('login');
               }

               sendStatus('notPlaying');

               setTimeout(gameClosed,3000); //TODO why the timeout
            }
         break;

      case 'invite':
         if(event.payload.invitee === kif.myName && !invitationExists(user)) {
            addInvitation(event.payload.inviter);
         }
         break;

      case 'cancelInvite':
         if(event.payload.invitee === kif.myName) {
            removeInvitation(event.payload.inviter);
         }
         break;

      case 'acceptInvitation':
         if(event.payload.inviter === kif.myName) {
            kif.engaged = event.payload.invitee;

            setGameUI();
            showGame();

            sendStatus('playing');
            // Enter Stage 3: Start the game.
         }
         break;

      case 'playing':
         if(event.payload.user != kif.myName) {
            if (userNotListed(event.payload.user)) {
               addContact(event.payload.user);
               setContactPlaying(event.payload.user);
            } else {
               setContactPlaying(event.payload.user);
            }

            //if one of the player who changed state in playing, had invited me, i remove the invitation
            removeInvitation(event.payload.user);
         }
         break;

      case 'notPlaying':
         if(event.payload.user != kif.myName) {
            if (!userNotListed(event.payload.user)) {
               resetContact(event.payload.user);
            }
         }
         break;

      case 'sendDeckData':
         if(event.payload.receiver === kif.myName) {
            kif.cardData = JSON.parse(event.payload.data);
            gameInit();
         }
         break;

      case 'setCardsClassName':
         if(event.payload.receiver === kif.myName) {
            setCardsClassName(event.payload.data);
         }
         break;

      case 'myCards':
         if(event.payload.receiver === kif.myName) {
            gamet.myCards = event.payload.data;
         }
         break;

      case 'nextTurn':
         if(event.payload.receiver === kif.myName) {
            if(event.payload.data != null) {
               gamet.started = true;
               setContButton('continue');
               gamet.currentTurn = event.payload.data;
               kifElements.newElem.className = "button2"; //TODO?
               kifElements.endElem.className = "button2";
               kifElements.newButton.onclick = function() {newGame(); return false;};
            }
            nextTurn();
         }
         break;

      case 'attrChosen':
         if(event.payload.receiver === kif.myName) {
            var turn = gamet.currentTurn;
            evaluateAttr(event.payload.data);
            if(!turn) {
               event.payload.data.card = gamet.myCurrentCard;
               sendMsg('attrChosen', event.payload.data);
            }
         }
         break;

      case 'chat':
         if(event.payload.receiver === kif.myName) {
            pasteChatMsg(event.payload.sender, event.payload.data);
            scrollDownChatBox();

            //indicates incoming chat messages
            if(kifElements.chat.style.display == "none" || kifElements.chat.style.display == "") { //TODO?
               kifElements.textButton.style.border = "3px solid red";
            }
         }
         break;

      case 'newGame':
         if(event.payload.receiver === kif.myName) {
            setStatusMessage(event.payload.sender+' wants to start a New Game', 'black');
            setContButton('newgame');
            gamet.newGameProposal = true;
         }
         break;

      case 'newGameAccepted':
         if(event.payload.receiver === kif.myName) {
            newGameAccepted(true);
         }
         break;

      case 'newGameRefused':
         if(event.payload.receiver === kif.myName) {
            gamet.newGameProposal = false;
            updateUI();
            appendStatusMessage(event.payload.sender+ " refused to start a new game!");
         }
         if(gamet.currentTurn) {
            setContButton('continue');
         } else {
            setContButton('empty');
         }
         break;
      } // End of switch(event.payload.type)
   });

   // commented out by Polito
   /*function getURLParameter(name) {
      return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
   }
   kif.myName = getURLParameter("user");*/
   if(!kif.invisible) {
      sendStatus('login');
   }
};


/* HTML-related functions */


function setScreenName() {
   kifElements.homeScreenName.innerHTML = "Your screen name: <b>"+kif.myName+"</b>";
}

//2 "screens" per function should be sufficient, but more could be added
function showHome() {
   kifElements.home.style.display = 'block';
   kifElements.game.style.display = 'none';

   kifElements.homeScreenName.style.display = 'block';
}
function showGame() {
   kifElements.home.style.display = 'none';
   kifElements.game.style.display = 'block';

   kifElements.homeScreenName.style.display = 'none';
}

function showSettings() {
   kifElements.game.style.display = 'none';
   kifElements.settings.style.display = 'block';
}
function hideSettings() {
   kifElements.game.style.display = 'block';
   kifElements.settings.style.display = 'none';
}

function showDecks() {
   document.getElementById("deck-box").style.display = 'block';
   document.getElementById("play-box").style.display = 'none';
}
function hideDecks() {
   document.getElementById("deck-box").style.display = 'none';
   document.getElementById("play-box").style.display = 'block';
}

function closePopup() {
   kifElements.opacityBack.style.display = "none";
   kifElements.popup.style.display = "none";
   kifElements.password.value = '';
}

function openPopup() {
   kifElements.opacityBack.style.display = "block";
   kifElements.popup.style.display = "table";
}


function userNotListed(user) {
   if (document.getElementById('liContact' + user) == null) {
      return true;
   }
}
function invitationExists(user) {
   if(document.getElementById("liInviter" + user) != null) {
      return true;
   }
}

function addContact(user) {
   var li = document.createElement('li');
   li.id = 'liContact'+user;

   var label = document.createElement('label');
   label.id = 'labelContact'+user;
   label.appendChild(document.createTextNode(user));
   li.appendChild(label);

   var anch = document.createElement('a');
   anch.id = 'abuttonContact'+user;
   anch.className = "button";
   anch.onclick = function() {onclickContactAction(user)};
   anch.appendChild(document.createTextNode("Invite"));
   li.appendChild(anch);

   kifElements.onlineContacts.appendChild(li);
}
function setContactPlaying(user) {
   var anch = document.getElementById('abuttonContact' + user);
   addClass(anch,'red');
   anch.onclick = null;
   anch.firstChild.nodeValue = "Playing";
}
function setContactAsInvited(user) {
   var label = document.getElementById('labelContact' + user);
   label.innerHTML = "Inviting <span>"+user+"</span>...Waiting for response...";
   var anch = document.getElementById('abuttonContact' + user);
   addClass(anch,'red');
   anch.onclick = function() {cancelInvitation(user)};
   anch.firstChild.nodeValue = "Cancel";
}
function resetContact(user, resetLabel) {
   if(resetLabel) {
      var label = document.getElementById('labelContact' + user);
      label.innerHTML = user;
   }
   var anch = document.getElementById('abuttonContact' + user);
   removeClass(anch,'red');
   anch.onclick = function() {onclickContactAction(user)};
   anch.firstChild.nodeValue = "Invite";
}

function removeContact(user) {
   //remove the player from the list
   licontact = document.getElementById("liContact" + user);
   if(licontact != null) {
      kifElements.onlineContacts.removeChild(licontact);
   }
   //if the player who is logging out, had invited me, i remove the invitation
   removeInvitation(user);
}

function addInvitation(user) {
   var li = document.createElement('li');
   li.id = 'liInviter'+user;

   var label = document.createElement('label');
   var span = document.createElement('span');
   span.appendChild(document.createTextNode(user));
   label.appendChild(span);
   label.appendChild(document.createTextNode(" invites you for a game."));
   li.appendChild(label);

   var anch = document.createElement('a');
   anch.className = "button";
   anch.onclick = function() {acceptInvitation(user)};
   anch.appendChild(document.createTextNode("Accept"));
   li.appendChild(anch);

   kifElements.liveInvitations.appendChild(li);
}

function removeInvitation(user) {
   var invitation = document.getElementById("liInviter" + user);
   if(invitation) kifElements.liveInvitations.removeChild(invitation);
}

function setStatusMessage(msg, className, add) { //you can skip the third param and use wrapper below; if no className - reset/remove classes
   if(add) {
      kifElements.status.innerHTML += '<br>'+msg;
   } else {
      kifElements.status.innerHTML = msg;
   }
   if(className) {
      kifElements.status.className = className;
   } else {
      kifElements.status.removeAttribute("class");
   }
}
function appendStatusMessage(msg, className) {
   setStatusMessage(msg, className, true);
}

function setContButton(opt) {
   var content;
   switch(opt) {
      case 'empty':
         content = '';
         break;
      case 'continue':
         content = '<a id="continue" class="button" onClick="cont();">Continue</a>';
         break;
      case 'start':
         content = '<a href="#" id="play" class="button" onClick="play();">Start</a>';
         break;
      case 'exit':
         content = '<a class="button" onClick="exitGame();">OK</a><a class="button red" onClick="cancelExitGame();">Cancel</a>';
         break;
      case 'newgame':
         content = '<a class="button" onClick="newGameAccepted(false);">OK</a><a class="button red" onClick="newGameRefused();">Cancel</a>';
         break;
      case 'newgame+':
         content = '<a class="button" onClick="newGameAccepted(false);">Yes</a><a class="button red" onClick="exitGame();">No</a>';
         break;
   }
   kifElements.contButton.innerHTML = content;
}

function showTextChat() {
   kifElements.chat.style.display = 'table-row';
   kifElements.textButton.onclick = function() { hideTextChat(); };
   //added to remove the incoming message notification A. Longo 30.04
   kifElements.textButton.style.border = 'none';
}

function hideTextChat() {
   kifElements.chat.style.display = 'none';
   kifElements.textButton.onclick = function() { showTextChat(); };
}

function lockGame() {
   kifElements.newElem.className = 'disabled';
   kifElements.newButton.onclick = null;

   kifElements.lockButton.innerHTML = "Unlock";
   kifElements.lockButton.onclick = function() { openPopup(); return false; };

   kifElements.endElem.className = 'disabled';

   kifElements.endButton.onclick = null;
};

function unlockGame() {
   kifElements.newElem.className = "button2";
   kifElements.newButton.onclick = function() {newGame(); return false;};

   kifElements.lockButton.onclick = function() {lockGame(); return false;};
   kifElements.lockButton.innerHTML = "Lock";

   kifElements.endElem.className = "button2";
   kifElements.endButton.onclick = function() {exitGame(); return false;};

   closePopup();
};


//GAME UI
function setGameUI(){
   kifElements.myName.innerHTML = kif.myName;
   kifElements.opponentName.innerHTML = kif.oName;
   //document.getElementById("chatBox").innerHTML = '<input type="text" id="chatBx" height="200">';

 //buttons below should be greyed(look like disabled) only when lock feature is active - kwlodarska 23.04
   //var newElem = document.getElementById("newElem");
   //newElem.className = 'disabled';
   //var endElem = document.getElementById("endElem");
   //endElem.className = 'disabled';


   //initialize chat settings

   if(kif.useMyDeck) {
      choseDeck();
   } else {
      setStatusMessage("Waiting for the dealer...");
   }
};


// AJAX
function choseDeck(){
   var ajaxRequest;
   try{ ajaxRequest = new XMLHttpRequest(); }
   catch (e){
      alert("Exception: " + e);
      return false;
   }

   ajaxRequest.onreadystatechange = function(){
      if(ajaxRequest.readyState == 4){
         kif.decks = JSON.parse(ajaxRequest.responseText);
         drawDecks();
      }
   }
   ajaxRequest.open("GET", "webinos_trumps_decks.js", true);
   ajaxRequest.send();
};

function drawDecks() {
   var html ='';
   for(i = 0; i < kif.decks.length; i++) {
      html += '<div class="picture button2" onclick="loadDeck('+i+');">'
      html += '<p>'+kif.decks[i].name+'</p><p>Cards: '+kif.decks[i].NumberOfCards+'</p>';
      html += '</div>'
   }
   //document.getElementById("status-text").innerHTML = "Chose the deck:";
   document.getElementById("deck-box").innerHTML = html;

   showDecks();
}

// AJAX
function loadDeck(i) {
   var ajaxRequest;

   try { ajaxRequest = new XMLHttpRequest(); }
   catch (e) {
      alert("Excepiton: " + e);
      return false;
   }

   ajaxRequest.onreadystatechange = function(){
      if(ajaxRequest.readyState == 4){
         kif.cardData = JSON.parse(ajaxRequest.responseText);
         sendMsg('sendDeckData', ajaxRequest.responseText);
         sendMsg('setCardsClassName', kif.decks[i].className);
         setCardsClassName(kif.decks[i].className);

         hideDecks();
         gameInit();
         setStatusMessage('Click start to Play');
         setContButton('start');
      }
   };
   ajaxRequest.open("GET", "webinos_trumps_decks/"+kif.decks[i].url , true);
   ajaxRequest.send();
};


function setCardsClassName(className) {
   kifElements.card1.className = "card-front "+className;
   kifElements.card2.className = "card-front "+className;
   kifElements.card1back.className = "card-back "+className;
   kifElements.card2back.className = "card-back "+className;
}

function initializeAttributes(data) {
   var attributes = [];
   var card1HTML = '';
   var card2HTML = '';
   var skip=0;
   var count=1;
   for (i in data[0]) {
     if(skip < 3) {
       skip++;
       continue;
     }
     attributes.push(i);
     card1HTML += "<div id='c1attr"+count+"' onClick='lineChosen("+count+");mark(this.id);'><span id='ac1"+count+"n'>"+i+"</span><span id='ac1"+count+"v'></span></div>";
     card2HTML += "<div id='c2attr"+count+"' onClick='lineChosen("+count+");mark(this.id);'><span id='ac2"+count+"n'>"+i+"</span><span id='ac2"+count+"v'></span></div>";
     count++;
   }
   kifElements.card1attributes.innerHTML = card1HTML;
   kifElements.card2attributes.innerHTML = card2HTML;
   return attributes;
};

//sends user's chat message
function sendChat() {
   var msg = kifElements.chatInput.value;
   if(msg!='') {
      kifElements.chatInput.value = "";
      sendMsg('chat', msg);
      pasteChatMsg(kif.myName, msg);
      scrollDownChatBox();
   }
};

function pasteChatMsg(sender, msg) {
   var senderName,
      settings,
      pClass;
   if(sender == kif.myName) {
      senderName = 'Me';
      settings = kif.settings.mine;
      pClass = '';
   } else {
      senderName = sender;
      settings = kif.settings.opponent;
      pClass = ' class="opponentLine"';
   }

   kifElements.chatBox.innerHTML += '<p'+pClass+'><span style="font-size:'+settings.fontSize+';color:'+settings.color+'">'+senderName+': </span><span style="font-family:\''+settings.fontFamily+'\';font-size:'+settings.fontSize+';color:'+settings.color+'">' + msg + '</span></p>';
}

function scrollDownChatBox() {
   kifElements.chatBox.scrollTop = kifElements.chatBox.scrollHeight;
}

function setSettings() {
   // THOSE SETTINGS ARE OBSOLETE AND _BADLY IMPLEMENTED_!
   // but in the future - if stuff could be saved- settings should ALWAYS be put to kif.settings
   // the settings itself could be generated dynamically with this function, and options would have an index
   // going in/from the kif.settings (and not for example "150%")
   // So this function should be invoked then ONCE at start, and the settings button would have onclick=showSettings

   //load previous settings in the dropdown lists
   /*document.getElementById("mcolor").selectedIndex = getColorIndex(document.getElementById("chatInput").style.color);
   document.getElementById("mfamily").selectedIndex = getFamilyIndex(document.getElementById("chatInput").style.fontFamily);
   document.getElementById("msize").selectedIndex = getSizeIndex(document.getElementById("chatInput").style.fontSize);
   document.getElementById("ocolor").selectedIndex = getColorIndex(kif.settings.opponent.color);
   document.getElementById("ofamily").selectedIndex = getFamilyIndex(kif.settings.opponent.fontFamily);
   document.getElementById("osize").selectedIndex = getSizeIndex(kif.settings.opponent.fontSize);
   if(kif.invisible) {
      document.getElementById("mstatus").selectedIndex = 1;
   }*/

   showSettings();
};

function saveSettings() {
   mfc = document.getElementById("mcolor");
   kif.settings.mine.color = mfc.options[mfc.selectedIndex].value;
   mff = document.getElementById("mfamily");
   kif.settings.mine.fontFamily = mff.options[mff.selectedIndex].value;
   mfs = document.getElementById("msize");
   kif.settings.mine.fontSize = mfs.options[mfs.selectedIndex].value;

   ofc = document.getElementById("ocolor");
   kif.settings.opponent.color = ofc.options[ofc.selectedIndex].value;
   off = document.getElementById("ofamily");
   kif.settings.opponent.fontFamily = off.options[off.selectedIndex].value;
   ofs = document.getElementById("osize");
   kif.settings.opponent.fontSize = ofs.options[ofs.selectedIndex].value;

//apply
   kifElements.chatInput.style.color = kif.settings.mine.color;
   kifElements.chatInput.style.fontFamily = kif.settings.mine.fontFamily;
   kifElements.chatInput.style.fontSize = kif.settings.mine.fontSize;

   mst = document.getElementById("mstatus");
   kif.users[kif.myName] = mst.options[mst.selectedIndex].value;

   if(kif.users[kif.myName] == 'offline') {
      kif.invisible = true;
      sendStatus('logout', true);
   } else {
      kif.invisible = false;
      sendStatus('online', true);
   }

   hideSettings();
   scrollDownChatBox();
};

function cancelSettings() {
   hideSettings();
   scrollDownChatBox();
};


/* ONCLICK actions */


// mark option on a card
function mark(attr) {
   if((attr == null || gamet.currentTurn) && !gamet.newGameProposal) {
      for(var i=1; i<=5; i++) {
         removeClass(document.getElementById('c1attr'+i),'marked');
      }
      addClass(document.getElementById(attr),'marked');
   }
};

function onclickContactAction(contactName) {
   // Invite and go to Stage 2, waiting for response from invitee.
   setContactAsInvited(contactName)

      sendInvitation('invite', kif.myName, contactName);

   kif.useMyDeck = true;
   kif.oName = contactName;
}

function cancelInvitation(invitee){
   resetContact(invitee, true);

      sendInvitation('cancelInvite', kif.myName, invitee);

   kif.useMyDeck = false;
   kif.oName = "";
}

function acceptInvitation(inviter){
   kif.oName = inviter;
   kif.useMyDeck = false;
   kif.engaged = inviter;

    // Enter Stage 3: Start the game.
   setGameUI();
   showGame();

      sendInvitation('acceptInvitation', inviter, kif.myName);

   sendStatus('playing');
};

function confirmExitGame() {
   setStatusMessage('Are you sure you want to exit?', 'black');
    setContButton('exit');
};

function cancelExitGame() {
   setContButton('empty');
   if(kif.useMyDeck) {
       setStatusMessage('Click Start to Play');
       setContButton('start');
   } else {
       setStatusMessage('Waiting for the dealer...');
   }
   if(typeof gamet != 'undefined' && gamet != null && gamet.started) {
      updateUI();
      if(gamet.currentTurn) {
         setContButton('continue');
      } else {
         setContButton('empty');
      }
   }
};

function gameClosed() {
   showHome();
};

function anotherGame() {
   if(kif.useMyDeck) {
      setStatusMessage('New Game?');
      setContButton('newgame+');
   }
   else {
      setStatusMessage('Waiting for the dealer...');
   }
};

function newGame(){
   if(gamet && gamet.inputEnable) {
      setContButton('empty');
      setStatusMessage("Waiting for an answer...");
      gamet.newGameProposal = true;
      sendMsg('newGame', null);
   } else {
      setStatusMessage("Not Allowed!");
   }
};

function exitGame() {
      sendStatus('gameClosed');
   sendStatus('notPlaying');

   // modified by Polito
   // in order to not exit from the app but just from the game

   //location.reload();

   resetApp();
   gameClosed();

   //if i'm not invisible i send the event login, showing my presence
   if(!kif.invisible) {
      sendStatus('login');
   }

   // end of Polito modifications
};

function resetApp() {
   //var reset
   kif.users = [];
   kif.engaged = '';
   kif.useMyDeck = false;
   kif.oName = "";

   //reset cards and buttons
   switchUICard("1", "b", "");
   switchUICard("2", "b", "");
   setContButton('empty');
   kifElements.newElem.className = "button2";
   kifElements.endElem.className = "button2";

   //reset contacts
   kifElements.onlineContacts.innerHTML = '';
   kifElements.liveInvitations.innerHTML = '';

   //reset chat history
   kifElements.chatBox.innerHTML = '';
}

// End of file.
