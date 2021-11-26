const transformCSV = require('../transformCSV');
const MiniSearch = require('minisearch');

const utils = require('../../utils');

const jsonSplitter = require('json-splitter');
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
    if (!params.type) { reject('missing file type'); return;}
    if (!params.host) { reject('missing host'); return;}
    // file type
    const fileType = ['csv'];
    if (!fileType.includes(params.type)) { reject('wrong type'); return; }
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
        chunk.id = `record_${counter}`;
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
        console.log('query: ', query);
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
          console.log('queryFile - query on fields: ', query.fields);
          console.log('queryFile - query value: ', query.value);
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
          console.log('queryFile - query fields: ', query_fields);
          // get number of results
          if (query.limit){
            console.log('queryFile - query limit: ', query.limit);
            if (!utils.isNumber(query.limit)) {
              if (query.limit !== 'none'){
                resolve('limit not valid');
                return;
              } else {
                // check if limit = 'none', if so give all results
                console.log('queryFile - CAUTION - query without limit');
                queryResult = await miniSearch.search(query.value, { fields: query_fields });
              }
            } else {
              console.log('queryFile - query limit by user', query.limit);
              queryResult = await miniSearch.search(query.value, { fields: query_fields }).slice(0, query.limit);
            }
          } else {
            // default: 25 results
            console.log('queryFile - query default limit: 25 records');
            queryResult = await miniSearch.search(query.value, { fields: query_fields }).slice(0, 25);
          }
        }
        // return result
        return resolve(queryResult);
      });
  });
};

module.exports = {
  queryFile
}