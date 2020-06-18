const Card = require('./Card.js');

const Player = require('./Player.js')

class Game {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    /** @type {Player} */
    host;
    /** @type {Player[]} */
    players = [];
    message = 'Waiting to Start';
    started = false;
    gameOver = false;
    /** @type {Player[]} */
    winners;
    cardsSelectable = false;
    /** @type {Player} */
    playerToChooseRow;

    /** @type {number} */
    poisonedRow;

    /** @type {Card} */
    lastPlacedCard = undefined;

    /** @type {Card[]} */
    selectedCards = [];

    /** @type {Card[]} */
    row1cards = [];
    /** @type {Card[]} */
    row2cards = [];
    /** @type {Card[]} */
    row3cards = [];
    /** @type {Card[]} */
    row4cards = [];

    rows = [this.row1cards, this.row2cards, this.row3cards, this.row4cards];

    /**
     * @param {string} name
     * @param {string} password
     * @param {Player} host
     */
    constructor(name, password, host) {
        this.name = name;
        this.password = password;
        this.host = host;
        this.players.push(host);
    }

    start() {
        try {
            const randomSortedCards = [];

            for (let number = 1; number <= 104; number++) {
                const card = new Card(number)
                randomSortedCards.push(card)
            }

            randomSortedCards.sort((a, b) => {
                if (a.sortId < b.sortId) return 1;
                if (a.sortId > b.sortId) return -1;
                return 0
            })

            this.row1cards.push(randomSortedCards.splice(0, 1)[0]);
            this.row2cards.push(randomSortedCards.splice(0, 1)[0]);
            this.row3cards.push(randomSortedCards.splice(0, 1)[0]);
            this.row4cards.push(randomSortedCards.splice(0, 1)[0]);


            for (let player of this.players) {
                const playerHand = randomSortedCards.splice(0, 10);
                playerHand.sort((a, b) => {
                    if (a.number > b.number) return 1;
                    if (a.number < b.number) return -1;
                    return 0
                });
                player.cards = playerHand.map(card => {
                    card.playerName = player.name;
                    return card
                });
                player.message = 'Select a card';
            }

            this.message = 'Waiting for players to select a card';
            this.cardsSelectable = true;
            this.started = true;
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    /**
     * @param {Player} player
     * @param {Card} card
     */
    selectCard(player, card) {
        try {
            player.selectedCard = card;
            player.message = '';

            if (this.players.every(p => p.selectedCard)) {
                this.cardsSelectable = false;
                this.message = '';
                this.playTheCards();
            }
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    /**
     * @param {Player} player
     * @param {number} row
     */
    selectRow(player, row) {
        try {

            this.playerToChooseRow = undefined;
            this.poisonedRow = row;
            const penaltyPoints = this[`row${row}cards`].reduce(
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
            player.message = `You took ${penaltyPoints} penalty Points!`;
            this.message = `${player.name} took ${penaltyPoints} penalty Points!`;
            player.score = player.score - penaltyPoints;
            this.players.sort((a, b) => {
                if (a.score > b.score) return -1;
                if (a.score < b.score) return 1;
                return 0
            })
            this.fillTheRows()
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    playTheCards() {
        try {
            this.selectedCards = this.players.reduce((cards, player) => {
                cards.push(player.selectedCard)
                return cards;
            }, []);
            this.selectedCards.sort((a, b) => {
                if (a.number > b.number) return 1;
                if (a.number < b.number) return -1;
                return 0
            });
            for (let player of this.players) {
                player.cards = player.cards.filter(c => c.number !== player.selectedCard.number);
                player.selectedCard = undefined;
            }

            console.log('computing lowest row number');
            const lowestRowNumber = this.rows.reduce((number, row) => {
                const endOfRowNumber = row[row.length - 1].number;
                console.log(row, `${row}: last: ${endOfRowNumber} Current lowest: ${number}`);
                if (number < endOfRowNumber) {
                    console.log(`now lowest is ${number}`)
                    return number;
                } else {
                    console.log(`now lowest is ${endOfRowNumber}`)
                    return endOfRowNumber;
                }
            }, 105);

            console.log(`Lowest number: ${lowestRowNumber}`);

            if (lowestRowNumber > this.selectedCards[0].number) {
                console.log(`${this.selectedCards[0].number} is lower than lowest row`);
                this.message = `${this.selectedCards[0].playerName} needs to choose their poison!`;
                const playerToChoose = this.players.find(p => p.name === this.selectedCards[0].playerName);
                playerToChoose.message = 'Choose your poison!';
                this.playerToChooseRow = playerToChoose;
            } else {
                this.message = 'Filling the rows';
                console.log('fill the rows')
                this.players.forEach(p => p.message = '');
                this.fillTheRows();
            }
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    fillTheRows() {
        setTimeout(() => {
            try {
                if (this.poisonedRow) {
                    console.log('row is poisoned, clear it')
                    const row = this[`row${this.poisonedRow}cards`];
                    if (row.length === 6) {
                        this.lastPlacedCard = row[row.length - 1];
                        this[`row${this.poisonedRow}cards`] = [row[row.length - 1]]
                    } else {
                        const card = this.selectedCards.splice(0, 1)[0]
                        this.lastPlacedCard = card
                        this[`row${this.poisonedRow}cards`] = [card]
                    }
                    this.poisonedRow = undefined;
                    this.rows = [this.row1cards, this.row2cards, this.row3cards, this.row4cards];

                    return this.fillTheRows();
                }

                if (this.selectedCards.length > 0) {
                    this.message = 'Filling the rows';
                    this.players.forEach(p => p.message = '');

                    console.log('placing next card');

                    const nextCard = this.selectedCards[0];
                    const rowToPlace = this.rows.reduce((row, nextRow) => {
                        const nextLastCardNumber = nextRow[nextRow.length - 1].number;
                        console.log('current row:', row);
                        console.log(`Checking ${nextLastCardNumber} against next card: ${nextCard}`);
                        if (nextLastCardNumber < nextCard.number
                            && (!row || nextLastCardNumber > row[row.length - 1].number)) {
                            return nextRow;
                        } else {
                            return row;
                        }
                    }, undefined)

                    if (!rowToPlace) {
                        this.message = `${nextCard.playerName} needs to choose their poison!`;
                        const playerToChoose = this.players.find(p => p.name === nextCard.playerName);
                        playerToChoose.message = 'Choose your poison!';
                        this.playerToChooseRow = playerToChoose;
                        return;
                    }

                    rowToPlace.push(nextCard);
                    this.selectedCards.splice(0, 1);

                    this.lastPlacedCard = nextCard;

                    if (rowToPlace.length === 6) {
                        console.log('Filled a row- poison it!')
                        return this.selectRow(this.players.find(p => p.name === rowToPlace[5].playerName),
                            this.rows.findIndex(r => r === rowToPlace) + 1);
                    }

                    if (this.selectedCards.length > 0) {
                        console.log('More to fill!')
                        return this.fillTheRows();
                    }
                }

                if (this.players[0].cards.length === 1) {
                    console.log('auto play last card');
                    this.players.forEach(player => {
                        this.selectCard(player, player.cards[0]);
                    })
                } else if (this.players[0].cards.length === 0) {
                    if (this.players.some(p => p.score <= 0)) {
                        console.log('game over!')
                        const highestScore = this.players.reduce((highest, player) => {
                            if (player.score > highest) {
                                return player.score
                            } else {
                                return highest;
                            }
                        }, -9999999);
                        const winners = this.players.filter(p => p.score === highestScore);
                        console.log(`Winners: ${winners}, score: ${highestScore}`);
                        this.winners = winners;
                        if (winners.length === 1) {
                            this.message = `${winners[0].name} is the winner!`;
                            winners[0].message = 'You won!'
                            this.gameOver = true;
                        } else {
                            this.message = `${winners.map(w => w.name).join(' and ')} are joint winners!`;
                            winners.forEach(w => w.message = 'You are a joint winner!');
                            this.gameOver = true;
                        }
                    } else {
                        console.log('start next round');
                        this.message = 'Starting next round';
                        this.row1cards = []
                        this.row2cards = []
                        this.row3cards = []
                        this.row4cards = []
                        this.rows = [this.row1cards, this.row2cards, this.row3cards, this.row4cards];
                        this.start();
                    }
                } else {
                    console.log('all cards filled - waiting for next')
                    this.message = 'Waiting for players to select a card';
                    this.cardsSelectable = true;
                    this.players.forEach(player => player.message = 'Select a card')
                }
            } catch (err) {
                console.error(err)
                this.message = 'Error occured! ' + err;
            }
        }, 2000)

    }

    /**
     * @param {Player} player
     */
    bootPlayer(player) {
        try {
            if (this.cardsSelectable || this.playerToChooseRow || !this.started) {
                if (player.isHost && this.players.length > 1) {
                    this.players.find(p => !p.isHost).isHost = true;
                }
                this.players = this.players.filter(p => p !== player);
                if (this.players.every(p => p.selectedCard)) {
                    this.cardsSelectable = false;
                    this.message = '';
                    this.playTheCards();
                } else if (player === this.playerToChooseRow) {
                    this.playerToChooseRow = undefined;
                    this.selectedCards.splice(0, 1);
                    this.fillTheRows();
                }
            }
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }


    /**
     * @param {string} [name]
     */
    toJson(name) {
        return {
            name: this.name,
            host: this.host.toJson(name),
            players: this.players.map(p => p.toJson(name)),
            message: this.message,
            started: this.started,
            gameOver: this.gameOver,
            cardsSelectable: this.cardsSelectable,
            playerToChooseRow: this.playerToChooseRow ? this.playerToChooseRow.toJson() : undefined,
            poisonedRow: this.poisonedRow,
            lastPlacedCard: this.lastPlacedCard ? this.lastPlacedCard.toJson() : undefined,
            selectedCards: this.selectedCards.map(c => c.toJson()),
            row1cards: this.row1cards.map(c => c.toJson()),
            row2cards: this.row2cards.map(c => c.toJson()),
            row3cards: this.row3cards.map(c => c.toJson()),
            row4cards: this.row4cards.map(c => c.toJson()),
            rows: this.rows.map(row => row.map(c => c.toJson()))
        }
    }
}

module.exports = Game;