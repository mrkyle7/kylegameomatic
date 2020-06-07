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
    started = false;
    gameOver = false;
    isNight = true;
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
            const allRoles = [
                { name: 'werewolf', sortId: Math.random() },
                { name: 'werewolf', sortId: Math.random() },
                { name: 'seer', sortId: Math.random() },
                { name: 'doctor', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
                { name: 'villager', sortId: Math.random() },
            ];

            const roles = allRoles.splice(0, this.players.length);

            roles.sort((a, b) => {
                if (a.sortId < b.sortId) return 1;
                if (a.sortId > b.sortId) return -1;
                return 0
            })

            this.players.forEach(p => p.role = roles.splice(0, 1)[0].name)

            this.started = true;
            this.startNight();
        } catch (err) {
            console.error(err)
            this.message = 'Error occured! ' + err;
        }
    }

    startNight() {
        this.isNight = true;
        this.players.forEach(player => {
            player.votedDreamBy = [];
            player.votedEatenBy = [];
            player.votedHealBy = [];
            player.votedLynchBy = [];
            player.hasVoted = false;

            player.canVote = false;
            player.voteVerb = undefined;
            player.message = '';

            if (player.isDead) {
                player.message = 'You are dead! RIP'
            } else if (player.role === 'werewolf') {
                player.canVote = true;
                player.voteVerb = 'Eat!'
                player.message = 'Choose someone to Eat!'
            } else if (player.role === 'seer') {
                player.canVote = true;
                player.voteVerb = 'Dream About'
                player.message = 'Choose someone to appear in your dreams'
            } else if (player.role === 'doctor') {
                player.canVote = true;
                player.voteVerb = 'Heal'
                player.message = 'Choose someone to heal'
            } else {
                player.message = 'Sleep tight, if you can....'
            }
        });
    }

    /**
     * @param {Player} requestingPlayer
     * @param {Player} votedFor
     */
    vote(requestingPlayer, votedFor) {
        if (this.isNight) {
            if (requestingPlayer.role === 'werewolf') {
                this.players.forEach(p => p.votedEatenBy = p.votedEatenBy.filter(pl => pl.name !== requestingPlayer.name));
                votedFor.votedEatenBy.push(requestingPlayer);
            }
            if (requestingPlayer.role === 'seer') {
                this.players.forEach(p => p.votedDreamBy = p.votedDreamBy.filter(pl => pl.name !== requestingPlayer.name));
                votedFor.votedDreamBy.push(requestingPlayer);
            }
            if (requestingPlayer.role === 'doctor') {
                this.players.forEach(p => p.votedHealBy = p.votedHealBy.filter(pl => pl.name !== requestingPlayer.name));
                votedFor.votedHealBy.push(requestingPlayer);
            }
            requestingPlayer.hasVoted = true;
            const numberOfAliveWerewolves = this.players.filter(p => p.role === 'werewolf' && !p.isDead).length
            const numberOfAliveDoctors = this.players.filter(p => p.role === 'doctor' && !p.isDead).length
            const numberOfAliveSeers = this.players.filter(p => p.role === 'seer' && !p.isDead).length
            if (
                this.players.some(p => p.votedEatenBy.length === numberOfAliveWerewolves) &&
                this.players.some(p => p.votedHealBy.length === numberOfAliveDoctors) &&
                this.players.some(p => p.votedDreamBy.length === numberOfAliveSeers)
            ) {
                this.players.forEach(p => p.canVote = false);
                this.switchToDay(5);
            }

        } else {
            this.players.forEach(p => p.votedLynchBy = p.votedLynchBy.filter(pl => pl.name !== requestingPlayer.name));
            votedFor.votedLynchBy.push(requestingPlayer);
            requestingPlayer.hasVoted = true;

            const majorityVoteNumber = Math.floor(this.players.filter(p => !p.isDead).length / 2) + 1;
            console.log(`Number of players: ${this.players.length} majorityvote: ${majorityVoteNumber}`)

            const highestVote = this.players.map(p => p.votedLynchBy.length).reduce((a, b) => Math.max(a, b));

            if (this.players.some(p => p.votedLynchBy.length >= majorityVoteNumber)
                || (!this.players.some(p => !p.hasVoted && !p.isDead)
                    && this.players.filter(p => p.votedLynchBy.length === highestVote).length === 1)) {
                this.players.forEach(p => p.canVote = false);
                this.switchToNight(5);
            }

        }

    }

    /**
     * @param {number} count
     */
    switchToNight(count) {
        if (count !== 0) {
            this.players.forEach(p => p.message = `The votes are being counted...`);
            setTimeout(() => this.switchToNight(count - 1), 1000);
        } else {
            const highestVote = this.players.map(p => p.votedLynchBy.length).reduce((a, b) => Math.max(a, b));
            console.log(`highest vote: ${highestVote}`)
            const playerKilled = this.players.find(p => p.votedLynchBy.length === highestVote);
            playerKilled.isDead = true;
            this.players.forEach(p => p.message = `${playerKilled.name} was lynched. RIP.`);

            this.isNight = true;
            setTimeout(() => {
                const numberOfAliveWerewolves = this.players.filter(p => p.role === 'werewolf' && !p.isDead).length
                if (numberOfAliveWerewolves === 0) {
                    this.gameOver = true;
                    const deadVillagers = this.players.filter(p => p.role !== 'werewolf' && p.isDead);
                    this.players.forEach(p => p.message = deadVillagers.length > 0 ?
                        `The vilagers won! Except ${deadVillagers.map(v => v.name).join(', ')} who died.`
                        : `The vilagers won!`)
                } else {
                    this.startNight();
                }
            }, 5000);
        }
    }
    /**
        * @param {number} count
        */
    switchToDay(count) {
        if (count !== 0) {
            this.players.forEach(p => p.message = `The sun is rising in ${count}`);
            setTimeout(() => this.switchToDay(count - 1), 1000);
        } else {
            const numberOfAliveWerewolves = this.players.filter(p => p.role === 'werewolf' && !p.isDead).length
            const numberOfAliveDoctors = this.players.filter(p => p.role === 'doctor' && !p.isDead).length
            const numberOfAliveSeers = this.players.filter(p => p.role === 'seer' && !p.isDead).length
            const playerEaten = this.players.find(p => p.votedEatenBy.length === numberOfAliveWerewolves);
            const playerHealed = this.players.find(p => p.votedHealBy.length === numberOfAliveDoctors)
            const playerSeen = this.players.find(p => p.votedDreamBy.length === numberOfAliveSeers)
            if (playerEaten === playerHealed) {
                this.players.forEach(p => p.message = `${playerEaten.name} was attacked by werewolves! Luckily the doctor got to them in time and they survived!`)
            } else {
                this.players.forEach(p => p.message = `${playerEaten.name} was viciously attacked and eaten by werewolves!`);
                playerEaten.isDead = true;
            }
            playerSeen.revealed = true;

            this.isNight = false;

            setTimeout(() => {
                if (numberOfAliveWerewolves >= this.players.filter(p => p.role !== 'werewolf' && !p.isDead).length
                ) {
                    this.gameOver = true;
                    const deadWerewolf =
                        this.players.find(p => p.role === 'werewolf' && p.isDead);
                    this.players.forEach(p => p.message = deadWerewolf ?
                        `The werewolves won! Except ${deadWerewolf.name} who died.`
                        : `The werewolves won!`)
                } else {
                    this.startDay();
                }
            }, 5000);
        }
    }

    startDay() {
        this.players.forEach(player => {
            player.votedDreamBy = [];
            player.votedEatenBy = [];
            player.votedHealBy = [];
            player.votedLynchBy = [];
            player.hasVoted = false;

            player.canVote = false;
            player.voteVerb = undefined;
            player.message = '';

            if (player.isDead) {
                player.message = 'You are dead! RIP'
            } else {
                player.canVote = true;
                player.voteVerb = 'Lynch!'
                player.message = 'Vote who should be lynched!'
            }
        })
    }

    /**
     * @param {Player} [player]
     */
    toJson(player) {
        return {
            name: this.name,
            host: this.host.toJson(player, this.isNight),
            players: this.players.map(p => p.toJson(player, this.isNight, this.gameOver)),
            started: this.started,
            gameOver: this.gameOver,
            isNight: this.isNight
        }
    }
}

module.exports = Game;