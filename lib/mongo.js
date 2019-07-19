var debug = require('debug')('authbroker')
//const joi = require('joi')
const MongoClient = require('mongodb').MongoClient



function mongo(setting) {
  this.setting = setting
}


mongo.prototype.findClient = function (data, callback) {

  var self = this
  debug('mongo is starting...')
  debug(data)
  const findDocument = function (db, cb) {
    //console.log('##')
    //console.log(data)
    var collectionName
    // Get the documents collection
    if (self.setting.methodology === 'vertical')
      collectionName = self.setting.collectionName
    else
      collectionName = data.realm

    const collection = db.collection(collectionName)
    // Find some documents
    collection.findOne({
      clientId: data.id,
      realm: data.realm
    })
      .then(item => {
        //console.log(item)
        cb(item)
      })
      .catch(err => {
        console.error(err)
        cb(err)
      })
  }

  // Use connect method to connect to the server
  MongoClient.connect(
    self.setting.url, { useNewUrlParser: true },
    function (err, client) {
      if (err) {
        debug('Mongodb error: ' + err)
        var error = {
          error: err,
          code: '503'
        }
        callback(error)
      }
      const db = client.db()
      findDocument(db, function (findcb) {
        //client.close()
        //console.log('@#')
        //console.log(findcb)
        callback(findcb)
      })
    }
  )
}



module.exports = mongo