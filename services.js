const fs = require("fs");
const contentstack = require("contentstack");
const { fstat } = require("fs");
const axios = require('axios');
const ciqlJson = require("ciql-json");
const AdmZip = require("adm-zip");
const zipLocal = require("zip-local");
const path = require("path");
const { callbackify } = require("util");
var FormData = require('form-data');
const zipDir = "./public/zip/";
const files = fs.readdirSync(zipDir)
const conf = require('./contentstackConfig.json')
//let entryConfig = JSON.parse(fs.readFileSync('./entryConfig.json'))
//var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'

const getentry = (res) => { 
	//const entryConfig = require('./entryConfig.json')
	// Initialize the Contentstack Stack
	const Stack = contentstack.Stack({ "api_key": conf.API_KEY, "delivery_token": conf.DELIVERY_TOKEN, "environment": conf.ENVIRONMENT });
	const Query = Stack.ContentType(JSON.parse(fs.readFileSync('./entryConfig.json')).content_type).Entry(JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid);//replace ContentType and Entry with variable from the 
	Query.includeContentType()
		.fetch()
		.then(
			function success(entry) {
				//console.log(entry); // Retrieve field value by providing a field's uid
				//console.log(entry.toJSON()); // Convert the entry result object to JSON

				const entryData = entry.toJSON();
				const filename = "./public/Localize/" + entryData.uid + ".json";

				let data = JSON.stringify(entryData);
				fs.writeFileSync(filename, data);

				copyEntry(res, entryData.uid);
			},
			function error(err) {
				// err objectd
				res.status(500).send(err);
			}
		)
		.then( 
		);
};

function copyEntry(res, fileUid) {
	//const entryConfig = require('./entryConfig.json')
	{
		const config = {
			method: 'get',
			url: 'https://api.contentstack.io/v3/locales',
			headers: {
				'api_key': conf.API_KEY,
				'authorization': conf.MANAGEMENT_TOKEN,
				'Content-Type': 'application/json'
			}
		};

		axios(config)
			.then(function (response) {
				//console.log(JSON.stringify(response.data));
				//for each locale code
				for (let i = 0; i < response.data.locales.length; i++) {
					//console.log(response.data.locales[i].code)

					const dir = "./public/Localize";
					const des = "./public/copies/";
					const files = fs.readdirSync(dir);

					for (const file of files) {
						//console.log(file);
						//console.log(des + file);

						const localename = response.data.locales[i].code + "-";
						const newfile = des + localename + file;

						// File destination.txt will be created or overwritten by default.
						fs.copyFile(dir + "/" + file, newfile, (err) => {
							if (err) throw err;
							//console.log(newfile + " was copied to " + des);
						});
					}
				};
				updateEntry();
			})
			
			.then(function(){
				updateEntry();
			})
			.then(function(){
				zipEntry();
			})
			.then(function(){
				addToAssets();
			})
			.then(function(){
				cleanEntry();
				cleanCopies();
				res.status(200).send({ zipfilePath: 'public/zip/' + JSON.parse(fs.readFileSync('./entryConfig.json')).content_type + '-' + fileUid + '.zip' });	
			})
			.catch(function (error) {
				res.status(500).send(error);
			});
	}
};

function updateEntry() {
	//const entryConfig = require('./entryConfig.json')
	try {
		const from = "./public/Localize";
		const dir = "./public/copies";
		const pfiles = fs.readdirSync(from);
		const files = fs.readdirSync(dir);

		for (const file of files) {
			const dirPath = dir + "/" + file;

			var file_content = fs.readFileSync(dirPath);
			var content = JSON.parse(file_content);
			var locale = content.locale;
			var newlocale = file.replace("-" + pfiles, "");

			//console.log(locale);
			//console.log(newlocale);

			ciqlJson.open(dirPath).set("locale", newlocale).save();
		}
	} catch (error) {
		throw new Error(error);
	}
};

function zipEntry() {
	//const entryConfig = require('./entryConfig.json')
	try {
		const inputDir = "./public/Localize";
		const outputDir = "./public/zip/";
		const files = fs.readdirSync(inputDir)

		for (const file of files) {
			//console.log(file);
			//console.log(outputDir + file);
			const zipfile = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type + "-" + file.replace(".json", "") + ".zip";
			// const zipfile = "download.zip";

			zipLocal.sync
				.zip("./public/copies")
				.compress()
				.save(outputDir + zipfile);

		}
	} catch (error) {
		throw new Error(error);
	}
};


function cleanEntry() {
	//const entryConfig = require('./entryConfig.json')
	var locdirectory = "./public/Localize";
	fs.readdir(locdirectory, (err, files) => {
		if (err) throw err;

		for (const file of files) {
			fs.unlink(path.join(locdirectory, file), (err) => {
				if (err) throw err;
			});
		}
	});
};

