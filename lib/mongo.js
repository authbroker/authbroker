var debug = require('debug')('authbroker')
//const joi = require('joi')
const MongoClient = require('mongodb').MongoClient



function mongo(setting) {
  this.setting = setting
  console.log(setting)
}


mongo.prototype.findClient = function (data, callback) {

  var self = this
  const findDocument = function (db, cb) {
    console.log(data)
    // Get the documents collection
    if (self.methodology === 'vertical')
      const collection = db.collection(self.collectionName)
    if (self.methodology === 'horzintal')
      const collection = db.collection(data.realm)
    // Find some documents
    collection.findOne(
      {
        clientId: data.id,
        realm: data.realm
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