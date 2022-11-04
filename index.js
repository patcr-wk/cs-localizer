const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const services = require('./services');
const { application } = require('express');
const path = require('path');
const { fstat } = require('fs');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5000;

const whitelist = ["http://localhost:5000"]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}

app.use(bodyParser.json());
app.use(cors());

app.use(fileUpload());

app.use(express.static(path.join(__dirname + "/public")))
app.use("/public", express.static("public"));
app.get('/download', (req, res) => {
  try {
    setTimeout(services.getentry(res),1000);
  } catch (error) {
    res.status(500).send(error);
  }

});

app.get('/localize', (req, res) => {
          services.uploadLocalizedAsset()
          setTimeout(extract,3000);
          function extract(){
            try{
            const extracted = services.fromDir();
            if (extracted) {
            services.importEntry(res);
            } else {
              res.status(500).send('File count not be extracted');
            }
            } catch (error) {
            res.status(500).send(error);
            }
          }
});
//app.use(express.static(path.join(__dirname, '/public')));

//app.use("/public", express.static("public"));

app.use(express.json());

app.post('/entryConfig', function (req, res) {

 console.log(req.body);
 
 const directory = "./public/zip";
 
 fs.readdir(directory, (err, files) => {
   if (err) throw err;
 
   for (const file of files) {
     fs.unlink(path.join(directory, file), (err) => {
       if (err) throw err;
     });
   }
 });

 var zip = './public/zip';
 var Localize = './public/Localize';
 var copies = './public/copies';
 var uploads = './public/uploads';

 if (!fs.existsSync(zip)){
 fs.mkdirSync(zip);
}
if (!fs.existsSync(Localize)){
fs.mkdirSync(Localize);
}
if (!fs.existsSync(copies)){
fs.mkdirSync(copies);
}
if (!fs.existsSync(uploads)){
fs.mkdirSync(uploads);
}

 const entry = {
     entry_uid: req.body.entry_uid,
     content_type: req.body.content_type
 }
 const jsonString = JSON.stringify(entry)
 fs.writeFile('./entryConfig.json', jsonString, err => {
     if (err) {
         console.log('Error writing file', err)
     } else {
         console.log('Successfully wrote file')
     }
 })
});

app.listen(PORT, () => console.log('Server Started...'));