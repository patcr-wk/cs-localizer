# Contentstack Entry Zipper & Localization Handler

> This is a full stack React-Express file handler for Loaclization in Contentstack and must be run as a sidebar extension from within Contentstack
</br>
This app will post environmental variable from the entry within Contentstack VIA to the entryConfig.json file in the root directory of the express server on page load.
using the ContentstackConfig.json and the entryConfig.json the app will query the stack for all installed languages and create a copy of the JSON for the entry for all country 
codes appending the contry code to the begining of the file name. (ex: en_us-bltd3826280138f5519) The app will then zip all the copies together add the zip file to the specified 
asset folder within Contentstack, publishes the asset to the development environment, and downloads a copy to the users local machine. In the case where they translations are being requested for 
an updated entry the app will update the exisitng asset in the specified asset folder within Contentstack, publish the new asset version to the development environment, and download the updated zip file to the users 
local machine. 
</br>
</br>
Once the zipped json files have been translated they should be uploaded to the specified Contentstack asset folder for "Translated Files" with the description "READY TO LOCALIZE" and published to the development environment. Now the user can click the localize button in the 
extension. The app will then find the translated files based on the entryConfig.json file and import the translations for each language.

## Contentstack Setup
### Add Asset Folders
Add two asset folders to your stack
    One for the zipped entry
    One for translated files

### Set Up Config File
Navigate to zip-client-main/contentstackConfig.json
update the Key Values to match your stack environment
### Set Up Extension In Contentstack
Install Extension in Contentstack
    &nbsp;&nbsp;&nbsp;Settings
    </br>&nbsp;&nbsp;&nbsp;Extenstions
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Add New
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sidebar
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Custom
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Name the extension Localization Handler
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Provide URL for Client Server
    </br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Save
    </br>
    </br>You Can Now use this App as a sidebar extension in any entry.

## Quick Start

```bash
# Install dependencies server/client
cd zip-client-main
npm install
cd zip-server-main
npm install

# Serve client on localhost:3000
cd zip-client-main
npm run start

# Serve Server on localhost:5000
cd zip-server-main
npm run start
```
