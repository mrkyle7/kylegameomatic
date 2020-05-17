const express = require('express');
const app = express();
const Player = require('./src/6nimmt/Player.js');
const Game = require('./src/6nimmt/Game.js');

/** @type {Game[]} */
const sixnimmtGames = [];

if (process.env.env === 'dev') {
    console.log('Creating test game');
    const player1 = new Player('kyle', 'pass', true);
    const player2 = new Player('sam', 'pass', false);

    const game = new Game('test', 'pass', player1);
    game.players.push(player2);
    sixnimmtGames.push(game);
}

app.use(express.static('web'));
app.use(express.json());
app.set('port', process.env.PORT || 8000);


app.get('/api/v1/health', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ isAvailable: true }));
});

app.get('/6nimmt/games', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(sixnimmtGames.map(g => g.toJson())));
});

app.get('/6nimmt/game/:name/:player', (req, res) => {
    const gamename = req.params.name;
    const playername = req.params.player;
    const playerpass = req.query.playerpass;

    const game = sixnimmtGames.find(g => g.name === gamename);
    const player = game.players.find(p => p.name === playername);

    if (!player) {
        res.status(400);
        res.send(`Player ${playername} is no longer in the game`);
    } else if (player.password !== playerpass) {
        res.status(403);
        res.send('Incorrect Player password')
    } else {
        player.resetTimeout();

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(game.toJson(playername)));
    }
});

app.post('/6nimmt/newGame', (req, res) => {
    const gamename = req.body.gamename;
    const gamepassword = req.body.gamepassword;
    const playername = req.body.playername;
    const playerpassword = req.body.playerpassword;

    if (!gamename.match(/[A-Za-z0-9]+/)
        || !gamepassword.match(/[A-Za-z0-9]+/)
        || !playername.match(/[A-Za-z0-9]+/)
        || !playerpassword.match(/[A-Za-z0-9]+/)) {
        res.status(400);
        res.send("Invalid details, please ensure all fields are filled in with only letters and numbers");
    } else if (sixnimmtGames.some(game => game.name === gamename)) {
        res.status(400);
        res.send("Game already exists with this name");
    } else {
        const host = new Player(playername, playerpassword, true);
        const game = new Game(gamename, gamepassword, host);
        sixnimmtGames.push(game);
        res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
    }

})

app.post('/6nimmt/joinGame', (req, res) => {
    const gamename = req.body.gamename;
    const gamepassword = req.body.gamepassword;
    const playername = req.body.playername;
    const playerpassword = req.body.playerpassword;

    const game = sixnimmtGames.find(g => g.name === gamename);
    const existingPlayer = game.players.find(p => p.name === playername);
    if (!game) {
        res.status(400);
        res.send("Game does not exist");
    } else if (game.password !== gamepassword) {
        res.status(403);
        res.send("Game password is incorrect");
    } else if (existingPlayer && existingPlayer.password !== playerpassword) {
        res.status(403);
        res.send("Player password is incorrect");
    } else if (existingPlayer) {
        res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
    } else if (game.started) {
        res.status(400);
        res.send("Game has already started");
    } else if (game.players.length === 10) {
        res.status(400);
        res.send("Game has the max 10 players");
    } else {
        const player = new Player(playername, playerpassword, false);
        game.players.push(player);
        res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
    }
})

app.post('/6nimmt/bootPlayer', (req, res) => {
    const gamename = req.body.gamename;
    const gamepassword = req.body.gamepassword;
    const playername = req.body.playername;
    const playerpassword = req.body.playerpassword;

    const bootPlayer = req.body.bootPlayer;

    const game = sixnimmtGames.find(g => g.name === gamename);
    const requestingPlayer = game.players.find(p => p.name === playername);
    if (game.password !== gamepassword) {
        res.status(403);
        res.send("Game password is incorrect");
    } else if (!requestingPlayer) {
        res.status(400);
        res.send('Requesting Player does not exist in game');
    } else if (requestingPlayer && requestingPlayer.password !== playerpassword) {
        res.status(403);
        res.send("Player password is incorrect");
    } else if (!requestingPlayer.isHost) {
        res.status(401);
        res.send("Only the host can boot players");
    } else {
        game.players = game.players.filter(p => p.name !== bootPlayer)
        res.sendStatus(200);
    }
})

app.post('/6nimmt/startGame', async (req, res) => {
    const gamename = req.body.gamename;
    const gamepassword = req.body.gamepassword;
    const playername = req.body.playername;
    const playerpassword = req.body.playerpassword;

    const game = sixnimmtGames.find(g => g.name === gamename);
    const requestingPlayer = game.players.find(p => p.name === playername);
    if (game.password !== gamepassword) {
        res.status(403);
        res.send("Game password is incorrect");
    } else if (!requestingPlayer) {
        res.status(400);
        res.send('Requesting Player does not exist in game');
    } else if (requestingPlayer && requestingPlayer.password !== playerpassword) {
        res.status(403);
        res.send("Player password is incorrect");
    } else if (!requestingPlayer.isHost) {
        res.status(401);
        res.send("Only the host can start the game");

    } else if (game.started) {
        res.status(400);
        res.send("Game has already started");
    }
    else {
        game.start();
        while (!game.started) {
            await new Promise((resolve) => {
                setTimeout(() => resolve(), 10)
            })
        }
        res.sendStatus(200);
    }
})

app.post('/6nimmt/selectCard', async (req, res) => {
    const gamename = req.body.gamename;
    const gamepassword = req.body.gamepassword;
    const playername = req.body.playername;
    const playerpassword = req.body.playerpassword;

    const selectedCardNumber = req.body.number;

    const game = sixnimmtGames.find(g => g.name === gamename);
    const requestingPlayer = game.players.find(p => p.name === playername);
    if (game.password !== gamepassword) {
        res.status(403);
        res.send("Game password is incorrect");
    } else if (!requestingPlayer) {
        res.status(400);
        res.send('Requesting Player does not exist in game');
    } else if (requestingPlayer && requestingPlayer.password !== playerpassword) {
        res.status(403);
        res.send("Player password is incorrect");
    } else if (!game.cardsSelectable) {
        res.status(400);
        res.send("You cannot select cards right now");
    } else if (!requestingPlayer.cards.some(c => c.number === selectedCardNumber)) {
        res.status(400);
        res.send("You don't have this card!");
    }
    else {
        const card = requestingPlayer.cards.find(c => c.number === selectedCardNumber);
        game.selectCard(requestingPlayer, card);
        res.sendStatus(200);
    }
})

app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});