function cleanCopies() {
	//const entryConfig = require('./entryConfig.json')
	var locdirectory = "./public/copies";

	fs.readdir(locdirectory, (err, files) => {
		if (err) throw err;

		for (const file of files) {
			fs.unlink(path.join(locdirectory, file), (err) => {
				if (err) throw err;
			});
		}
	});
};


function fromDir() {
	//const entryConfig = require('./entryConfig.json')
	var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
	const startPath = './public/uploads';
	const filter = '.zip';

	if (!fs.existsSync(startPath)) {
		console.log("no dir ", startPath);
		return;
	}

	var files = fs.readdirSync(startPath);
	const zipfiles = files.filter(f => (path.extname(f).toLowerCase() === '.zip'));
	if (!zipfiles || zipfiles.length === 0) {
		throw new Error("no zip files found");
	} else {
		var zipfilename = path.join(startPath, zipfiles[0])
		const extracted = extractArchive(zipfilename);
		return extracted;
	}
};

function addToAssets(){
	//const entryConfig = require('./entryConfig.json')
	var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
//query for available assets
var data = JSON.stringify({
  query: `query($filename: String!){

    all_assets(
        where:{filename: $filename, description: "NEEDS TO BE TRANSLATED"}
    )
    {   
        items{
            filename
            system{
                uid
            }
        }
    }
}`,
  variables: {
    "filename": zipFileName
}
});

var config = {
  method: 'post',
  url: 'https://graphql.contentstack.com/stacks/'+conf.API_KEY+'?environment='+conf.ENVIRONMENT,
  headers: { 
    'access_token': conf.DELIVERY_TOKEN, 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  var assetExists = response.data.data.all_assets.items;
  
// if Asset does not exist
  if (assetExists === undefined || assetExists.length == 0) {
// Add Asset
    addAsset()
}
// if Asset does exist
else{
// Update Asset    
    updateAsset();
    
}

})
.catch(function (error) {
  console.log(error);
});


axios(config)
.then(function (response) {
  var res = (JSON.stringify(response.data));
  var obj = JSON.parse(res);
  
  //console.log(JSON.stringify(response.data.asset.url));
  //console.log(obj);
})
.catch(function (error) {
      console.log(error);
});
};

async function extractArchive(filepath) {
	//const entryConfig = require('./entryConfig.json')
	try {
		const zip = new AdmZip(filepath);
		// const outputDir = `./public/uploads/extracted/${path.parse(filepath).name}_extracted`;
		const outputDir = `./public/uploads/extracted/`;
		zip.extractAllTo(outputDir);
		// delete the zip file
		fs.unlinkSync(filepath);

		console.log(`Extracted to "${outputDir}" successfully`);
		return true;

	} catch (e) {
		console.log(`Something went wrong. ${e}`);
		return false;
	}
}

