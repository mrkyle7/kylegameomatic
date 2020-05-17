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
    cardsSelectable = false;
    /** @type {Player} */
    playerToChooseRow;

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

    rows = [this.row1cards, this.row1cards, this.row3cards, this.row4cards];

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


        for (let index = 0; index < this.players.length; index++) {
            const player = this.players[index];
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
    }

    /**
     * @param {Player} player
     * @param {Card} card
     */
    selectCard(player, card) {
        player.selectedCard = card;
        player.message = '';

        if (!this.players.some(p => p.selectedCard === undefined)) {
            this.cardsSelectable = false;
            this.message = '';
            this.playTheCards();
        }
    }

    playTheCards() {
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

        const lowestRowNumber = this.rows.reduce((number, row) => {
            const endOfRowNumber = row[row.length - 1].number;
            if (number < endOfRowNumber) {
                return number;
            } else {
                return endOfRowNumber;
            }
        }, 105);

        if (lowestRowNumber > this.selectedCards[0].number) {
            this.message = `${this.selectedCards[0].playerName} needs to choose their poison!`;
            const playerToChoose = this.players.find(p => p.name === this.selectedCards[0].playerName);
            playerToChoose.message = 'Choose your poison!';
            this.playerToChooseRow = playerToChoose;
        } else {
            this.fillTheRows();
        }
    }

    fillTheRows() {
        this.message = 'Filling the rows';
        this.players.forEach(p => p.message = '');
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
            cardsSelectable: this.cardsSelectable,
            playerToChooseRow: this.playerToChooseRow ? this.playerToChooseRow.toJson() : undefined,
            selectedCards: this.selectedCards.map(c => c.toJson()),
            row1cards: this.row1cards.map(c => c.toJson()),
            row2cards: this.row2cards.map(c => c.toJson()),
            row3cards: this.row3cards.map(c => c.toJson()),
            row4cards: this.row4cards.map(c => c.toJson())
        }
    }
}

module.exports = Game;