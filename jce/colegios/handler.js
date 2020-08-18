"use strict";

// Require and initialize outside of your main handler
const mysql = require('serverless-mysql')({
  config: {
    host     : process.env.ENDPOINT,
    port     : process.env.PORT,
    database : process.env.DATABASE,
    user     : process.env.USERNAME,
    password : process.env.PASSWORD
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

  // Run close connection
  mysql.quit();
  
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

module.exports.getColegios = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT * FROM opendatadb.FUSIONES_COLEGIOS_07_2020
  `;

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

  let queryStringParameters = event['queryStringParameters'];
  // Log Params
  console.log('Query Params: ', queryStringParameters);
  if (queryStringParameters){
    // If there's query available, filter by query value
    if (queryStringParameters.query){
      // Return if there's no value
      if (!queryStringParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // Make query
      query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (queryStringParameters.start){
      // Return if there's no value
      if (isNaN(queryStringParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = queryStringParameters.start;
    }

    // add del
    if (queryStringParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
  } else {
    // add del
    query += ` WHERE _del = 0`;
  }  

  // add limit
  query += ` LIMIT ${init.start},${init.limit};`;

  // Log query
  console.log('Query: ', query);
  
  // Make query
  let results;
  try {
    results = await mysql.query(query); 
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }
  
};

module.exports.getRecintos = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT * FROM (
      (SELECT distinct(descripcion_recinto) as recinto, _source, _created_at, _edited_at, _del FROM opendatadb.FUSIONES_COLEGIOS_07_2020)
      UNION
      (SELECT distinct(descripcion_recinto_2) as recinto, _source, _created_at, _edited_at, _del FROM opendatadb.FUSIONES_COLEGIOS_07_2020)
    ) collection
  `;

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

  let queryStringParameters = event['queryStringParameters'];
  // Log Params
  console.log('Query Params: ', queryStringParameters);
  if (queryStringParameters){
    // If there's query available, filter by query value
    if (queryStringParameters.query){
      // Return if there's no value
      if (!queryStringParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // Make query
      query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (queryStringParameters.start){
      // Return if there's no value
      if (isNaN(queryStringParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = queryStringParameters.start;
    }

    // add del
    if (queryStringParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
  } else {
    // add del
    query += ` WHERE _del = 0`;
  }  

  // add limit
  query += ` LIMIT ${init.start},${init.limit};`;

  // Log query
  console.log('Query: ', query);
  
  // Make query
  let results;
  try {
    results = await mysql.query(query); 
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }
  
};

module.exports.getSectores = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT * FROM (
        (SELECT distinct(descripcion_sector) as sector, _source, _created_at, _edited_at, _del FROM opendatadb.FUSIONES_COLEGIOS_07_2020)
        UNION
        (SELECT distinct(descripcion_sector_2) as sector, _source, _created_at, _edited_at, _del FROM opendatadb.FUSIONES_COLEGIOS_07_2020)
    ) collection
  `;

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

  let queryStringParameters = event['queryStringParameters'];
  // Log Params
  console.log('Query Params: ', queryStringParameters);
  if (queryStringParameters){
    // If there's query available, filter by query value
    if (queryStringParameters.query){
      // Return if there's no value
      if (!queryStringParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(queryStringParameters.value);
      // Make query
      query += ` WHERE ${queryStringParameters.query} like '%${queryStringParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (queryStringParameters.start){
      // Return if there's no value
      if (isNaN(queryStringParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = queryStringParameters.start;
    }

    // add del
    if (queryStringParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
  } else {
    // add del
    query += ` WHERE _del = 0`;
  }  

  // add limit
  query += ` LIMIT ${init.start},${init.limit};`;

  // Log query
  console.log('Query: ', query);
  
  // Make query
  let results;
  try {
    results = await mysql.query(query); 
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }
  
};