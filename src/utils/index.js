var fs = require('fs');
var path = require('path');
const Downloader = require('nodejs-file-downloader');

exports.isNumber = (n) => { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }

// function to encode file data to base64 encoded string
exports.base64_encode = (file) => {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer.from(bitmap).toString('base64');
}

exports.downloadFile = (fileName, fileUrl, outputLocationPath) =>{
    return new Promise(async (resolve, reject)=> {

        const downloader = new Downloader({     
            url: fileUrl,     
            directory: outputLocationPath,
            fileName: fileName
        })   

        try {
          
          await downloader.download();
          // const file = await fs.readFileSync(`${outputLocationPath}/${fileUrl}`, {encoding: 'base64'})
          //If the download is cancelled, the promise will not be resolved, so this part is never reached
          resolve(fileUrl);
      
        } catch (error) {//When the download is cancelled, 'ERR_REQUEST_CANCELLED' error is thrown. This is how you can handle cancellations in your code.
          reject('downloaded failed: ', fileUrl, error)
        }
      
    });
}

exports.validSource = (source) => {
  const valid_source = [
    'datos-abiertos'
  ];
  
  if (!valid_source.includes(source)) { return false }

  return true;
}