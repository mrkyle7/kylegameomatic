const Card = require('../Card.js');
const Player = require('../Player.js');
const Game = require('../Game.js');

const possibleNames = ['Senor Randomista', 'Monsieur Randomo', 'Mr. Randomson', 'Mlle Radomina', 'Little Miss Random',
    'Mrs. Randomson', 'Madame Rando', 'Herr Randomchen', 'Lord Randomo', 'Sir Randomo'];

class RandomBot {

    /** @type {Game} */
    game;

    /** @type {Player} */
    player;

    /** @type {any} */
    poller;

    /**
     * @param {Game} game
     */
    constructor(game) {
        this.game = game;
        const availableNames = possibleNames.filter(name => !this.game.players.some(p => p.name === name));
        const name = availableNames[Math.round(Math.random() * (availableNames.length - 1))];
        this.player = new Player(name, Math.random().toString(), false);
        this.game.players.push(this.player);
        this.poller = setInterval(() => {
            this.player.resetTimeout();
            if (this.game.gameOver) {
                clearInterval(this.poller);
            } else {
                if (this.game.cardsSelectable && this.player.selectedCard === undefined) {
                    const chosenCard = this.player.cards[Math.round(Math.random() * (this.player.cards.length - 1))];
                    console.log(`${this.player.name} is choosing card ${chosenCard.toJson()}`);
                    
                    this.game.selectCard(this.player, chosenCard)
                } else if (this.game.playerToChooseRow === this.player) {

                    let lowestIndexes = [];
                    let lowestPoints = 10000;
                    for (let index = 0; index < this.game.rows.length; index++) {
                        const nextRow = this.game.rows[index];
                        const pointsInRow = nextRow.reduce(
                            /**
                             * @param {any} sum
                             * @param {Card} card
                             * @param {number} idx
                             */
                            (sum, card, idx) => {
                                if (idx < 5) {
                                    return sum + card.penaltyPoints
                                } else {
                                    return sum
                                }
                            },
                            0);
                        if (pointsInRow === lowestPoints) {
                            lowestIndexes.push(index);
                        } else if (pointsInRow < lowestPoints) {
                            lowestIndexes = [index];
                            lowestPoints = pointsInRow;
                        }
                    }
                    const chosenRow = lowestIndexes[Math.round(Math.random() * (lowestIndexes.length - 1))] + 1;
                    console.log(`${this.player.name} is choosing row ${chosenRow}`);
                    this.game.selectRow(this.player, chosenRow)
                }
            }
        }, 100);
    }
}

module.exports = RandomBot