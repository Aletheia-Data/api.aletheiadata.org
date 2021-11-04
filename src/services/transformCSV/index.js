
const Papa = require('papaparse');
const request = require("request");

const CSVtoJSON = async function(params) {
  console.log('getting params: ', params);
  if (!params.cid || !params.host) {
      return {
        code: 400,
        body: 'missing params'
      }
  }

  const cors_anywhere = 'https://cors-aletheiadata.herokuapp.com';
  
  let url;
  if (params.host === 'ipfs'){
    // if it's IFPS file
    const file = params.cid + '.ipfs.dweb.link';  
    url = `https://${file}`
  } else if (params.host === 'http'){
    // if it's IFPS file
    url = `${cors_anywhere}/${params.cid}`
  } else {
    console.log('type: ', params.host);
    return {
      code: 400,
      body: 'wrong type'
    }
  }

  console.log('transforming file from url: ', url);
  
  const options = {
    header: true
  };

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, options);
  const dataStream = request
    .get(url)
    .pipe(parseStream);

  let data = [];
  parseStream.on("data", chunk => {
    data.push(chunk);
  });

  return new Promise((resolve, reject) => {

    dataStream.on("finish", () => {
      
      if (data.length == 0){
        return reject({
          code: 400,
          body: 'file not found'
        })
      }
  
      return resolve({
        code: 200,
        body: data
      });
    });


  });

}


module.exports = {
  CSVtoJSON
}