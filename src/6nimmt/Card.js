const Player = require('./Player.js')

class Card {

    /** @type {number} */
    number;
    /** @type {number} */
    penaltyPoints;
    /** @type {number} */
    sortId;
    /** @type {string} */
    playerName;

    /**
     * @param {number} number
     */
    constructor(number) {
        this.number = number;
        this.penaltyPoints = calculatePenaltyPoints(number);
        this.sortId = Math.random();
    }

    toJson() {
        return {
            number: this.number,
            penaltyPoints: this.penaltyPoints,
            playerName: this.playerName
        }
    }
}

/**
 * @param {number} number
 */
function calculatePenaltyPoints(number) {
    if (number === 55) {
        return 7;
    } else if (number % 11 === 0) {
        return 5;
    } else if (number % 10 === 0) {
        return 3;
    } else if (number % 5 === 0) {
        return 2;
    } else {
        return 1;
    }
}

module.exports = Card