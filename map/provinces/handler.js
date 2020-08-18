"use strict";

const fs = require('fs')

global.exit = (code, body) =>{
  
  if (!code || !body) {
    code = 500,
    body = [{
      statusMessage: 'internal-error'
    }];
  } if (code == 400) {
    code = 400,
    body = [{
      statusMessage: 'bad-request'
    }];
  } if (code == 800) {
    code = 800,
    body = [{
      statusMessage: 'i stay warmed'
    }];
  } else {
    if (body.length === 0) {
      code = 404,
      body = [{
        statusMessage: 'not-found'
      }];
    } 
  }

  body.push({
    _length: body.length
  });
  
  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere 
      "Access-Control-Allow-Methods": "GET" // Allow only GET request 
    },
    body: JSON.stringify(body)
  };
};

module.exports.getProvinces =  async (event, callback) => {
  console.log('Event: ', event);

  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return global.exit(800, []);
  }

  try {
    // callback API
    let result = await fs.readFile('./data/config.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return err
        }
        console.log('File data:', jsonString) 
        return jsonString
    })

    // Exit from lambda
    return global.exit(200, result);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }

};