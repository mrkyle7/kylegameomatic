const Player = require("./Player");
const Game = require("./Game");
const Meld = require("./Meld");

const setupBeziqueRoutes = (app) => {

    /** @type {Game[]} */
    const beziqueGames = [];

    if (process.env.env === 'dev') {
        console.log('Creating test game');
        const player1 = new Player('kyle', 'pass', true);
        // player1.score = 1;
        const player2 = new Player('sam', 'pass', false);
        const game = new Game('test', 'pass', player1);
        game.players.push(player2);
        beziqueGames.push(game);

    }

    app.get('/Bezique/games', (req, res) => {
        while (beziqueGames.findIndex(g => g.players.length === 0) !== -1) {
            beziqueGames.splice(beziqueGames.findIndex(g => g.players.length === 0), 1)
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(beziqueGames.map(g => g.toJson())));
    });

    app.get('/Bezique/game/:name/:player', (req, res) => {
        const gamename = req.params.name;
        const playername = req.params.player;
        const playerpass = req.query.playerpass;

        const game = beziqueGames.find(g => g.name === gamename);
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
            res.send(JSON.stringify(game.toJson(playername)));
        }
    });

    app.post('/Bezique/newGame', (req, res) => {
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
        } else if (beziqueGames.some(game => game.name === gamename)) {
            res.status(400);
            res.send("Game already exists with this name");
        } else {
            const host = new Player(playername, playerpassword, true);
            const game = new Game(gamename, gamepassword, host);
            beziqueGames.push(game);
            res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
        }

    })

    app.post('/Bezique/joinGame', (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = beziqueGames.find(g => g.name === gamename);
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
        } else if (game.players.length === 2) {
            res.status(400);
            res.send("Game has the max 2 players");
        } else {
            const player = new Player(playername, playerpassword, false);
            game.players.push(player);
            res.redirect(`game.html?game=${game.name}&gamepass=${game.password}&playername=${playername}&playerpassword=${playerpassword}`);
        }
    })

    app.post('/Bezique/startGame', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = beziqueGames.find(g => g.name === gamename);
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

    app.post('/Bezique/selectCard', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const selectedCardId = req.body.id;

        const game = beziqueGames.find(g => g.name === gamename);
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
        } else if (!(requestingPlayer.cardsSelectableForTrick || requestingPlayer.cardsSelectableForMeld)) {
            res.status(400);
            res.send("You cannot select cards right now");
        } else if (!requestingPlayer.cards.some(c => c.id === selectedCardId)
            && !requestingPlayer.cardsPlayedForMelds.some(c => c.id === selectedCardId)) {
            res.status(400);
            res.send("You don't have this card!");
        }
        else {
            let card = requestingPlayer.cards.find(c => c.id === selectedCardId);
            if (!card) {
                card = requestingPlayer.cardsPlayedForMelds.find(c => c.id === selectedCardId);
            }

            if (requestingPlayer.cardsSelectableForTrick) {
                game.selectCardForTrick(requestingPlayer, card);
            } else {
                game.selectCardForMeld(requestingPlayer, card)
            }
            res.sendStatus(200);
        }
    })

    app.post('/Bezique/playCard', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = beziqueGames.find(g => g.name === gamename);
        const requestingPlayer = game.players.find(p => p.name === playername);
        if (game.password !== gamepassword) {
            res.status(403);
            res.send("Game password is incorrect");
            return
        } else if (!requestingPlayer) {
            res.status(400);
            res.send('Requesting Player does not exist in game');
            return
        } else if (requestingPlayer && requestingPlayer.password !== playerpassword) {
            res.status(403);
            res.send("Player password is incorrect");
            return
        } else if (!(requestingPlayer.cardsSelectableForTrick || requestingPlayer.cardsSelectableForMeld)) {
            res.status(400);
            res.send("You cannot play cards for tricks right now");
            return
        } else if (!(requestingPlayer.selectedCardForTrick || requestingPlayer.selectedCardsForMeld.length > 0)) {
            res.status(400);
            res.send("You haven't selected a card");
            return
        } else if (requestingPlayer.cardsSelectableForTrick && game.lastRounds && requestingPlayer === game.secondPlayer) {
            let couldWinTrick = false
            const allPlayerCards = requestingPlayer.cards.concat(requestingPlayer.cardsPlayedForMelds)
            if (allPlayerCards.some(c => c.suit === game.leadPlayer.cardPlayedForTrick.suit &&
                c.value > game.leadPlayer.cardPlayedForTrick.value)) {
                couldWinTrick = true
            }
            if (game.leadPlayer.cardPlayedForTrick.suit !== game.trumpCard.suit &&
                allPlayerCards.some(c => c.suit === game.trumpCard.suit) &&
                allPlayerCards.every(c => c.suit !== game.leadPlayer.cardPlayedForTrick.suit)) {
                couldWinTrick = true
            }
            let doesWinTrick = false;
            if (requestingPlayer.selectedCardForTrick.suit === game.leadPlayer.cardPlayedForTrick.suit &&
                requestingPlayer.selectedCardForTrick.value > game.leadPlayer.cardPlayedForTrick.value) {
                doesWinTrick = true
            }
            if (game.leadPlayer.cardPlayedForTrick.suit !== game.trumpCard.suit &&
                requestingPlayer.selectedCardForTrick.suit === game.trumpCard.suit) {
                doesWinTrick = true
            }
            if (allPlayerCards.some(c => c.suit === game.leadPlayer.cardPlayedForTrick.suit) &&
                requestingPlayer.selectedCardForTrick.suit !== game.leadPlayer.cardPlayedForTrick.suit) {
                res.status(400)
                res.send("You must follow suit!")
                return
            } else if (couldWinTrick && !doesWinTrick) {
                res.status(400)
                res.send("You must win the trick if you can!")
                return
            }
        }
        if (requestingPlayer.cardsSelectableForTrick) {
            game.playCardForTrick(requestingPlayer, requestingPlayer.selectedCardForTrick);
            res.sendStatus(200);
        } else {
            const meld = new Meld(requestingPlayer.selectedCardsForMeld, game.trumpCard);
            if (!meld.isValid()) {
                res.status(400)
                res.send(meld.invalidReason)
            } else {
                game.playCardsForMeld(meld, requestingPlayer)
                res.sendStatus(200);
            }
        }
    })

    app.post('/Bezique/pickUpCard', async (req, res) => {
        const gamename = req.body.gamename;
        const gamepassword = req.body.gamepassword;
        const playername = req.body.playername;
        const playerpassword = req.body.playerpassword;

        const game = beziqueGames.find(g => g.name === gamename);
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
        } else if (!(requestingPlayer.cardsSelectableForMeld)) {
            res.status(400);
            res.send("You cannot pick up a card right now!");
        }
        else {
            game.pickUpCard()
            res.sendStatus(200);
        }
    })
}

module.exports = setupBeziqueRoutes