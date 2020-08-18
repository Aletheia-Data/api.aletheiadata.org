"use strict";

const { Client } = require('@elastic/elasticsearch');

let token = Buffer.from(`${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PWD}`, 'utf8').toString('base64');
const client = new Client({ node: `${process.env.ELASTICSEARCH_ENDPOINT}`, 
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Basic ${token}`
  } 
});

// Require and initialize outside of your main handler
const mysql = require("serverless-mysql")({
  config: {
    host: process.env.ENDPOINT,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
});

global.exit = (code, body) => {
  if (!code || !body) {
    (code = 500),
      (body = [
        {
          statusMessage: "internal-error",
        },
      ]);
  }
  if (code == 400) {
    (code = 400),
      (body = [
        {
          statusMessage: "bad-request",
        },
      ]);
  } else {
    if (body.length === 0) {
      (code = 404),
        (body = [
          {
            statusMessage: "not-found",
          },
        ]);
    }
  }

  body.push({
    _length: body.length,
  });

  // Run close connection
  mysql.quit();

  return {
    statusCode: code,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*", // Allow from anywhere 
      "Access-Control-Allow-Methods": "GET" // Allow only GET request 
    },
    body: JSON.stringify(body),
  };
};

module.exports.getElecciones = async (event) => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  let queries = [
    /* municipal */
    'SELECT * FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_2020',
    /* vice */
    'SELECT * FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_VICE_2020'
  ];

  // Get Path Params
  let pathParameters = event['pathParameters'];
  // Log Params
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // Check if there's year and it's valid
    if (pathParameters.year){
      let year = parseInt(pathParameters.year);
      // if the year is not available, return message
      if (
        year !== 2020
      ){
        return global.exit(404, []);
      }
    }
  }

  // Make query
  let res_q = [];
  queries.forEach(query => {
    let queryStringParameters = event['queryStringParameters'];
    // Log Params
    console.log('Query Params: ', queryStringParameters);
    if (queryStringParameters){
      // Return if there's no value or query
      if ((!queryStringParameters.value || !queryStringParameters.value) && !queryStringParameters.start) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // If the start param has been passed (pagination)
      if (queryStringParameters.start){
        // Return if there's no value
        if (isNaN(queryStringParameters.start)) global.exit(400, []);
        // Return 50 records from the new start
        init.start = queryStringParameters.start;
      }
      // add del
      if (queryStringParameters.query){
        // Make query
        query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;  
        query += ` AND _del = 0`;
      } else {
        query += ` WHERE _del = 0`;
      }
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
      
    } else{
      // add del
      query += ` WHERE _del = 0`;
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
    }
  });

  // update queries
  queries = res_q;

  let municipal;
  try {
    municipal = await mysql.query(queries[0]);  
    municipal.push({ _length: municipal.length });
  } catch (error) {
    municipal = [{ statusMessage: 'bad-request' }];  
  }

  let municipal_2;
  try {
    municipal_2 = await mysql.query(queries[1]);  
    municipal_2.push({ _length: municipal_2.length });
  } catch (error) {
    municipal_2 = [{ statusMessage: 'bad-request' }];  
  }

  let res_queries = [{
    municipal: municipal,
    municipal_vice: municipal_2
  }];
  
  // Exit from lambda
  return global.exit(200, res_queries);  
};

module.exports.getEleccionesMunicipales = async (event) => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  let queries = [
    /* municipal */
    'SELECT * FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_2020',
    /* vice */
    'SELECT * FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_VICE_2020'
  ];


  // Get Path Params
  let pathParameters = event['pathParameters'];
  // Log Params
  console.log('Path Params: ', pathParameters);
  if (pathParameters){
    // Check if there's year and it's valid
    if (pathParameters.year){
      let year = parseInt(pathParameters.year);
      // if the year is not available, return message
      if (
        year !== 2020
      ){
        return global.exit(404, []);
      }
    }
  }

  // Make query
  let res_q = [];
  queries.forEach(query => {
    let queryStringParameters = event['queryStringParameters'];
    // Log Params
    console.log('Query Params: ', queryStringParameters);
    if (queryStringParameters){
      // Return if there's no value or query
      if ((!queryStringParameters.value || !queryStringParameters.value) && !queryStringParameters.start) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // If the start param has been passed (pagination)
      if (queryStringParameters.start){
        // Return if there's no value
        if (isNaN(queryStringParameters.start)) global.exit(400, []);
        // Return 50 records from the new start
        init.start = queryStringParameters.start;
      }
      // add del
      if (queryStringParameters.query){
        // Make query
        query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;  
        query += ` AND _del = 0`;
      } else {
        query += ` WHERE _del = 0`;
      }
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
      
    } else{
      // add del
      query += ` WHERE _del = 0`;
      // add limit
      query += ` LIMIT ${init.start},${init.limit};`;
      // Log query
      console.log('Query: ', query);
      // Push new query
      res_q.push(query);
      queries = res_q;
    }
  });

  // update queries
  queries = res_q;

  let municipal;
  try {
    municipal = await mysql.query(queries[0]);  
    municipal.push({ _length: municipal.length });
  } catch (error) {
    municipal = [{ statusMessage: 'bad-request' }];  
  }

  let municipal_2;
  try {
    municipal_2 = await mysql.query(queries[1]); 
    municipal_2.push({ _length: municipal_2.length }); 
  } catch (error) {
    municipal_2 = [{ statusMessage: 'bad-request' }];  
  }

  let res_queries = [{
    municipal: municipal,
    municipal_vice: municipal_2
  }];
  
  // Exit from lambda
  return global.exit(200, res_queries);
};

module.exports.getEleccionesPresidenciales = async (event) => {
  
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return global.exit(800, []);
  }

  let init = {
    index: 'jce-ganadores-elecciones-jul-2020',
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
  /*
  let query = {
    "match_all": {}
  };
  */

  let query = {
    match: {
      PROVINCIA: 'NACIONAL'
    }
  };

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

module.exports.getEleccionesCongresuales = async (event) => {
  
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return global.exit(800, []);
  }

  let init = {
    index: 'jce-ganadores-elecciones-jul-2020',
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
    let value = pathParameters.value;
    query = {
      match: {
        [pathParameters.query] : value.toUpperCase() 
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
