class Player {

    /** @type {string} */
    name;
    /** @type {string} */
    password;
    score = 66;

    /**
     * @param {string} name
     * @param {string} password
     */
    constructor(name, password){
        this.name = name;
        this.password = password;
    }
}

module.exports = Player;