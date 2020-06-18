const Card = require("./Card");

class Player {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    /** @type {boolean} */
    isHost;
    score = 0;
    connected = false;
    /** @type {NodeJS.Timeout} */
    timeoutTimer;

    /** @type {Card} */
    selectedCardForTrick;
    /** @type {Card} */
    cardPlayedForTrick;
    cardsSelectableForTrick = false;

    /** @type {Card[]} */
    selectedCardsForMeld = [];
    /** @type {Card[]} */
    cardsPlayedForMelds = [];
    cardsSelectableForMeld = false;

    /** @type {Card[]} */
    cardsWonFromTricks = []


    /** @type {Card[]} */
    cards = []

    /**
     * @param {string} name
     * @param {string} password
     * @param {boolean} isHost
     */
    constructor(name, password, isHost) {
        this.name = name;
        this.password = password;
        this.isHost = isHost;
        this.resetTimeout()
    }

    resetTimeout() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        this.connected = true;
        this.timeoutTimer = setTimeout(() => {
            this.connected = false;
        }, 5000);
    }

    /**
     * @param {string} [name]
     */
    toJson(name) {
        let cards = [];
        let selectedCardForTrick;
        let selectedCardsForMeld;
        let cardsWonFromTricks;
        if (name && name === this.name) {
            cards = this.cards.map(c => c.toJson());
            selectedCardForTrick = this.selectedCardForTrick ? this.selectedCardForTrick.toJson() : undefined;
            selectedCardsForMeld = this.selectedCardsForMeld.map(c => c.toJson())
            cardsWonFromTricks = this.cardsWonFromTricks.map(c => c.toJson());
        }
        return {
            name: this.name,
            isHost: this.isHost,
            score: this.score,
            connected: this.connected,
            cards: cards,
            numberCardsInHand: this.cards.length,
            numberCardsWonFromTricks: this.cardsWonFromTricks.length,
            cardsSelectableForMeld: this.cardsSelectableForMeld,
            cardsSelectableForTrick: this.cardsSelectableForTrick,
            selectedCardForTrick: selectedCardForTrick,
            selectedCardsForMeld: selectedCardsForMeld,
            cardPlayedForTrick: this.cardPlayedForTrick ? this.cardPlayedForTrick.toJson(): undefined,
            cardsPlayedForMelds: this.cardsPlayedForMelds.map(c => c.toJson()),
            cardsWonFromTricks: cardsWonFromTricks
        }
    }
}

module.exports = Player;