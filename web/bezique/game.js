const gamename = decodeURIComponent(window.location.search.match(/(\?|&)game\=([^&]*)/)[2]);
const gamepass = decodeURIComponent(window.location.search.match(/(\?|&)gamepass\=([^&]*)/)[2]);
const playername = decodeURIComponent(window.location.search.match(/(\?|&)playername\=([^&]*)/)[2]);
const playerpass = decodeURIComponent(window.location.search.match(/(\?|&)playerpassword\=([^&]*)/)[2]);

const gamemessage = document.getElementById('gamemessage');
const scoremessage = document.getElementById('scoremessage');

const commonmarriage = document.getElementById('royalmarriage');
const royalmarriage = document.getElementById('royalmarriage');
const bezique = document.getElementById('bezique');
const sequence = document.getElementById('sequence');
const doublebezique = document.getElementById('doublebezique');

const buttonStartGame = document.getElementById('startgame');
const buttonPlayTrick = document.getElementById('playTrick');

const playerscore = document.getElementById('playerscore');
const opponentscore = document.getElementById('opponentscore');
const trumpCard = document.getElementById('trumpCard');
const deck = document.getElementById('deck');
const tricks = document.getElementById('tricks');
const opponenttricks = document.getElementById('opponenttricks');
const playerhandcards = document.getElementById('playerhandcards');
const playermeldcards = document.getElementById('playermeldcards');
const playertrickcard = document.getElementById('playertrickcard');
const opponenttrickcard = document.getElementById('opponenttrickcard');
const opponentmeldcards = document.getElementById('opponentmeldcards');
const opponenthandcards = document.getElementById('opponenthandcards');

const templatePlayer = document.getElementById('player');
const templatePlayingCard = document.getElementById('playingcard');
const templateTalon = document.getElementById('talon');
const templatePlayingCardWithName = document.getElementById('playingcardWithName');

const initgame = () => {
    buttonStartGame.addEventListener('click', (e) => {
        e.preventDefault();
        doAction('startGame');
    });
    
    buttonPlayTrick.addEventListener('click', e => {
        e.preventDefault();
        doAction('playCard');
    })
    startPolling();
}

let latestVersion;
let lastScoreMessage;
let poller;

// functions

const startPolling = () => {
    poller = setInterval(() => {
        pollAndUdpate();
    }, 500)
}

const processGameState = (game) => {
    console.log('Processing new state', game);

    const playerState = game.players.find(p => p.name === playername)
    const opponentState = game.players.find(p => p.name !== playername)

    gamemessage.innerText = game.message;
    scoremessage.innerText = game.lastScoreMessage;
    if (lastScoreMessage !== game.lastScoreMessage) {
        console.log(game.lastScoreMessage);
        lastScoreMessage = game.lastScoreMessage
    }
    playerscore.innerText = `${playerState.name}: ${playerState.score}`;
    opponentscore.innerText = opponentState ? `${opponentState.name}: ${opponentState.score}` : 'waiting for opponent to join';

    const trumpSuit = game.trumpCard ? game.trumpCard.suit : undefined;
    let jackBezique;
    let queenBezique;
    if (trumpSuit === 'D' || trumpSuit === 'S') {
        jackBezique = 'H';
        queenBezique = 'C'
    } else {
        jackBezique = 'D'
        queenBezique = 'S'
    }
    commonmarriage.innerText = trumpSuit !== "H" ? `Common Marriage. K and Q same suit. eg KH and QH. Points: 20`
        : "Common Marriage. K and Q same suit. eg KS and QS. Points: 20"
    royalmarriage.innerText = trumpSuit ? `Royal Marriage. K and Q of trump suit. K${trumpSuit} and Q${trumpSuit}. Points: 40`
        : "Royal Marriage. K and Q of trump suit. KH and QH. Points: 40"
    bezique.innerText = `Bezique. Q${queenBezique} J${jackBezique} Points: 40`
    sequence.innerText = trumpSuit ? `Sequence. J Q K 10 A of trump suit. J${trumpSuit} Q${trumpSuit} K${trumpSuit} 10${trumpSuit} A${trumpSuit}. Points: 250` :
        "Sequence. J Q K 10 A of trump suit. JH QH KH 10H AH. Points: 250"
    doublebezique.innerText = `Double Bezique. Q${queenBezique} J${jackBezique} Q${queenBezique} J${jackBezique}. Points: 500`

    if (playerState.isHost && !game.started) {
        buttonStartGame.classList.remove('hidden');
    } else {
        buttonStartGame.classList.add('hidden')
    }

    if (playerState.selectedCardForTrick || playerState.selectedCardsForMeld.length > 0) {
        buttonPlayTrick.disabled = false
    } else {
        buttonPlayTrick.disabled = true
    }

    if (game.started) {
        refreshHandCards(playerState, game);
        refreshOpponentHandCards(opponentState);
        refreshMeldCards(playerState);
        refreshOpponentMeldCards(opponentState);
        refreshTrumpCard(game);
        refreshDeckCard(playerState, game);
        refreshTrickCards(playerState, opponentState)
        refreshTricksTaken(playerState, opponentState, game)
    }

}

