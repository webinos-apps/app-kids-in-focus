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
 * Webinos Trumps Engine
 *
 * Andrea Longo 12/03/12
 */

/**
 *	Initializes the game
 */

function gameInit(){
	gamet = new gameStatus();
};

/**
 *	New game proposal accepted
 *	@param {bool} isInviter
 */

function newGameAccepted(inviter){
	gamet.newGameProposal = false;
	if(!inviter)
		sendMsg('newGameAccepted',null);
	//clear card's attributes
	kifElements.card1attributes.innerHTML = '';
	kifElements.card2attributes.innerHTML = '';
	//gamet = null;
	switchUICard("1", "b", "");

	if(kif.useMyDeck)
		choseDeck();
	else
		{
		setStatusMessage("<p>New Game Accepted!</p><p>Waiting for the dealer...</p>");
		setContButton('empty');
		}

};


/**
 *	New game proposal refused
 */

function newGameRefused()
{
	gamet.newGameProposal = false;
	sendMsg('newGameRefused',null);
	updateUI();
};

/**
 *	Update the UI with currentCards and winner and loser of the current turn
 */

function updateUI()
{
	kifElements.myCardsNo.innerHTML = 'Cards: '+ gamet.numOfMyCards();
	kifElements.opCardsNo.innerHTML = 'Cards: '+ (gamet.deck.numOfCards() - gamet.numOfMyCards());
	   if(gamet.currentTurn == true) {
	      setStatusMessage('Your turn!');
	      kifElements.myName.className = 'name active';
	      kifElements.opponentName.className = 'name';
	      kifElements.card1attributes.className = 'cardAttributes';
	      //$("div.line").toggleClass('lineChosen', true);
	   } else {
	      setStatusMessage(kif.oName + "'s turn!");
	      kifElements.myName.className = 'name';
	      kifElements.opponentName.className = 'name active';
	      kifElements.card1attributes.className = 'cardAttributes inactive';
	      //$("div.line").toggleClass('lineChosen', false);
	   }
};



/**
 *	Game start with random selection of the turn
 */

function play()
{
    gamet.started = true;
	setContButton('continue');
	kifElements.newButton.setAttribute('onClick', 'newGame(); return false;');

	rnd = 1 + (Math.floor(Math.random()*2));
	if(rnd === 1)
		{
		gamet.currentTurn = true;
		sendMsg('nextTurn', false);
		}
	else
		{
		gamet.currentTurn = false;
		sendMsg('nextTurn', true);
		}
	nextTurn();
};

/**
 *	Compare players attribute values
 *	@param {selection} Selection
 */

function evaluateAttr(selection)
{
	gamet.inputEnable = false;
	gamet.opponentCurrentCard = selection.card;
	showCard("2", gamet.opponentCurrentCard, 'flip');
	myValue = gamet.deck.data[gamet.myCurrentCard-1][selection.attr];
	opponentValue = gamet.deck.data[gamet.opponentCurrentCard-1][selection.attr];

	//document.getElementById("status").innerHTML = "Attribute: "+selection.attr+" myValue: "+ myValue + " opponentValue: " + opponentValue;

	if((myValue > opponentValue) || (myValue === opponentValue && !gamet.currentTurn))
	{
		//get boths cards
		gamet.currentTurn = true;
		gamet.myCards.push(gamet.myCurrentCard);
		gamet.myCards.push(gamet.opponentCurrentCard);
 		setStatusMessage('You win');
	}
	else
	{
		gamet.currentTurn = false;
		setStatusMessage('You lose');
	}

	setTimeout("nextTurn()",3000);
};

/**
 *	Sends the line chosen by the player
 *	@param {int} lineNumber
 */

function lineChosen(line)
{

	if(gamet.currentTurn && !gamet.newGameProposal)
		gamet.sel = new selection(gamet.myCurrentCard,gamet.deck.attributes[line-1]);
};

/**
 *	Random card function
 */

function randOrd(){
	return (Math.round(Math.random())-0.5);
};

/**
 *	Starts the next turn of the game
 */

function nextTurn()
{
	mark(null);
	gamet.inputEnable = true;
	gamet.sel = null;
	if(gamet.currentTurn)
		setContButton('continue');
	else
		setContButton('empty');

	if(gamet.numOfMyCards() === 0)
		{
		setStatusMessage('LOSER', 'loseColor');
		setTimeout("anotherGame()",3000);
		}
	else if(gamet.numOfMyCards() === gamet.deck.numOfCards())
		{
		setStatusMessage('WINNER', 'winColor');
		setTimeout("anotherGame()",3000);
		}
	else
	{
		updateUI();
		gamet.myCards.sort(randOrd);
		gamet.myCurrentCard = gamet.myCards.shift();
		gamet.opponentCurrentCard = null;
		showCard("1",gamet.myCurrentCard);
		switchUICard("2", "b", "");
		//activateAttributes of the player who's the turn
	}

};

/**
 *	Sends line chosen
 */

