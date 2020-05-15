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
    timeoutTimer;

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

    toJson(name) {
        return {
            name: this.name,
            isHost: this.isHost,
            score: this.score,
            message: this.message,
            connected: this.connected
        }
    }
}

module.exports = Player;