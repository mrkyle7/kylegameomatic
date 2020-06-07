const gamename = decodeURIComponent(window.location.search.match(/(\?|&)game\=([^&]*)/)[2]);
const gamepass = decodeURIComponent(window.location.search.match(/(\?|&)gamepass\=([^&]*)/)[2]);
const playername = decodeURIComponent(window.location.search.match(/(\?|&)playername\=([^&]*)/)[2]);
const playerpass = decodeURIComponent(window.location.search.match(/(\?|&)playerpassword\=([^&]*)/)[2]);

const title = document.getElementById('title');
const playermessage = document.getElementById('playermessage');
const gamemessage = document.getElementById('gamemessage');

const buttonStartGame = document.getElementById('startgame');
const buttonAddRandomBot = document.getElementById('addRandomBot');

const sectionHandcards = document.getElementById('handcards');
const sectionSelectedCards = document.getElementById('selectedCards');
const sectionPlayers = document.getElementById('players');

const templatePlayer = document.getElementById('player');
const templatePlayingCard = document.getElementById('playingcard');
const templatePlayingCardWithName = document.getElementById('playingcardWithName');

const initgame = () => {
    startPolling();
    buttonStartGame.addEventListener('click', (e) => {
        e.preventDefault();
        doAction('startGame');
    }) ;
    buttonAddRandomBot.addEventListener('click', (e) => {
        e.preventDefault();
        doAction('addRandomBot');
    })
    
}

let latestVersion;
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

    title.innerText = `Hello ${playername}, you are playing in game: ${game.name}`;

    playermessage.innerText = playerState ? playerState.message : 'You left the game!';
    gamemessage.innerText = game.message;

    refreshPlayerList(game);

    if (playerState.isHost && !game.started) {
        buttonStartGame.classList.remove('hidden');
        buttonAddRandomBot.classList.remove('hidden');
    } else {
        buttonStartGame.classList.add('hidden')
        buttonAddRandomBot.classList.add('hidden');
    }

    refreshHandCards(playerState, game);

    refreshRows(game);

    refreshSelectedCards(game);
}

const clearPlayers = () => {
    while (sectionPlayers.firstChild) {
        sectionPlayers.removeChild(sectionPlayers.firstChild)
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

function refreshSelectedCards(game) {
    while (sectionSelectedCards.firstChild) {
        sectionSelectedCards.removeChild(sectionSelectedCards.firstChild);
    }
    for (let card of game.selectedCards) {
        // @ts-ignore
        const newCard = templatePlayingCardWithName.content.cloneNode(true);
        newCard.querySelector('[data=name]').innerText = card.playerName;
        newCard.querySelector('[data=number]').innerText = card.number;
        newCard.querySelector('[data=penalty]').innerText = card.penaltyPoints;
        sectionSelectedCards.appendChild(newCard);
    }
    if (game.selectedCards.length < game.players.length) {
        for (let i = 0; i < game.players.length - game.selectedCards.length; i++) {
            const newCard = templatePlayingCard.content.cloneNode(true);
            sectionSelectedCards.appendChild(newCard);
        }
    }
}

function refreshRows(game) {
    for (let i = 1; i <= 4; i++) {
        const row = document.getElementById(`row${i}`);
        if (game.poisonedRow === i) {
            row.classList.add('poisoned');
        } else {
            row.classList.remove('poisoned');
        }
        while (row.firstChild) {
            row.removeChild(row.firstChild);
        }
        const cards = game[`row${i}cards`];
        for (let card of cards) {
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('[data=number]').innerText = card.number;
            newCard.querySelector('[data=penalty]').innerText = card.penaltyPoints;
            if (game.poisonedRow === i) {
                newCard.querySelector('.playingcard').classList.add('poisoned');
            } else {
                newCard.querySelector('.playingcard').classList.remove('poisoned');
                if (game.lastPlacedCard && game.lastPlacedCard.number === card.number) {
                    newCard.querySelector('.playingcard').classList.add('selected');
                } else {
                    newCard.querySelector('.playingcard').classList.remove('selected');
                }
            }
            row.appendChild(newCard);
        }
        if (cards.length < 5) {
            for (let i = 0; i < 5 - cards.length; i++) {
                const newCard = templatePlayingCard.content.cloneNode(true);
                row.appendChild(newCard);
            }
        }
        if (cards.length < 6) {
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('.playingcard').classList.add('poison');
            if (game.playerToChooseRow && game.playerToChooseRow.name === playername) {
                newCard.querySelector('.playingcard').classList.add('selectable');
                newCard.querySelector('.playingcard').addEventListener('click', e => {
                    e.preventDefault();
                    doAction('chooseRow', { number: i })
                });
            }
            row.appendChild(newCard);
        }
    }
}

function refreshHandCards(playerState, game) {
    while (sectionHandcards.firstChild) {
        sectionHandcards.removeChild(sectionHandcards.firstChild);
    }
    if (playerState.cards) {
        for (let index = 0; index < playerState.cards.length; index++) {
            const card = playerState.cards[index];
            // @ts-ignore
            const newCard = templatePlayingCard.content.cloneNode(true);
            newCard.querySelector('[data=number]').innerText = card.number;
            newCard.querySelector('[data=penalty]').innerText = card.penaltyPoints;
            if (game.cardsSelectable) {
                newCard.querySelector('.playingcard').classList.add('selectable');
                newCard.querySelector('.playingcard').addEventListener('click', e => {
                    e.preventDefault();
                    console.log('click');
                    doAction('selectCard', { number: card.number });
                });
            }
            if (playerState.selectedCard && playerState.selectedCard.number === card.number) {
                newCard.querySelector('.playingcard').classList.add('selected');
            }
            sectionHandcards.appendChild(newCard);
        }
    }
}

function refreshPlayerList(game) {
    clearPlayers();
    game.players.forEach(player => {
        // @ts-ignore
        const newPlayer = templatePlayer.content.cloneNode(true);
        newPlayer.querySelector('[data=name]').innerText = player.isHost ? `${player.name} (HOST)` : player.name;
        newPlayer.querySelector('[data=score]').innerText = player.score;
        newPlayer.querySelector('[data=message]').innerText = player.message;
        if (player.connected) {
            newPlayer.querySelector('[data=connected]').innerText = 'connected';
            newPlayer.querySelector('[data=connected]').classList.add('green');
        }
        else {
            newPlayer.querySelector('[data=connected]').innerText = 'disconnected';
            newPlayer.querySelector('[data=connected]').classList.add('red');
        }
        newPlayer.querySelector('[data=boot]').addEventListener('click', e => {
            e.preventDefault();
            doAction('bootPlayer', { bootPlayer: player.name });
        });
        sectionPlayers.appendChild(newPlayer);
    });
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
            alert('Something went wrong, please refresh: ' + err);
            clearInterval(poller);
        });
}

initgame();