function cont() {
	if(gamet.currentTurn && gamet.inputEnable && !gamet.newGameProposal && gamet.sel!=null)
	{
	  gamet.inputEnable = false;
      sendMsg('attrChosen', gamet.sel);
	}
};

/**
 *	Shows the current card to the player
 *	@param {String} idPlayer
 *	@param {int} idCard
 */

function showCard(player,card, flip)
{
	card = card -1;
	document.getElementById("cardName"+player).innerHTML = gamet.deck.data[card].name;
   	var img = '<img src="img/'/*+decks[deckIndex].url+'/'*/+gamet.deck.data[card].url+'" alt="card" width="180" height="180" />';
	document.getElementById("img"+player).innerHTML = img;
	for(i=1; i<=gamet.deck.getNumAtts(); i++)
		document.getElementById("ac"+player+i+"v").innerHTML = gamet.deck.data[card][gamet.deck.attributes[i-1]];
	switchUICard(player, "", "b", flip);
};

/**
 *	Switches the card from visible to hidden and viceversa.
 *	"" indicates the front of the card
 *	"b" indicates the back of the card
 *	@param {String} idPlayer
 *	@param {String} whatToShow
 *	@param {String} whatToHide
 */

function switchUICard(player, show, hide, flip)
{
	if(player == 2) {
		if(flip) {
			kifElements.cardContainer2.className += " flip-animate";
		} else {
			var flipClassArr = kifElements.cardContainer2.className.split(" ");
			var flipClassIndex = flipClassArr.indexOf("flip-animate");
			if(flipClassIndex != -1) {
				flipClassArr.splice(flipClassIndex,1);
				kifElements.cardContainer2.className = flipClassArr.join(" ");
			}
		}
	}
	document.getElementById("card"+player+show).style.visibility = "visible";
	document.getElementById("card"+player+hide).style.visibility = "hidden";
};

/**
 *	Initializes players cards
 *	@param {deckCards} deckCards
 *	@return {int[]} cardsIds
 */

function myCards(deck)
{
	var myCards = new Array();
	if(kif.useMyDeck)
	{
		var opponentCards = new Array();
		for(i=1; i<=deck.data.length; i++)
			opponentCards.push(i);

		//If the number of cards is odd, one is randomly dropped
		if(opponentCards.length%2 !== 0)
			{
				opponentCards.sort(randOrd);
				drop = opponentCards.shift();
				console.log("DROPPED: " + drop);
			}
		var ind = null;
		do {
			ind = Math.floor(Math.random()*opponentCards.length);
			myCards.push(opponentCards[ind]);
			opponentCards.splice(ind, 1);
		}while(myCards.length!=Math.floor(deck.data.length/2));
		/*console.log("my Cards: "+myCards);
		console.log("his Cards: "+opponentCards);*/

		//send opponentCards
		sendMsg('myCards', opponentCards);
	}
	return myCards;
};

/**
 *	@class Represents the card and the attribute chosen by the player
*/
var selection = function(card, att){
	/**
	 *	Current player's card
	 *	@type int
	 */
	this.card = card;
	/**
	 *	Line chosen by the player
	 *	@type int
	 */
	this.attr = att;
};

/**
 *	@class Represents the object Deck
*/

var deckCards = function(){
	/**
	 *	Deck cards information
	 */
	this.data = kif.cardData;
	this.attributes = initializeAttributes(this.data);
	/**
	 *	Returns the number of the card in the deck
	 *	@return {int} numberOfCards
	 */
	this.numOfCards = function(){
		if(gamet.deck.data.length % 2 === 0)
			return gamet.deck.data.length;
		else
			return gamet.deck.data.length-1;
	}

	/**
	 *	Return the number of attributes of a deck card
	 *	@return {int} numberOfAttributes
	 */
	this.getNumAtts = function(){
    		return this.attributes.length;
  	}
	this.backCard = "";
};

/**
 *	@class Represents the object game status
*/

var gameStatus = function ()
{

	/*if(gamet === undefined || gamet === null)
	{*/
		/**
		 *	Game deck
		 *	@type deckCards
		 */
		this.deck = new deckCards();
		/**
		 *	Is current player's turn
		 *	@type bool
		 */
		this.currentTurn = null;
		/**
		 *	Player's cards
		 *	@type myCards
		 */
		this.myCards = myCards(this.deck);
		/**
		 *	Player current card
		 *	@type int
		 */
		this.myCurrentCard = null;
		/**
		 *	Opponent current card
		 *	@type int
		 */
		this.opponentCurrentCard = null;
		/**
		 *	Player input selection enable
		 *	@type bool
		 */
		this.inputEnable = false;
		/**
		 *	New game proposal
		 *	@type bool
		 */
		this.newGameProposal = false;
		/**
		 *	Object line selected
		 *	@type selection
		 */
		this.sel = null;
		/**
		 *	Game Started flag
		 *	@type bool
		 */
		this.started = false;

	/**
	 *	Returns the number of the player's cards
	 *	@return {int} numberOfCards
	 */
	this.numOfMyCards = function(){
		return this.myCards.length;
	}

};

var gamet;
