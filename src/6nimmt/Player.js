class Player {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    /** @type {boolean} */
    isHost;
    score = 66;

    /**
     * @param {string} name
     * @param {string} password
     * @param {boolean} isHost
     */
    constructor(name, password, isHost){
        this.name = name;
        this.password = password;
        this.isHost = isHost;
    }
}

module.exports = Player;