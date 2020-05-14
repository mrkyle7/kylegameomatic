const express = require('express');
const app = express();
const Player = require('./src/6nimmt/Player.js');
const Game = require('./src/6nimmt/Game.js');

/** @type {Game[]} */
const sixnimmtGames = [];

app.use(express.static('web'));
app.use(express.json());
app.set('port', process.env.PORT || 8000);


app.get('/api/v1/health', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ isAvailable: true }));
});

app.get('/6nimmt/games', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const stringified = JSON.stringify(sixnimmtGames);
    const noPass= stringified.replace(/"password":".*?"/g, '"password":"xxx"');
    res.send(noPass);
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
        res.sendStatus(200);
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
        res.sendStatus(200);
    } else {
        const player = new Player(playername, playerpassword, false);
        game.players.push(player);
        res.sendStatus(200);
    }

})

app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});