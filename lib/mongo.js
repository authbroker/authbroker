var debug = require('debug')('authbroker')
//const joi = require('joi')
const MongoClient = require('mongodb').MongoClient



function mongo(setting) {
  this.db = setting
}


mongo.prototype.findClient = function (data, callback) {

  var self = this
  const findDocument = function (db, cb) {
    // Get the documents collection
    const collection = db.collection(data.name)
    // Find some documents
    collection.findOne(
      {
        clientId: data.clientId
      },
      function (err, doc) {
        if (err) {
          debug('Mongodb error: ' + err)
          var error = {
            error: err,
            code: '503'
          }
          return cb(error)
        }
        cb(doc)
      }
    )
  }

  // Use connect method to connect to the server
  MongoClient.connect(
    self.url,
    function (err, client) {
      if (err) {
        debug('Mongodb error: ' + err)
        var error = {
          error: err,
          code: '503'
        }
        return callback(error)
      }
      const db = client.db()
      findDocument(db, function (cb) {
        client.close()
        return callback(cb)
      })
    }
  )
}



module.exports = mongo