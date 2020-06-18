const Player = require('./Player.js')

class Card {

    /** @type {number} */
    id;
    /** @type {string} */
    name;
    /** @type {number} */
    value;
    /** @type {string} */
    img;
    /** @type {number[]} */
    previousMeldValues = []
    /** @type {number} */
    sortId;
    /** @type {string} */
    face;
    /** @type {string} */
    suit;

    /**
     * @param {string} face
     * @param {string} suit
     * @param {number} value
     */
    constructor(face, suit, value) {
        this.id = Math.random()
        this.face = face;
        this.suit = suit;
        this.value = value;
        this.img = `../img/${face}${suit}.png`
        this.sortId = Math.random();
    }

    toJson() {
        return {
            id: this.id,
            number: this.name,
            value: this.value,
            img: this.img,
            suit: this.suit,
            face: this.face
        }
    }
}

module.exports = Card