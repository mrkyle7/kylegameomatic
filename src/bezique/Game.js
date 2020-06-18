const Card = require('./Card.js');

const Player = require('./Player.js');
const Meld = require('./Meld.js');

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
    lastScoreMessage = ''; k
    started = false;
    gameOver = false;
    lastRounds = false;
    revealBrisques = false;

    /** @type {Player} */
    leadPlayer;
    /** @type {Player} */
    secondPlayer;

    /** @type {Card[]} */
    deck = [];

    /** @type {Card} */
    trumpCard;


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
            this.revealBrisques = false;
            const randomSortedCards = [];

            const cardFaces = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A'];

            for (let value = 0; value < cardFaces.length; value++) {
                const cardFace = cardFaces[value];
                ['H', 'C', 'D', 'S'].forEach(suit => {
                    randomSortedCards.push(new Card(cardFace, suit, value));
                    randomSortedCards.push(new Card(cardFace, suit, value));
                })
            }

            randomSortedCards.sort((a, b) => {
                if (a.sortId < b.sortId) return 1;
                if (a.sortId > b.sortId) return -1;
                return 0
            })

            for (let player of this.players) {
                const playerHand = randomSortedCards.splice(0, 8);
                playerHand.sort((a, b) => {
                    if (a.value > b.value) return 1;
                    if (a.value < b.value) return -1;
                    return 0
                });
                player.cards = playerHand
            }

            this.trumpCard = randomSortedCards.pop();

            this.leadPlayer = this.players[Math.round(Math.random())]
            this.secondPlayer = this.players.find(p => p !== this.leadPlayer);

            if (this.trumpCard.face === '7') {
                this.secondPlayer.score = this.secondPlayer.score + 10;
                this.lastScoreMessage = `${this.secondPlayer.name} got 10 points for revealing a 7 as the trump card!`;
            }

            this.deck = randomSortedCards;

            this.message = `Waiting for ${this.leadPlayer.name} to play a card`;
            this.leadPlayer.cardsSelectableForTrick = true;
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
    selectCardForTrick(player, card) {
        try {
            player.selectedCardForTrick = card;
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    /**
     * @param {Player} player
     * @param {Card} card
     */
    selectCardForMeld(player, card) {
        try {
            if (player.selectedCardsForMeld.some(c => c === card)) {
                player.selectedCardsForMeld = player.selectedCardsForMeld.filter(c => c !== card)
            } else {
                player.selectedCardsForMeld.push(card)
            }
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    /**
     * @param {Player} player
     * @param {Card} card
     */
    playCardForTrick(player, card) {
        try {
            player.selectedCardForTrick = undefined;
            player.cardPlayedForTrick = card;
            player.cards = player.cards.filter(c => c !== card);
            player.cardsPlayedForMelds = player.cardsPlayedForMelds.filter(c => c !== card);
            player.cardsSelectableForTrick = false;

            if (card.face === '7' && this.trumpCard.suit === card.suit && !card.previousMeldValues.some(v => v === 10)) {
                player.score = player.score + 10
                this.lastScoreMessage = `${player.name} scored 10 points for playing the 7 of trumps!`
            }

            if (this.players.every(p => p.cardPlayedForTrick)) {
                setTimeout(() => {
                    /** @type {Player} */
                    let winner;
                    /** @type {Player} */
                    let loser;

                    if (this.leadPlayer.cardPlayedForTrick.suit === this.secondPlayer.cardPlayedForTrick.suit) {
                        if (this.leadPlayer.cardPlayedForTrick.value < this.secondPlayer.cardPlayedForTrick.value) {
                            winner = this.secondPlayer;
                            loser = this.leadPlayer;
                        } else {
                            winner = this.leadPlayer;
                            loser = this.secondPlayer;
                        }
                    } else {
                        if (this.secondPlayer.cardPlayedForTrick.suit === this.trumpCard.suit) {
                            winner = this.secondPlayer;
                            loser = this.leadPlayer;
                        } else {
                            winner = this.leadPlayer;
                            loser = this.secondPlayer;
                        }
                    }
                    winner.cardsWonFromTricks.push(winner.cardPlayedForTrick)
                    winner.cardsWonFromTricks.push(loser.cardPlayedForTrick)
                    winner.cardPlayedForTrick = undefined;
                    loser.cardPlayedForTrick = undefined;
                    this.leadPlayer = winner;
                    this.secondPlayer = loser;
                    if (!this.lastRounds) {
                        winner.cardsSelectableForMeld = true;
                        this.message = `${winner.name} won the trick! Waiting for them to play a meld or pick up a card.`;
                    } else if (winner.cards.length > 0) {
                        winner.cardsSelectableForTrick = true;
                        this.message = `${winner.name} won the trick! Waiting for them to play the next card.`;
                    } else {
                        winner.score = winner.score + 10;
                        this.message = `${winner.name} won the last trick!`;
                        this.lastScoreMessage = `${winner.name} scores 10 points for winning the last trick!`
                        setTimeout(() => {
                            this.revealBrisques = true;
                            const leadPointsFromBrisques = this.leadPlayer.cardsWonFromTricks.reduce((sum, card) => {
                                if (card.face === 'A' || card.face === '10') {
                                    return sum + 10
                                } else {
                                    return sum
                                }
                            }, 0)
                            this.leadPlayer.score = this.leadPlayer.score + leadPointsFromBrisques
                            const secondPointsFromBrisques = this.secondPlayer.cardsWonFromTricks.reduce((sum, card) => {
                                if (card.face === 'A' || card.face === '10') {
                                    return sum + 10
                                } else {
                                    return sum
                                }
                            }, 0)
                            this.secondPlayer.score = this.secondPlayer.score + secondPointsFromBrisques

                            this.lastScoreMessage = `${this.leadPlayer.name} won ${leadPointsFromBrisques} points from brisques and ${this.secondPlayer.name} won ${secondPointsFromBrisques} points!`

                            setTimeout(() => {
                                if (this.players.some(p => p.score >= 1000)) {
                                    const winner = this.leadPlayer.score > this.secondPlayer.score ? this.leadPlayer : this.secondPlayer
                                    this.message = `${winner.name} won the game!`
                                    this.lastScoreMessage = ''
                                } else {
                                    this.start()
                                }
                            }, 2000)

                        }, 2000)

                    }
                }, 2000)
            } else {
                const nextPlayer = this.players.find(p => !p.cardPlayedForTrick);
                nextPlayer.cardsSelectableForTrick = true;
                this.message = `Waiting for ${nextPlayer.name} to play a card`;
            }
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    /**
     * @param {Meld} meld
     * @param {Player} player
     */
    playCardsForMeld(meld, player) {
        player.selectedCardsForMeld = []
        player.cardsSelectableForMeld = false
        player.cards = player.cards.filter(c => meld.cards.every(m => m !== c))

        player.score = player.score + meld.value;

        if (meld.name === 'a 7 of trumps') {
            player.cardsPlayedForMelds.push(this.trumpCard)
            this.trumpCard = meld.cards[0]
        } else {
            player.cardsPlayedForMelds = player.cardsPlayedForMelds.concat(meld.cards.filter(m => player.cardsPlayedForMelds.every(c => c !== m)))
        }
        player.cardsPlayedForMelds.forEach(card => {
            card.previousMeldValues.push(meld.value)
        })
        this.lastScoreMessage = `${player.name} melded ${meld.name} scoring ${meld.value} points!`

        this.pickUpCard();
    }

    pickUpCard() {
        try {
            this.leadPlayer.cardsSelectableForMeld = false;
            this.players.forEach(p => p.selectedCardsForMeld = [])
            if (this.deck.length > 1) {
                this.players.forEach(p => {
                    p.cards.push(this.deck.pop());
                })
            } else if (this.deck.length === 1) {
                this.leadPlayer.cards.push(this.deck.pop())
                this.secondPlayer.cards.push(this.trumpCard)
                this.trumpCard = undefined;
            } else {
                this.lastRounds = true;
            }
            this.players.forEach(p => {
                p.cards.sort((a, b) => {
                    if (a.value > b.value) return 1;
                    if (a.value < b.value) return -1;
                    return 0
                });
            })
            this.message = `Waiting for ${this.leadPlayer.name} to play a card`;
            this.leadPlayer.cardsSelectableForTrick = true;

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
            trumpCard: this.trumpCard ? this.trumpCard.toJson() : undefined,
            lastScoreMessage: this.lastScoreMessage,
            leadPlayer: this.leadPlayer ? this.leadPlayer.toJson() : undefined,
            secondPlayer: this.secondPlayer ? this.secondPlayer.toJson() : undefined,
            deckNumber: this.deck.length,
            lastRounds: this.lastRounds,
            revealBrisques: this.revealBrisques
        }
    }
}

module.exports = Game;