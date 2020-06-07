
const Player = require("./Player");
const Game = require("./Game");

const setupearlsdonHorrorRoutes = (app) => {

    /** @type {Game[]} */
    const earlsdonHorrorGames = [];

    if (process.env.env === 'dev') {
        console.log('Creating test game');
        const player1 = new Player('kyle', 'pass', true);
        // player1.score = 1;
        const player2 = new Player('sam', 'pass', false);
        // player2.score = 1;
        const player21 = new Player('sam1', 'pass', false);
        const player22 = new Player('sam2', 'pass', false);
        const player23 = new Player('sam3', 'pass', false);
        const player24 = new Player('sam4', 'pass', false);
        const player25 = new Player('sam5', 'pass', false);
        const player26 = new Player('sam6', 'pass', false);
        const player27 = new Player('sam7', 'pass', false);
        const player28 = new Player('sam8', 'pass', false);

        const game = new Game('test', 'pass', player1);
        game.players.push(player2);
        game.players.push(player21);
        game.players.push(player22);
        game.players.push(player23);
        // game.players.push(player24);
        // game.players.push(player25);
        // game.players.push(player26);
        // game.players.push(player27);
        // game.players.push(player28);
        earlsdonHorrorGames.push(game);


    }

    app.get('/earlsdonHorror/games', (req, res) => {
        while (earlsdonHorrorGames.findIndex(g => g.players.length === 0) !== -1) {
            earlsdonHorrorGames.splice(earlsdonHorrorGames.findIndex(g => g.players.length === 0), 1)
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(earlsdonHorrorGames.map(g => g.toJson())));
    });

    app.get('/earlsdonHorror/game/:name/:player', (req, res) => {
        const gamename = req.params.name;
        const playername = req.params.player;
        const playerpass = req.query.playerpass;

        const game = earlsdonHorrorGames.find(g => g.name === gamename);
        let player;
        if (game) {
            player = game.players.find(p => p.name === playername);
        }

        if (!game) {
            res.status(400);
            res.send(`Game ${gamename} does not exist`);

        } else if (!player) {
            res.status(400);
            res.send(`Player ${playername} is no longer in the game`);
        } else if (player.password !== playerpass) {
            res.status(403);
            res.send('Incorrect Player password')
        } else {
            player.resetTimeout();

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(game.toJson(player)));
        }
    });

    app.post('/earlsdonHorror/newGame', (req, res) => {
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
        } else if (earlsdonHorrorGames.some(game => game.name === gamename)) {
            res.status(400);
            res.send("Game already exists with this name");
        } else {
            const host = new Player(playername, playerpassword, true);
            const game = new Game(gamename, gamepassword, host);
            earlsdonHorrorGames.push(game);
            res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
        }

    })

    app.post('/earlsdonHorror/joinGame', (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = earlsdonHorrorGames.find(g => g.name === gamename);
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

    app.post('/earlsdonHorror/startGame', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = earlsdonHorrorGames.find(g => g.name === gamename);
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

    app.post('/earlsdonHorror/vote', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const votedName = req.body.personName;

        const game = earlsdonHorrorGames.find(g => g.name === gamename);
        const requestingPlayer = game.players.find(p => p.name === playername);
        const votedPerson = game.players.find(p => p.name === votedName);
        if (game.password !== gamepassword) {
            res.status(403);
            res.send("Game password is incorrect");
        } else if (!requestingPlayer) {
            res.status(400);
            res.send('Requesting Player does not exist in game');
        } else if (requestingPlayer && requestingPlayer.password !== playerpassword) {
            res.status(403);
            res.send("Player password is incorrect");
        } else if (!requestingPlayer.canVote) {
            res.status(400);
            res.send("You cannot vote right now");
        } else if (!votedPerson) {
            res.status(400);
            res.send("The person you voted for does not exist");
        } else if (!votedPerson.canBeVotedFor(requestingPlayer, game.isNight, game.gameOver)) {
            res.status(400);
            res.send("You cannot vote for this person");
        }
        else {
            game.vote(requestingPlayer, votedPerson);
            res.sendStatus(200);
        }
    })

    async function printResults(trialGames) {
        while (trialGames.some(g => !g.gameOver)) {
            await new Promise((resolve) => {
                setTimeout(() => resolve(), 10);
            });
        }
        console.log(trialGames.reduce((results, game) => {
            game.winners.forEach(winner => {
                results[winner.name] = results[winner.name] ? results[winner.name] + 1 : 1;
            });
            return results;
        }, {}));
    }
}

module.exports = setupearlsdonHorrorRoutes