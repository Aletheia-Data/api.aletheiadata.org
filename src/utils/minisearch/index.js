const transformCSV = require('../transformCSV');
const MiniSearch = require('minisearch');

const queryFile = async (params, query) => {
  //console.log('getting params and query: ', params, query);
  if (
    !params.type || 
    !params.cid
  ) {
    return res.send({
      code: 400,
      body: 'missing params'
    })
  }

  if (
    !query ||
    !query.fields ||
    !query.value
  ) {
    return {
      code: 400,
      body: 'missing query'
    }
  }

  return new Promise(async (resolve, reject) => {
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
        // init minisearch
        miniSearch = new MiniSearch({
          fields: fields, // fields to index for full-text search
          storeFields: fields, // fields to return with search results
          searchOptions: {
            fuzzy: 0.15
          }
        })
        // Index all documents
        miniSearch.addAll(data);
        console.log('done init minisearch -------');
        // Search with default options
        // Search only specific fields
        // init searchm, sorting, filtering
        console.log('init minisearch - query on fields: ', query.fields);
        console.log('init minisearch - query value: ', query.value);
        let queryResult = miniSearch.search(query.value, { fields: [query.fields] })
        // return result
        resolve(queryResult);
      } else {
        reject('no data from cid ------');
      }
      // make query with 
    } catch (error) {
      reject(error)
    }
  });
};

module.exports = {
  queryFile
}