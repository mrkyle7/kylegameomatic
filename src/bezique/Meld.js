const Card = require("./Card");

class Meld {

    /** @type {Card[]} */
    cards
    value = -1
    name = ''
    /** @type {Card} */
    trumpCard;
    invalidReason = ''

    /**
     * @param {Card[]} cards
     * @param {Card} trumpCard
     */
    constructor(cards, trumpCard) {
        this.cards = cards
        this.trumpCard = trumpCard
        this.calculateValue()
    }

    calculateValue() {
        const trumpSuit = this.trumpCard.suit;
        let jackBezique;
        let queenBezique;
        if (trumpSuit === 'D' || trumpSuit === 'S') {
            jackBezique = 'H';
            queenBezique = 'C'
        } else {
            jackBezique = 'D'
            queenBezique = 'S'
        }
        if (this.cards.length === 2
            && this.cards[0].suit === this.cards[1].suit
            && this.cards.some(c => c.face === 'Q')
            && this.cards.some(c => c.face === 'K')) {
            if (this.cards[0].suit === trumpSuit) {
                this.name = 'a Royal Marriage';
                this.value = 40
            } else {
                this.name = 'a Common Marriage'
                this.value = 20
            }
        } else if (this.cards.length === 5
            && this.cards.every(c => c.suit === trumpSuit)
            && this.cards.some(c => c.face === 'A')
            && this.cards.some(c => c.face === '10')
            && this.cards.some(c => c.face === 'K')
            && this.cards.some(c => c.face === 'Q')
            && this.cards.some(c => c.face === 'J')
        ) {
            this.name = 'a Sequence'
            this.value = 250
        } else if (this.cards.length === 2
            && this.cards.some(c => c.face === 'Q')
            && this.cards.some(c => c.face === 'J')
            && this.cards.find(c => c.face === 'Q').suit === queenBezique
            && this.cards.find(c => c.face === 'J').suit === jackBezique
        ) {
            this.name = 'a Bezique'
            this.value = 40
        } else if (this.cards.length === 4
            && this.cards.filter(c => c.face === 'Q').length === 2
            && this.cards.filter(c => c.face === 'J').length === 2
            && this.cards.filter(c => c.face === 'Q').every(c => c.suit === queenBezique)
            && this.cards.filter(c => c.face === 'J').every(c => c.suit === jackBezique)
        ) {
            this.name = 'a Double Bezique'
            this.value = 500
        } else if (this.cards.length === 4
            && this.cards.every(c => c.face === 'J')) {
            this.name = '4 Jacks'
            this.value = 40
        } else if (this.cards.length === 4
            && this.cards.every(c => c.face === 'Q')) {
            this.name = '4 Queens'
            this.value = 60
        } else if (this.cards.length === 4
            && this.cards.every(c => c.face === 'K')) {
            this.name = '4 Kings'
            this.value = 80
        } else if (this.cards.length === 4
            && this.cards.every(c => c.face === 'A')) {
            this.name = '4 Aces'
            this.value = 100
        } else if (this.cards.length === 1
            && this.cards[0].face === '7'
            && this.cards[0].suit === trumpSuit
            && this.trumpCard.face !== '7') {
            this.name = 'a 7 of trumps'
            this.value = 10
        }
    }

    isValid() {
        if (this.value === -1) {
            this.invalidReason = 'Not a valid Meld'
            return false
        }
        if (this.cards.some(c => c.previousMeldValues.some(v => v >= this.value))) {
            this.invalidReason = 'Cards cannot be used for the same or lower value Meld'
            return false
        }
        return true
    }
}

module.exports = Meld