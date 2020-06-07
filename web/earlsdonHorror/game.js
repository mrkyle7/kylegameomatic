// @ts-ignore
const gamename = decodeURIComponent(window.location.search.match(/(\?|&)game\=([^&]*)/)[2]);
const gamepass = decodeURIComponent(window.location.search.match(/(\?|&)gamepass\=([^&]*)/)[2]);
const playername = decodeURIComponent(window.location.search.match(/(\?|&)playername\=([^&]*)/)[2]);
const playerpass = decodeURIComponent(window.location.search.match(/(\?|&)playerpassword\=([^&]*)/)[2]);

const gamemessage = document.getElementById('gamemessage');
const playersWaiting = document.getElementById('playersWaiting');

const buttonStartGame = document.getElementById('startgame');

const sectionPlayers = document.getElementById('players');

const templatePlayer = document.getElementById('player');

const initgame = () => {
    startPolling();
    buttonStartGame.addEventListener('click', (e) => {
        e.preventDefault();
        doAction('startGame');
    });
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

    if (!game.started) {
        playersWaiting.innerText = game.players.map(p => p.name).join(', ');
        sectionPlayers.classList.add('hidden');
    } else {
        playersWaiting.classList.add('hidden');
        sectionPlayers.classList.remove('hidden');
    }

    if (game.isNight) {
        document.querySelector('html').classList.add('night');
        document.querySelector('html').classList.remove('day');
    } else {
        document.querySelector('html').classList.remove('night');
        document.querySelector('html').classList.add('day');
    }


    gamemessage.innerText = playerState.message;


    refreshPlayerList(game, playerState);

    if (playerState.isHost && !game.started) {
        buttonStartGame.classList.remove('hidden');
    } else {
        buttonStartGame.classList.add('hidden')
    }
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

function refreshPlayerList(game, playerState) {
    clearPlayers();
    game.players.forEach(player => {
        // @ts-ignore
        const newPlayer = templatePlayer.content.cloneNode(true);
        if (player.isDead) {
            newPlayer.querySelector('div').classList.add('dead');
        }
        newPlayer.querySelector('[data=name]').innerText = player.name;
        newPlayer.querySelector('[data=role]').innerText = player.role;
        if (playerState.canVote && player.voteCount > 0) {
            newPlayer.querySelector('[data=votes]').innerText = 'votes: ' + player.voteCount;
            if (game.isNight && playerState.role === 'werewolf') {
                newPlayer.querySelector('div').classList.add('killed');
            } else {
                newPlayer.querySelector('div').classList.add('selected');
            }
        } else {
            newPlayer.querySelector('[data=votes]').classList.add('hidden');
        }


        if (playerState.canVote && player.canBeVotedFor) {
            newPlayer.querySelector('button').classList.remove('hidden');
            newPlayer.querySelector('button').innerText = playerState.voteVerb;
            newPlayer.querySelector('button').addEventListener('click', e => {
                e.preventDefault();
                doAction('vote', { personName: player.name });
            })
        } else {
            newPlayer.querySelector('button').classList.add('hidden');
        }
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