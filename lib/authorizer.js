const axios = require("axios").default
const qs = require("qs")
const initLogger = require("./logger")
const logger = initLogger({})

const defaultConfig = {
    "realm": "master",
    "authUrl": "http://localhost:8080/auth",
    "ssl-required": "external",
    "resource": "authbroker",
}

function Validator(config) {
    this.config = {
        ...defaultConfig,
        ...(config || {})
    }
}


Validator.prototype.isAuthenticated = async function (
    username,
    password
) {
    let user = username
    let realm = this.config.realm

    let data = {
        client_id: this.config.clientId,
        client_secret: this.config.credentials.secret,
        grant_type: "password",
        username: user,
        password: password.toString(),
    }

    let headers = {
        "content-type": "application/x-www-form-urlencoded"
    }

    const url = `${this.config.authUrl}/realms/${realm}/protocol/openid-connect/token`
    try {
        logger.debug(`Authenticate against '${url}'`)
        const tokenResult = await axios.post(url, qs.stringify(data), {
            headers,
        })

        return tokenResult.data.access_token
    } catch (e) {
        throw e
    }
}


Validator.prototype.isAuthorised = async function (
    token,
    resource
) {
    let realm = this.config.realm
    const url = `${this.config.authUrl}/realms/${realm}/protocol/openid-connect/token`;
    try {
        logger.debug(`Authenticate against '${url}'`)

        headers = {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
        };

        let dataTicket = {
            audience: this.config.clientId,
            grant_type: "urn:ietf:params:oauth:grant-type:uma-ticket",
            permission: resource
        };
        const tokenResultTicket = await axios.post(url, qs.stringify(dataTicket), {
            headers,
        });

        return tokenResultTicket.data.access_token
    } catch (e) {
        throw e;
    }
}


module.exports = Validator