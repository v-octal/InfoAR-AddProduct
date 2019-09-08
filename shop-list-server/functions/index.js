const functions = require('firebase-functions')
const os = require('os')
const path = require('path')
const cors = require('cors')({ origin: true })
const Busboy = require('busboy')
const fs = require('fs')
const {Storage} = require('@google-cloud/storage');
const admin = require('firebase-admin');
const UUID = require("uuid-v4")

admin.initializeApp();

const database = admin.database().ref('/items');

const storage = new Storage({
  projectId: 'building-serverless-apps',
  keyFilename: 'building-serverless-apps-firebase-adminsdk-t77bb-841eaece33.json'
});

exports.uploadFile = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== 'POST') {
      return res.status(500).json({
        message: 'Not allowed',
      })
    }
    const busboy = new Busboy({ headers: req.headers })
    let uploadData = null
    var fieldData = {}
    let uuid = UUID();

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const filepath = path.join(os.tmpdir(), filename)
      uploadData = { file: filepath, type: mimetype }
      file.pipe(fs.createWriteStream(filepath))
    })

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype){
      fieldData[fieldname] = val
    })

    busboy.on('finish', () => {
      const bucket = storage.bucket('building-serverless-apps.appspot.com')
      bucket
        .upload(uploadData.file, {
          uploadType: 'media',
          metadata: {
            contentType: uploadData.type,
            metadata: {
              firebaseStorageDownloadTokens: uuid
            }
          },
        })
        .then((data) => {
          let file = data[0];
          fieldData['downloadPath'] = "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(file.name) + "?alt=media&token=" + uuid
          database.push(fieldData)
          res.status(200).json({
            message: 'It worked!',
            dat: fieldData
          })
        })
        .catch(err => {
          res.status(500).json({
            error: err,
          })
        })
    })
    busboy.end(req.rawBody)
  })
})

const getItemsFromDatabase = (res) => {
  let items = [];

  return database.on('value', (snapshot) => {
    snapshot.forEach((item) => {
      items.push({
        id: item.key,
        name: item.val().name,
        item: item.val().items,
        downloadPath: item.val().downloadPath
      });
    });   
    res.status(200).json(items);
  }, (error) => {
    res.status(error.code).json({
      message: `Something went wrong. ${error.message}`
    })
  })
};

exports.getAllItems = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== 'GET') {
      return res.status(401).json({
        message: 'Not allowed'
      });
    };
    getItemsFromDatabase(res)
  });
});