"use strict";

const loggerInit = require("./lib/logger");
const logger = loggerInit({})
const jwt = require("jsonwebtoken")
const keycloakAuthorizer = require('./lib/authorizer')

const authorizer = new keycloakAuthorizer

/**
 * Authorizer's responsibility is to give an implementation
 * of Aedes callback of authorizations, against a JSON file.
 *
 * @api public
 */
function authBroker(config) {
    logger.debug('Authorizer is sarting...')
    config.mqttpubScope = config.mqttpubScope || 'scopes:mqttpub'
    config.mqttsubScope = config.mqttsubScope || 'scopes:mqttsub'
    config.mqttResPerfix = config.mqttResPerfix || 'res:'
    this.keycloakAuthorizer = new keycloakAuthorizer(config)
    this.config = config
}


/**
 * It returns the authenticate function to plug into Aedes.
 *
 * @api public
 */
authBroker.prototype.authenticate = function () {
    const that = this
    return function (client, user, pass, cb) {
        that.keycloakAuthorizer.isAuthenticated(user, pass).then(
            (token) => {
                const claims = jwt.decode(token);
                //logger.debug(claims)
                client.claims = claims
                client.claimsToken = token
                cb(null, true)
            },
            (err) => {
                cb(err, false)
            }
        )
    }
}


/**
 * It returns the authorizePublish function to plug into Aedes.
 *
 * @api public
 */
authBroker.prototype.authorizePublish = function () {
    const that = this;
    return function (client, packet, cb) {
        that.keycloakAuthorizer.isAuthorised(client.claimsToken, that.config.mqttResPerfix + packet.topic).then(
            (token) => {
                const claims = jwt.decode(token)
                //logger.debug(claims)
                client.claims = claims
                client.claimsToken = token
                if (client.claims.authorization && client.claims.authorization.permissions && that.checkPermissions(packet, client))
                    return cb(null)
            },
            (err) => {
                logger.debug('not authorizzed')
                cb(err, false)
            }
        );
    }
}

/**
 * It returns the authorizeSubscribe function to plug into Aedes.
 *
 * @api public
 */
authBroker.prototype.authorizeSubscribe = function () {
    const that = this;
    return function (client, subscription, cb) {
        that.keycloakAuthorizer.isAuthorised(client.claimsToken, that.config.mqttResPerfix + subscription.topic).then(
            (token) => {
                const claims = jwt.decode(token)
                console.log(token)
                //logger.debug(claims)
                client.claims = claims
                client.claimsToken = token
                if (claims.authorization && claims.authorization.permissions && that.checkPermissions(subscription, client))
                    cb(null, subscription);
            },
            (err) => {
                logger.debug('not authorizzed')
                cb(err)
            }
        )
    }
}


authBroker.prototype.checkPermissions = function (packet, client) {
    let scope
    const permissions = client.claims.authorization.permissions
    /*
    if (isExpired(client.claims.exp)) {
        logger.debug('token is expired')
        return false
    }
    */
   
    if (packet.topic && !packet.cmd)
        scope = this.config.mqttsubScope //'scopes:mqttsub'
    else
        scope = this.config.mqttpubScope //'scopes:mqttpub'

    const rsname = this.config.mqttResPerfix + packet.topic

    for (let i = 0; i < permissions.length; i++)
        if (permissions[i] && permissions[i].rsname && permissions[i].rsname === rsname)
            if (permissions[i].scopes && permissions[i].scopes.indexOf(scope) > -1)
                return true

    logger.debug('not permited')
    return false
}


function isExpired(exp) {
    return ((exp * 1000) < Date.now());
};


module.exports = authBroker