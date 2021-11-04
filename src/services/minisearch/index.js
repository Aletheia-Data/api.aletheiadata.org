const transformCSV = require('../transformCSV');
const MiniSearch = require('minisearch');

const utils = require('../../utils');

const queryFile = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.cid) { reject('missing cid'); return;}
    if (!params.type) { reject('missing file type'); return;}
    if (!params.host) { reject('missing host'); return;}
    // file type
    const fileType = ['json'];
    if (!fileType.includes(params.type)) { reject('wrong type'); return; }
    // http://localhost:8000/services/transform-csv/ipfs/bafybeifds2zwfw7zn7gbh7oa2z23xyuyg6rbs6xizbsvxtg5xrfl4quo3u
    // set host on params as it's a IPFS file
    // console.log('queryFile - get params -----', params);
    try {
      const getJsonFromCID = await transformCSV.CSVtoJSON(params);
      let data = getJsonFromCID.body;
      // console.log('data: ', data);
      if (data){
        // add ids
        /* TODO: understand what to do with r.Nombre */
        data.map((r, i) => { r.id = i; if (r.Nombre) return r; });
        // get fields
        const fields = Object.keys(getJsonFromCID.body[0]);
        console.log('queryFile - get header fields: ', fields);
        // if info is tru, return all the info of the doc
        var isTrueSet = (query.info === 'true');
        if (isTrueSet){
          resolve({
            cid: params.cid,
            fileType: params.type,
            host: params.host,
            fields: fields
          });
          return;
        }
        // queryFile
        miniSearch = new MiniSearch({
          fields: fields, // fields to index for full-text search
          storeFields: fields, // fields to return with search results
          searchOptions: {
            fuzzy: 3
          } 
        })
        // Index all documents
        miniSearch.addAll(data);
        // Search with default options
        // Search only specific fields
        // init searchm, sorting, filtering
        let queryResult;
        console.log('query: ', query);
        if (!query.fields && !query.value){
          // get all
          console.log('queryFile - CAUTION - query without limit');
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
              resolve('one or more fields are not valid');
              return;
            }
          })
          // get number of results
          if (query.limit){
            console.log('queryFile - query limit: ', query.limit);
            if (!utils.isNumber(query.limit)) {
              resolve('limit not valid');
              return;
            }
            // check if limit = 'none', if so give all results
            if (query.limit === 'none'){
              console.log('queryFile - CAUTION - query without limit');
              queryResult = await miniSearch.search(query.value, { fields: query_fields });
            } else {
              console.log('queryFile - query limit by user');
              queryResult = await miniSearch.search(query.value, { fields: query_fields }).slice(0, query.limit);
            }
          } else {
            // default: 25 results
            console.log('queryFile - query default limit: 25 records');
            queryResult = await miniSearch.search(query.value, { fields: query_fields }).slice(0, 25);
          }
        }
        // return result
        resolve(queryResult);
        return;
      } else {
        reject('no data from cid ------');
        return;
      }
      // make query with 
    } catch (error) {
      reject(error)
      return;
    }
  });
};

module.exports = {
  queryFile
}