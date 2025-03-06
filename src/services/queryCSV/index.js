const transformCSV = require('../transformCSV');
const MiniSearch = require('minisearch');

const utils = require('../../utils');

const jsonSplitter = require('split-json');
const dir = require('node-dir');

const fs = require('fs');
const path = require('path');
const splitFile = require('split-file');

const Papa = require('papaparse');
const request = require("request");


const queryFile = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.cid) { reject('missing cid'); return;}
    if (!params.format) { reject('missing file format'); return;}
    if (!params.host) { reject('missing host'); return;}
    // file type
    const fileType = ['csv'];
    if (!fileType.includes(params.format)) { reject('format not available'); return; }
    // http://localhost:8000/services/transform-csv/ipfs/bafybeifds2zwfw7zn7gbh7oa2z23xyuyg6rbs6xizbsvxtg5xrfl4quo3u
    // set host on params as it's a IPFS file
    // console.log('queryFile - get params -----', params);
    const cors_anywhere = 'https://cors-aletheiadata.herokuapp.com';
    
      let url;
      if (params.host === 'ipfs'){
        // if it's IFPS file
        const file = params.cid + '.ipfs.dweb.link';  
        url = `https://${file}`
      } else if (params.host === 'http'){
        // WARNING: experimental feature
        // this queries on a remote file
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
        header: true,
        encoding: "latin1"
      };

      let contentType;
      let contentLenght;
      const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, options);
      const dataStream = request
        .get(url)
        .on('response', function(response) {
          contentType = response.headers['content-type'];
          contentLenght = response.headers['content-length'];
        })
        .pipe(parseStream);

      let data = [];
      let counter = 0;
      let fields;
      let miniSearch;
      let isTrueSet = query.info === 'true';
      parseStream.on("data", async chunk => {
        data.push(chunk);
        // add ids
        // get fields
        fields = Object.keys(chunk);
        // console.log('queryFile - get header fields: ', fields);
        // if info is tru, return all the info of the doc
        if (isTrueSet){
          return;
        }

        // queryFile
        if (!miniSearch){
          console.log('creating minisearch ------ ');
          miniSearch = new MiniSearch({
            fields: fields, // fields to index for full-text search
            storeFields: fields, // fields to return with search results
            searchOptions: {
              fuzzy: query.fuzzy ? query.fuzzy : 3
            } 
          })
        }

        // adding id to record
        chunk.id = counter;
        counter ++;

        // adding to minisearch
        await miniSearch.addAll([chunk]);
        // console.log('minisearch: ', miniSearch);
      });

      dataStream.on("finish", async () => {

        if (isTrueSet){
          // if set, return file's info
          return resolve({
            cid: params.cid,
            type: contentType,
            length: contentLenght,
            host: params.host,
            fields: fields
          });
        }
        
        // if data in empty = no file
        if (data.length == 0){
          return reject({
            code: 400,
            body: 'file not found'
          })
        }
        // Search with default options
        // Search only specific fields
        // init search, sorting, filtering
        let queryResult;
        console.log(`queryFile - query [${JSON.stringify(query)}]`);
        if (!query.fields && !query.value){
          // get all
          resolve(data);
          return;
        } else if (query){
          if (!query.fields){
            resolve('missing fields');
            return;
          }
          if (!query.value){
            resolve('missing value');
            return;
          }
          console.log(`queryFile - query on fields [${query.fields}]`);
          console.log(`queryFile - query value [${query.value}]`);
          // get array from query string
          const query_fields = query.fields.split(',');
          query_fields.map((qf)=>{
            // check if the field pass exists on the file
            if (!fields.includes(qf)){
              console.log(fields.includes(qf));
              resolve('one or more fields are not valid');
              return;
            }
          })
          console.log(`queryFile - query fields ${JSON.stringify(query_fields)}`);
          // get number of results
          queryResult = await miniSearch.search(query.value, { fields: query_fields });
          // console.log('here -----> ', queryResult);
          if (queryResult.length > 0){
            // order by
            if (query.order){
              const orderParts = (query.order).split(':');
              /**
               * orderParts[0] = field
               * orderParts[1] = order (asc/desc)
               */
              console.log(`queryFile - query order by user [${query.order}]`);
              queryResult = await queryResult.sort(function(a, b) { 
                return a[orderParts[0]] - b[orderParts[0]];
              });
              
              if (orderParts[1]){
                console.log(`queryFile - query order by [${orderParts[0]} : ${orderParts[1]}]`);
                switch (orderParts[1]) {
                  case 'asc':
                    queryResult = queryResult;
                    break;
                  case 'desc':
                    queryResult = queryResult.reverse();
                    break;
                  default:
                    queryResult = queryResult;
                    break;
                }
              } else {
                console.log(`queryFile - query order by [${orderParts[0]} : ${orderParts[1]}]`);
                queryResult = queryResult.reverse();
              }
            } else {
              console.log('queryFile - query order default [ID]');
              queryResult = queryResult.sort(function(a, b) { 
                return a['id'] - b['id'];
              });
            }
            // limit by
            query.start = query.start ? query.start : 0;
            if ((query.limit !== '0' && query.limit !== 0) && query.limit){
              console.log(`queryFile - query limit [${query.limit}]`);
              console.log(`queryFile - query start [${query.start}]`);
              if (!utils.isNumber(query.limit)) {
                if (query.limit !== 'none'){
                  resolve('limit not valid');
                  return;
                } else {
                  // check if limit = 'none', if so give all results
                  console.log('queryFile - CAUTION - query without limit');
                  queryResult = queryResult.slice(0, query.limit);
                }
              } else {
                console.log(`queryFile - query limit by user [start: ${query.start} - limit: ${query.limit}]`);
                queryResult = queryResult.slice(query.start,parseInt(query.start)+parseInt(query.limit));
              }
            } else {
              // default: 25 results
              console.log('queryFile - query default limit [25 records]', query.start);
              queryResult = queryResult.slice(query.start,parseInt(query.start)+25);
            }
          }
          
          // return result
          return resolve(queryResult);
          
        }
      });
  });
};

module.exports = {
  queryFile
}