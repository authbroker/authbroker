/*
var debug = require('debug')('authbroker')
// const joi = require('joi')
const MongoClient = require('mongodb').MongoClient

var url = 'mongodb://localhost:27017/paraffin'
*/
data = {
    name: 'auth',
    realm: 'mohammad'
}

//console.log(findClient(data))
console.log('##1')
console.log(this)

function findClient(data) {

    console.log('##2')
    console.log(this)
    // Use connect method to connect to the server
    MongoClient.connect(
        url,
        function (err, client) {
            if (err) {
                debug('Mongodb error: ' + err)
                var error = {
                    error: err,
                    code: '503'
                }
                return callback(error)
            }
            console.log(client)
            const db = client.db

            const collection = db.collection(data.name)
            // Find some documents
            collection.findOne(
                {
                    // clientId: data.id
                    realm: data.realm
                },
                function (err, doc) {
                    if (err) {
                        console.log('Mongodb error: ' + err)
                        var error = {
                            error: err,
                            code: '503'
                        }
                        return error
                    }
                    console.log(doc)
                }
            )
        }
    )
}