const doAction = (action, body) => {
    body = body ? body : {};
    body.playername = playername;
    body.playerpassword = playerpass;
    body.gamename = gamename;
    body.gamepassword = gamepass;

    fetch(action, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(async r => {
            if (r.status !== 200) {
                const err = await r.text()
                alert(`${action} failed: ${err}`);
            } else {
                console.log(`${action} was successful`);
                pollAndUdpate();
            }
        })
        .catch(err => {
            alert(`${action} failed: ${err}`)
        })
}

function refreshHandCards(playerState, game) {
    while (playerhandcards.firstChild) {
        playerhandcards.removeChild(playerhandcards.firstChild);
    }
    if (playerState.cards) {
        for (let index = 0; index < playerState.cards.length; index++) {
            const card = playerState.cards[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('img').src = card.img;
            if (playerState.cardsSelectableForTrick || playerState.cardsSelectableForMeld) {
                newCard.querySelector('.playingcard').classList.add('selectable');
                newCard.querySelector('.playingcard').addEventListener('click', e => {
                    e.preventDefault();
                    doAction('selectCard', { id: card.id });
                });
            }
            if (playerState.selectedCardForTrick && playerState.selectedCardForTrick.id === card.id
                || playerState.selectedCardsForMeld.some(c => c.id === card.id)) {
                newCard.querySelector('.playingcard').classList.add('selected');
            }
            playerhandcards.appendChild(newCard);
        }
    }
}

function refreshMeldCards(playerState) {
    while (playermeldcards.firstChild) {
        playermeldcards.removeChild(playermeldcards.firstChild);
    }
    if (playerState.cardsPlayedForMelds) {
        for (let index = 0; index < playerState.cardsPlayedForMelds.length; index++) {
            const card = playerState.cardsPlayedForMelds[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('img').src = card.img;
            if (playerState.cardsSelectableForTrick || playerState.cardsSelectableForMeld) {
                newCard.querySelector('.playingcard').classList.add('selectable');
                newCard.querySelector('.playingcard').addEventListener('click', e => {
                    e.preventDefault();
                    console.log('click');
                    doAction('selectCard', { id: card.id });
                });
            }
            if (playerState.selectedCardForTrick && playerState.selectedCardForTrick.id === card.id
                || playerState.selectedCardsForMeld.some(c => c.id === card.id)) {
                newCard.querySelector('.playingcard').classList.add('selected');
            }
            playermeldcards.appendChild(newCard);
        }
    }
}

function refreshOpponentMeldCards(opponentState) {
    while (opponentmeldcards.firstChild) {
        opponentmeldcards.removeChild(opponentmeldcards.firstChild);
    }
    if (opponentState.cardsPlayedForMelds) {
        for (let index = 0; index < opponentState.cardsPlayedForMelds.length; index++) {
            const card = opponentState.cardsPlayedForMelds[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('img').src = card.img;
            opponentmeldcards.appendChild(newCard);
        }
    }
}

function refreshTrumpCard(game) {
    while (trumpCard.firstChild) {
        trumpCard.removeChild(trumpCard.firstChild);
    }
    if (game.trumpCard) {
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = game.trumpCard.img;

        trumpCard.appendChild(newCard);
    }
}
function refreshTricksTaken(playerState, opponentState, game) {
    while (tricks.firstChild) {
        tricks.removeChild(tricks.firstChild);
    }
    if (game.revealBrisques) {
        for (let index = 0; index < playerState.cardsWonFromTricks.length; index++) {
            const card = playerState.cardsWonFromTricks[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('img').src = card.img;

            if (card.face === '10' || card.face === 'A') {
                newCard.querySelector('img').classList.add('brisque')
            }
            tricks.appendChild(newCard)
        }

    } else if (playerState.numberCardsWonFromTricks > 0) {
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = '../img/cardback.jpg';

        tricks.appendChild(newCard);
    }

    while (opponenttricks.firstChild) {
        opponenttricks.removeChild(opponenttricks.firstChild);
    }

    if (game.revealBrisques) {
        for (let index = 0; index < opponentState.cardsWonFromTricks.length; index++) {
            const card = opponentState.cardsWonFromTricks[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('img').src = card.img;
            if (card.face === '10' || card.face === 'A') {
                newCard.querySelector('img').classList.add('brisque')
            }
            opponenttricks.appendChild(newCard);
        }
    } else if (opponentState.numberCardsWonFromTricks > 0) {
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = '../img/cardback.jpg';

        opponenttricks.appendChild(newCard);
    }
}

function refreshDeckCard(playerState, game) {
    while (deck.firstChild) {
        deck.removeChild(deck.firstChild);
    }
    // @ts-ignore
    const newCard = templateTalon.content.cloneNode(true);
    newCard.querySelector('img').src = '../img/cardback.jpg';
    newCard.querySelector('.decknumber').innerText = game.deckNumber;

    if (playerState.cardsSelectableForMeld) {
        newCard.querySelector('img').classList.add('selectable');
        newCard.querySelector('img').addEventListener('click', e => {
            e.preventDefault();
            doAction('pickUpCard')
        });
    }
    deck.appendChild(newCard);
}

function refreshTrickCards(playerState, opponentState) {
    while (playertrickcard.firstChild) {
        playertrickcard.removeChild(playertrickcard.firstChild);
    }
    if (playerState.cardPlayedForTrick) {
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = playerState.cardPlayedForTrick.img;

        playertrickcard.appendChild(newCard);
    }

    while (opponenttrickcard.firstChild) {
        opponenttrickcard.removeChild(opponenttrickcard.firstChild);
    }
    if (opponentState.cardPlayedForTrick) {
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = opponentState.cardPlayedForTrick.img;

        opponenttrickcard.appendChild(newCard);
    }
}


function refreshOpponentHandCards(playerState) {
    while (opponenthandcards.firstChild) {
        opponenthandcards.removeChild(opponenthandcards.firstChild);
    }
    for (let index = 0; index < playerState.numberCardsInHand; index++) {
        const card = playerState.cards[index];
        // @ts-ignore
        const newCard = templatePlayingCard.content.cloneNode(true);
        newCard.querySelector('img').src = '../img/cardback.jpg';
        opponenthandcards.appendChild(newCard);
    }
}

function pollAndUdpate() {
    fetch(`game/${gamename}/${playername}?playerpass=${playerpass}`)
        .then(async (response) => {
            if (response.status !== 200) {
                const err = await response.text()
                alert('Something went wrong, please refresh: ' + err);
                clearInterval(poller);
            } else {
                const eTag = response.headers.get('ETag');
                if (eTag !== latestVersion) {
                    latestVersion = eTag;
                    const state = await response.json();
                    processGameState(state);
                }
            }
        })
        .catch(err => {
            alert('Something went wrong in the ui, please refresh: ' + err);
            console.error(err);
            clearInterval(poller);
        });
}

initgame();