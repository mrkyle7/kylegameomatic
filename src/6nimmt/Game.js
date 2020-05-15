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

    toJson(name) {
        return {
            name: this.name,
            host: this.host.toJson(name),
            players: this.players.map(p => p.toJson(name)),
            message: this.message
        }
    }
}

module.exports = Game;