module.exports = {
    username: 'admin',
    password: 'admin',
    client: {},
    keycloak: {
        "realm": "IOT_Realm",
        "authUrl": "http://localhost:8080/auth",
        "sslRequired": "external",
        "clientId": "authBroker",
        "verifyTokenAudience": true,
        "credentials": {
          "secret": "secret"
        },
        "confidentialPort": 0,
        "policyEnforcer": {}
      }
}