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
    body: JSON.stringify(body)
  };
};

module.exports.getMunicipio = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT distinct(mun), municipio, _source, _created_at, _edited_at, _del 
    FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_2020
  `;

  // Get Path Params
  let pathParameters = event['queryStringParameters'];
  // Log query
  console.log('Path Params: ', pathParameters);
  if (pathParameters){

    // If there's query available, filter by query value
    if (pathParameters.query){
      // Return if there's no value
      if (!pathParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(pathParameters.value);
      // Make query
      query += ` WHERE ${pathParameters.query} like '%${pathParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (pathParameters.start){
      // Return if there's no value
      if (isNaN(pathParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = pathParameters.start;
    }

    // add del
    if (pathParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
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

module.exports.getDistrito = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `
    SELECT distinct(dm), distrito_municipal, circ, _source, _created_at, _edited_at, _del
    FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_2020
  `;

  // Get Path Params
  let pathParameters = event['queryStringParameters'];
  // Log query
  console.log('Path Params: ', pathParameters);
  if (pathParameters){

    // If there's query available, filter by query value
    if (pathParameters.query){
      // Return if there's no value
      if (!pathParameters.value) global.exit(400, []);
      // Make sure it's a string
      String(pathParameters.value);
      // Make query
      query += ` WHERE ${pathParameters.query} like '%${pathParameters.value}%'`;
    }

    // If the start param has been passed (pagination)
    if (pathParameters.start){
      // Return if there's no value
      if (isNaN(pathParameters.start)) global.exit(400, []);
      // Return 50 records from the new start
      init.start = pathParameters.start;
    }

    // add del
    if (pathParameters.query){
      query += ` AND _del = 0`;
    } else {
      query += ` WHERE _del = 0`;
    }
    
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

module.exports.getCargo = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  let fields = [
    'cargo'
  ]

  let queries = [
    /* cargo municipal */
    'SELECT cargo, _source, _created_at, _edited_at, _del FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_2020 WHERE _del = 0 GROUP BY cargo',
    /* cargo vice */
    'SELECT cargo, _source, _created_at, _edited_at, _del FROM opendatadb.ELECCIONES_EXTRAORDINARIAS_MUNICIPALES_RESULTADOS_VICE_2020 WHERE _del = 0 GROUP BY cargo',
    /* cargo vice */
    'SELECT cargo, _source, _created_at, _edited_at, _del FROM opendatadb.PRESIDENCIALES_CONGRESIONALES_2020 WHERE _del = 0 GROUP BY cargo'
  ];

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
      init.start = pathParameters.start;
    } 
  }

  let municipal;
  let municipal_2 = await mysql.query(queries[1]);
  let presidencial = await mysql.query(queries[2]);

  try {
    municipal = await mysql.query(queries[0]);  
  } catch (error) {
    municipal = [{ statusMessage: 'bad-request' }];  
  }

  try {
    municipal_2 = await mysql.query(queries[1]);  
  } catch (error) {
    municipal_2 = [{ statusMessage: 'bad-request' }];  
  }

  try {
    presidencial = await mysql.query(queries[2]);  
  } catch (error) {
    presidencial = [{ statusMessage: 'bad-request' }];  
  }

  let res_queries = [{
    presidencial: presidencial,
    municipal: municipal,
    municipal_vice: municipal_2
  }];
  
  // Exit from lambda
  return global.exit(200, res_queries);  
};

module.exports.getProvincia = async event => {
  console.log('Event: ', event);

  let init = {
    start: 0,
    limit: 50
  }

  // Run your query
  let query = `SELECT provincia, _source, _created_at, _edited_at, _del FROM opendatadb.FUSIONES_COLEGIOS_07_2020 WHERE _del = 0 GROUP BY provincia`;

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
      init.start = pathParameters.start;
    }
    
  }  

  // add limit
  query += ` LIMIT ${init.start},${init.limit};`;

  // Log query
  console.log('Query: ', query);
  
  // Make query
  let results;
  try {
    results  = await mysql.query(query);  
    // Exit from lambda
    return global.exit(200, results);  
  } catch (error) {
    // Exit from lambda
    return global.exit(400, []);  
  }

};
