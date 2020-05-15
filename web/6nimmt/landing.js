const sectionCurrentGames = document.getElementById('currentGames');
const templateCurrentGame = document.getElementById('currentGame');
const templateplayer = document.getElementById('player');

const formGameName = document.getElementById('gamename');
const formGamePass = document.getElementById('gamepassword');
const formPlayerName = document.getElementById('playername');
const formPlayerPass = document.getElementById('playerpassword');

const buttonCreateGame = document.getElementById('createGame');

const init = () => {
    refreshGameList();
    buttonCreateGame.addEventListener('click', e => {
        e.preventDefault();
        fetch('newGame', {
            method: 'POST',
            body: JSON.stringify({
                gamename: formGameName.value,
                gamepassword: formGamePass.value,
                playername: formPlayerName.value,
                playerpassword: formPlayerPass.value
            }),
            headers: {
                "Content-Type": "application/json"
            },
            redirect: 'follow'
        })
            .then(async response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    const error = await response.text();
                    alert(error);
                }
            })
            .catch(err => {
                alert(err);
            })
    })
}

init();

// Functions

const clearCreateForm = () => {
    formGameName.value = '';
    formGamePass.value = '';
    formPlayerName.value = '';
    formPlayerPass.value = '';
}

function refreshGameList() {
    console.log("fetching current game list");
    fetch("games")
        .then(resp => {
            return resp.json();
        })
        .then(json => {
            while (sectionCurrentGames.firstChild) {
                sectionCurrentGames.removeChild(sectionCurrentGames.firstChild)
            }
            json.forEach(game => {
                // @ts-ignore
                const currentGame = templateCurrentGame.content.cloneNode(true);
                currentGame.querySelector('[data=title]').innerText = game.name;
                game.players.forEach(player => {
                    // @ts-ignore
                    const newPlayer = templateplayer.content.cloneNode(true);
                    const name = player.isHost ? `${player.name} (HOST)` : player.name;
                    newPlayer.querySelector('[data=playerName]').innerText = name;
                    currentGame.querySelector('[data=currentPlayers]').appendChild(newPlayer);
                })
                const gameDiv = currentGame.querySelector('div');
                currentGame.querySelector("[data=joinGame]").addEventListener('click', e => {
                    e.preventDefault();
                    fetch('joinGame', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            gamename: game.name,
                            gamepassword: gameDiv.querySelector('[data=gamepassword]').value,
                            playername: gameDiv.querySelector('[data=playername]').value,
                            playerpassword: gameDiv.querySelector('[data=playerpassword]').value
                        }),
                        redirect: 'follow'
                    })
                        .then(async response => {
                            if (response.redirected) {
                                window.location.href = response.url;
                            } else {
                                const error = await response.text();
                                alert(error);
                            }
                        })
                        .catch(err => {
                            alert(err);
                        })
                })
                sectionCurrentGames.appendChild(currentGame);
            });
        });
}
