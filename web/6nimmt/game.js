const gamename = decodeURIComponent(window.location.search.match(/(\?|&)game\=([^&]*)/)[2]);
const gamepass = decodeURIComponent(window.location.search.match(/(\?|&)gamepass\=([^&]*)/)[2]);
const playername = decodeURIComponent(window.location.search.match(/(\?|&)playername\=([^&]*)/)[2]);
const playerpass = decodeURIComponent(window.location.search.match(/(\?|&)playerpassword\=([^&]*)/)[2]);

const title = document.getElementById('title');
const playermessage = document.getElementById('playermessage');
const gamemessage = document.getElementById('gamemessage');

const sectionPlayers = document.getElementById('players');

const templatePlayer = document.getElementById('player');

const initgame = () => {
    startPolling();
}

let latestVersion;
let poller;

// functions

const startPolling = () => {
    poller = setInterval(() => {
        pollAndUdpate();
    }, 500)
}

const processGameState = (state) => {
    console.log('Processing new state', state);

    const playerState = state.players.find(p => p.name === playername)

    title.innerText = `Hello ${playername}, you are playing in game: ${state.name}`;

    playermessage.innerText = playerState ? playerState.message : 'You left the game!';
    gamemessage.innerText = state.message;

    clearPlayers();
    state.players.forEach(player => {
        // @ts-ignore
        const newPlayer = templatePlayer.content.cloneNode(true);
        newPlayer.querySelector('[data=name]').innerText = player.isHost ? `${player.name} (HOST)` : player.name;
        newPlayer.querySelector('[data=score]').innerText = player.score;
        newPlayer.querySelector('[data=message]').innerText = player.message;
        if (player.connected) {
            newPlayer.querySelector('[data=connected]').innerText = 'connected';
            newPlayer.querySelector('[data=connected]').classList.add('green');
        } else {
            newPlayer.querySelector('[data=connected]').innerText = 'disconnected';
            newPlayer.querySelector('[data=connected]').classList.add('red');
        }

        newPlayer.querySelector('[data=boot]').addEventListener('click', e => {
            e.preventDefault();
            doAction('bootPlayer', { bootPlayer: player.name });
        })
        sectionPlayers.appendChild(newPlayer);
    })

}

const clearPlayers = () => {
    while (sectionPlayers.firstChild) {
        sectionPlayers.removeChild(sectionPlayers.firstChild)
    }
}

const doAction = (action, body) => {
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

function pollAndUdpate() {
    fetch(`game/${gamename}/${playername}?playerpass=${playerpass}`)
        .then(async (response) => {
            if (response.status !== 200) {
                const err = await response.text()
                alert('Something went wrong, please refresh: ' + err);
                clearInterval(poller);
            } else {
                const eTag = response.headers.get('ETag');
                if (response.headers.get('ETag') !== latestVersion) {
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