const Card = require("./Card");

class Player {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    /** @type {boolean} */
    isHost;
    score = 66;
    message = '';
    connected = true;
    /** @type {NodeJS.Timeout} */
    timeoutTimer;
    /** @type {Card} */
    selectedCard;

    /** @type {Card[]} */
    cards = []

    /**
     * @param {string} name
     * @param {string} password
     * @param {boolean} isHost
     */
    constructor(name, password, isHost){
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
        let selectedCard;
        if (name && name === this.name) {
            cards = this.cards.map(c => c.toJson());
            selectedCard = this.selectedCard;
        }
        return {
            name: this.name,
            isHost: this.isHost,
            score: this.score,
            message: this.message,
            connected: this.connected,
            cards: cards,
            selectedCard: selectedCard
        }
    }
}

module.exports = Player;