const Papa = require('papaparse');
const request = require("request");

exports.exit = function(code, message){

  return res.send({
    code: code,
    body: message
  })
  
}

exports.transformCSV = async function(req, res) {
  if (!req.params.url || !req.params.type) {
      return res.send({
        code: 400,
        body: 'missing params'
    })
  }

  const cors_anywhere = 'https://cors-aletheiadata.herokuapp.com';
  
  let url;
  if (req.params.type === 'ipfs'){
    // if it's IFPS file
    const file = req.params.url + '.ipfs.dweb.link';  
    url = `https://${file}`
  } else if (req.params.type === 'html'){
    // if it's IFPS file
    url = `${cors_anywhere}/${req.params.url}`
  } else {
    console.log('type: ', req.params.type);
    return res.send({
      code: 400,
      body: 'wrong type'
    })
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

  dataStream.on("finish", () => {
    if (data.length == 0){
      // console.log(data);
      return res.send({
        code: 400,
        body: 'file not found'
      })
    }

    return res.send({
      code: 200,
      body: data
    });
  });
  
};