"use strict";

const { Client } = require('@elastic/elasticsearch');

let token = Buffer.from(`${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PWD}`, 'utf8').toString('base64');
const client = new Client({ node: `${process.env.ELASTICSEARCH_ENDPOINT}`, 
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Basic ${token}`
  } 
});

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

module.exports.getAll =  async (event, callback) => {
  console.log('Event: ', event);

  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return global.exit(800, []);
  }

  let init = {
    index: 'aletheiadata',
    from: 0,
    size: 50
  }

  // Get Path Params
  let pathParameters = event['queryStringParameters'];
  // Log query
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // If the start param has been passed (pagination)
    if (pathParameters.start){
      // Return if there's no value
      if (isNaN(pathParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.from = pathParameters.start;
    }
  } 

  // Log query
  let query = {
    "match_all": {}
  };

  if (pathParameters){
    query = {
      match: {
        [pathParameters.query] : pathParameters.value 
      }
    };
  }

  console.log('query: ', query);

  try {
    // callback API
    let result = await client.search({
      index: init.index,
      from: init.from,
      size: init.size,
      body: {
        query
      }
    })

    let hits = result['body']['hits']['hits'];  
    // Exit from lambda
    return global.exit(200, hits);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }

};