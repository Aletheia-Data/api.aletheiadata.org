const transformCSV = require('../transformCSV');
const MiniSearch = require('minisearch');

const queryFile = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (
      !params.type || 
      !params.cid
    ) {
      reject('missing params');
      return;
    }

    // http://localhost:8000/utils/transform-csv/ipfs/bafybeifds2zwfw7zn7gbh7oa2z23xyuyg6rbs6xizbsvxtg5xrfl4quo3u
    // set host on params as it's a IPFS file
    params.host = 'ipfs';
    console.log('getting json from cid -----', params.cid);
    try {
      const getJsonFromCID = await transformCSV.CSVtoJSON(params);
      let data = getJsonFromCID.body;
      // console.log('data: ', data);
      if (data){
        // add ids
        data.map((r, i) => { r.id = i; if (r.Nombre) return r; });
        // get fields
        let fields = Object.keys(getJsonFromCID.body[0]);
        console.log('init minisearch - get header fields: ', fields);
        // if info is tru, return all the info of the doc
        var isTrueSet = (query.info === 'true');
        if (isTrueSet){
          resolve({
            cid: params.cid,
            fields: fields
          });
          return;
        }
        // init minisearch
        miniSearch = new MiniSearch({
          fields: fields, // fields to index for full-text search
          storeFields: fields, // fields to return with search results
          searchOptions: {
            fuzzy: 3
          } 
        })
        // Index all documents
        miniSearch.addAll(data);
        console.log('done init minisearch -------');
        // Search with default options
        // Search only specific fields
        // init searchm, sorting, filtering
        let queryResult;
        if (query){
          if (!query.fields){
            resolve('missing fields');
            return;
          }
          if (!query.value){
            resolve('missing value');
            return;
          }
          console.log('init minisearch - query on fields: ', query.fields);
          console.log('init minisearch - query value: ', query.value);
          // get array from query string
          const fields = query.fields.split(',');
          console.log('getting fields: ', fields);
          // get number of results
          if (query.limit){
            console.log('init minisearch - query limit: ', query.limit);
            const isNumber = (n) => { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
            console.log('num: ', isNumber(query.limit));
            if (!isNumber(query.limit)) {
              resolve('limit not valid');
              return;
            }
            // check if limit = 'none', if so give all results
            if (query.limit === 'none'){
              queryResult = await miniSearch.search(query.value, { fields: fields });
            } else {
              queryResult = await miniSearch.search(query.value, { fields: fields }).slice(0, query.limit);
            }
          } else {
            // default: 25 results
            queryResult = await miniSearch.search(query.value, { fields: fields }).slice(0, 25);
          }
        } else {
          // get all
          queryResult = await miniSearch.search('', { fields: [''] })  
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