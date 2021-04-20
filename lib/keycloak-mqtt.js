"use strict";
var request = require("request");
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
      new Buffer(self.setting.clientSecret, "base64"),
      function (err, profile) {
        if (err) {
          return callback("Error getting UserInfo", false);
        }
        console.log("Authenticated client " + profile.user_id);
        console.log(profile.topics);
        client.deviceProfile = profile;
        return callback(null, true);
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

  return function (client, username, password, callback) {
    if (username === undefined || password === undefined) {
      console.log("username or password is empty");
      var error = new Error("Auth error");
      error.returnCode = 4;
      callback(error, null);
    }

    var data = {
      client_id: self.setting.clientId, // {client-name}
      username: username.toString(),
      password: password.toString(),
      client_secret: self.setting.clientSecret,
      grant_type: "password",
      scope: "openid", //Details: https:///scopes
    };

    request.post(
      {
        headers: {
          //"Content-type": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        
        url: self.setting.issuer + "/protocol/openid-connect/token",
        //body: JSON.stringify(data),
        form: data,
      },
      function (e, r, b) {
        if (e) {
          console.log("Error in Authentication");
          console.log(e);
          return callback(e, false);
        }
        var r = JSON.parse(b);
        //console.log(r);

        if (r.error) {
          return callback(r, false);
        }
        if (r.access_token != undefined) {
          var profile = jwt.decode(r.access_token);

          if (profile.err) {
            return callback("Error getting UserInfo", false);
          }
          console.log(profile);
          //console.log(profile.topics);
          client.deviceProfile = profile;
          return callback(null, true);
        }
        return callback("access_token not defined", false);
      }
    );
  };
};

authBroker.prototype.authorizePublish = function () {
  var self = this;
  return function (client, packet, callback) {
    const permission =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(packet.topic) > -1;

    if (permission) callback(null);
    else return callback(new Error("wrong topic"));
  };
};

authBroker.prototype.authorizeSubscribe = function () {
  var self = this;
  return function (client, sub, callback) {
    const permission =
      client.deviceProfile &&
      client.deviceProfile.topics &&
      client.deviceProfile.topics.indexOf(sub.topic) > -1;

    if (permission) callback(null, sub);
    else return callback(new Error("wrong topic"));
  };
};

module.exports = authBroker;