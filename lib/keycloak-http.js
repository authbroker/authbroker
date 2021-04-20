"use strict";
var debug = require("debug")("authbroker");
var jwt = require("jsonwebtoken");

function authBroker(setting) {
  debug("authentication function is running...");
  this.setting = setting;
}

authBroker.prototype.authenticateWithJWT = function () {
  var self = this;
  return function (client, username, password, callback) {
    if (username !== "JWT") {
      return callback("Invalid Credentials", false);
    }

    // console.log('Password:'+password);
    jwt.verify(
      password,
      new Buffer.from(self.setting.clientSecret, "base64"),
      function (err, profile) {
        if (err) {
          return callback("Error getting UserInfo", false);
        }
        console.log("Authenticated client " + profile.user_id);
        console.log(profile.topics);
        client.deviceProfile = profile;
        return callback(null, true), client;
      }
    );
  };
};

/*
  Used when the device is sending credentials.
  mqtt.username must correspond to the table username in the mongoDB table
  mqtt.password must correspond to the device password
*/
authBroker.prototype.authenticateWithCredentials = function () {
  var self = this;

  return function (req, callback) {
    if (req.access_token === undefined) {
      console.log("access token is empty");
      var error = new Error("Auth error");
      error.returnCode = 4;
      return callback(error, false);
    }

    var profile = jwt.decode(req.access_token);

    if (profile.err) {
      return callback("Error getting UserInfo", false);
    }
    console.log(profile);
    req.deviceProfile = profile;
    return callback(null, true, req);
  };
}

authBroker.prototype.authorizePut = function () {
  var self = this;
  return function (client, topic, payload, callback) {
    const permission =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(topic) > -1;

    if (permission) callback(null);
    else return callback(new Error("wrong topic"));
  };
};

authBroker.prototype.authorizeGet = function () {
  var self = this;
  return function (client, topic, callback) {
    const permission =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(topic) > -1;

    if (permission) callback(null);
    else return callback(new Error("wrong topic"));
  };
};

module.exports = authBroker;