function importEntry(response) {
    //const entryConfig = require('./entryConfig.json')
	(async () => {
        const fs = require('fs')
    
        const dir = './public/uploads/extracted/'
        const jsonfiles = fs.readdirSync(dir)
       
        for (const jsonfile of jsonfiles) {
            
        var entrydata = JSON.parse(fs.readFileSync(dir+jsonfile))             
        
        //console.log(jsonfile,entrydata.locale,entrydata.uid)
        var eLocale = entrydata.locale;
        var eUid = entrydata.uid;
        var axios = require('axios');
        var FormData = require('form-data');
        var data = new FormData();
    
        data.append('entry', fs.createReadStream(dir+jsonfile));
    
        var config = {
            method: 'post',
            url: 'https://api.contentstack.io/v3/content_types/' + JSON.parse(fs.readFileSync('./entryConfig.json')).content_type + '/entries/' + eUid + '/import?locale=' + eLocale,
            headers: {
                'api_key': conf.API_KEY,
                'authorization': conf.MANAGEMENT_TOKEN,
                ...data.getHeaders()
            },
            data: data
        };
    
        const delay = time => new Promise(resolve => setTimeout(resolve, time));
        	await delay(300);
        	axios(config)
        	.then(function (response) {
    			console.log(JSON.stringify(response.data));
    			fs.unlinkSync(dir + jsonfile);
			})
        	.catch(function (error) {
        		console.log(error);
    		});   
        }
    })();
}
function updateAsset(){
    //const entryConfig = require('./entryConfig.json')
	var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
	var data = JSON.stringify({
        query: `query($filename: String!){
      
          all_assets(
              where:{filename: $filename, description: "NEEDS TO BE TRANSLATED"}
          )
          {   
              items{
                  filename
                  system{
                      uid
                  }
              }
          }
      }`,
        variables: {
            "filename": zipFileName
        }
      });
      
      var config = {
        method: 'post',
        url: 'https://graphql.contentstack.com/stacks/'+conf.API_KEY+'?environment='+conf.ENVIRONMENT,
        headers: { 
          'access_token': conf.DELIVERY_TOKEN, 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
      axios(config)
      .then(function (response) {
        var assetExistsUID = response.data.data.all_assets.items[0].system.uid;

          
      var data = new FormData();
          data.append('asset[upload]', fs.createReadStream(zipDir + zipFileName));
          
          var config = {
            method: 'put',
            url: 'https://api.contentstack.io/v3/assets/' + assetExistsUID,
            headers: { 
              'api_key': conf.API_KEY, 
              'authorization': conf.MANAGEMENT_TOKEN, 
              'Content-Type': 'multipart/form-data', 
              ...data.getHeaders()
            },
            data : data
          };
          
          axios(config)
          .then(function (response) {
            console.log(response.data.notice);
			var version = response.data.asset._version;
			var publishUID = response.data.asset.uid;

			publishAsset(publishUID, version)
          })
          .catch(function (error) {
            console.log(error);
          });
      
      })
      .catch(function (error) {
        console.log(error);
      });
}
function addAsset(){
    //const entryConfig = require('./entryConfig.json')
	var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
	var data = new FormData();
    data.append('asset[upload]', fs.createReadStream(zipDir + zipFileName));
    data.append('asset[parent_uid]', conf.FOR_TRANSLATION_ASSET_FOLDER.FOLDER_UID);
    data.append('asset[description]', 'NEEDS TO BE TRANSLATED');
    
    var config = {
      method: 'post',
      url: 'https://api.contentstack.io/v3/assets',
      headers: { 
        'api_key': conf.API_KEY, 
        'authorization': conf.MANAGEMENT_TOKEN, 
        'Content-Type': 'multipart/form-data', 
    ...data.getHeaders()
      },
      data : data
    };
    
    axios(config)
    .then(function (response) {
      var res = (JSON.stringify(response.data));
      var obj = JSON.parse(res);
      
      console.log(JSON.stringify(response.data.notice));
	  var version = response.data.asset._version;
      var publishUID = response.data.asset.uid;
      //console.log(publishUID)

      //console.log(obj.asset.filename);
      publishAsset(publishUID, version);
    })
    .catch(function (error) {
          console.log(error);
    });
    
};
function publishAsset(publishUID, version){
	//const entryConfig = require('./entryConfig.json')
	//var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
var axios = require('axios');
      var data = JSON.stringify({
        "asset": {
          "locales": [
            "en-us"
          ],
          "environments": [
            conf.ENVIRONMENT
          ]
        },
        "version": version,
        "scheduled_at": "2019-02-08T18:30:00.000Z"
      });
    
      var config = {
        method: 'post',
        url: "https://api.contentstack.io/v3/assets/" + publishUID +"/publish",
        headers: { 
          'api_key': conf.API_KEY, 
          'authorization': conf.MANAGEMENT_TOKEN, 
          'Content-Type': 'application/json'
        },
        data : data
      };
   
      
      axios(config)
      .then(function (response) {
        console.log(response.data.notice);
      })
      .catch(function (error) {
        console.log(error);
      });
    };
	const http = require('https'); // or 'https' for https:// URLs
const { compileFunction } = require("vm");

//const entryConfig = require('./entryConfig.json')
var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip'
var data = JSON.stringify({
    query: `query($filename: String!){

        all_assets(
            where:{filename: $filename, description: "NEEDS TO BE TRANSLATED"}
        )
        {   
            items{
                filename
                url
                system{
                    uid
                }
            }
        }
    }`,
      variables: {
        "filename": zipFileName
    }
});

function uploadLocalizedAsset(){
	//const entryConfig = require('./entryConfig.json')
	var zipFileName = JSON.parse(fs.readFileSync('./entryConfig.json')).content_type+'-'+JSON.parse(fs.readFileSync('./entryConfig.json')).entry_uid+'.zip' 
	const http = require('https'); // or 'https' for https:// URLs

	
	var axios = require('axios');
	var data = JSON.stringify({
		query: `query($filename: String!){
	
			all_assets(
				where:{filename: $filename, description: "READY TO LOCALIZE"}
			)
			{   
				items{
					filename
					url
					system{
						uid
					}
				}
			}
		}`,
		  variables: {
			"filename": zipFileName
		}
	});
	
	var config = {
	  method: 'post',
	  url: 'https://graphql.contentstack.com/stacks/'+conf.API_KEY+'?environment='+conf.ENVIRONMENT,
	  headers: { 
		'access_token': conf.DELIVERY_TOKEN, 
		'Content-Type': 'application/json'
	  },
	  data : data
	};
	
	axios(config)
	.then(function (response) {
	
		var assetURL = response.data.data.all_assets.items[0].url;
	
		const file = fs.createWriteStream("./public/uploads/"+zipFileName);
		const request = http.get(assetURL, function(response) {
	   response.pipe(file);
	
	   // after download completed close filestream
	   file.on("finish", () => {
		   file.close();
		   console.log("Download Completed");
	   });
	});
	})
	.catch(function (error) {
	  console.log(error);
	});
}
		

module.exports = { getentry, fromDir, importEntry, uploadLocalizedAsset };
