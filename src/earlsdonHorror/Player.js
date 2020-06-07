const Card = require("./Card");

class Player {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    /** @type {boolean} */
    isHost;
    /** @type {string} */
    role;
    canVote = false;
    isDead = false;
    revealed = false;
    /** @type {string} */
    voteVerb;

    /** @type {Player[]} */
    votedEatenBy = [];
    /** @type {Player[]} */
    votedHealBy = [];
    /** @type {Player[]} */
    votedDreamBy = [];
    /** @type {Player[]} */
    votedLynchBy = [];
    hasVoted = false;
    score = 66;
    message = 'Waiting to start';
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
     * @param {Player} player
     * @param {boolean} isNight
     * @param {boolean} gameOver
     */
    canBeVotedFor(player, isNight, gameOver) {
        if (this.isDead) return false
        if (gameOver) return false
        if (isNight) {
            if (player.role === 'werewolf') return this.role !== 'werewolf';
            if (player.role === 'seer') return this.name !== player.name && !this.revealed;
            if (player.role === 'doctor') return true;
        } else {
            return this.name !== player.name;
        }
    }

    /**
     * @param {Player} [player]
     * @param {boolean} [isNight]
     * @param {boolean} [gameOver]
     */
    toJson(player, isNight, gameOver) {
        let message;
        let canVote;
        let voteVerb;
        let canBeVotedFor;
        let role = '???';
        let voteCount = 0;
        if (player && player.name === this.name) {
            message = this.message;
            canVote = this.canVote;
            voteVerb = this.voteVerb;
            role = this.role
        }
        if (player && player.role === 'werewolf' && this.role === 'werewolf') {
            role = this.role;
        }
        if (player && player.role === 'seer' && this.revealed) {
            role = this.role;
        }
        if (gameOver){
            role = this.role;
        }
        if (player.canVote) {
            canBeVotedFor = this.canBeVotedFor(player, isNight, gameOver);
        }
        if (isNight) {
            if (player && player.role === 'werewolf') {
                voteCount = this.votedEatenBy.length;
            }
            if (player && player.role === 'seer') {
                voteCount = this.votedDreamBy.length;
            }
            if (player && player.role === 'doctor') {
                voteCount = this.votedHealBy.length;
            }
        } else {
            voteCount = this.votedLynchBy.length;
        }
        return {
            name: this.name,
            isHost: this.isHost,
            score: this.score,
            role: role,
            isDead: this.isDead,
            message: message,
            canVote: canVote,
            voteVerb: voteVerb,
            voteCount: voteCount,
            canBeVotedFor: canBeVotedFor,
            connected: this.connected
        }
    }
}

module.exports = Player;