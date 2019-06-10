var debug = require('debug')('authbroker')
//const joi = require('joi')
const MongoClient = require('mongodb').MongoClient



function mongo(setting) {
  this.setting = setting
}


mongo.prototype.findClient = function (data, callback) {

  var self = this
  debug('mongo is starting')
  console.log(data)
  const findDocument = function (db, cb) {
    var collectionName
    // Get the documents collection
    if (self.setting.methodology === 'vertical')
      collectionName = self.setting.collectionName
    if (self.setting.methodology === 'horzintal')
      collectionName = data.realm

    const collection = db.collection(collectionName)
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
    self.setting.url,
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