const utils = require('../../utils');

const processUrl = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.type) { reject('missing type'); return;}
    if (!params.url) { reject('missing url'); return;}
    // 
    try {
        resolve('done');
      // make query with 
    } catch (error) {
      reject(error)
      return;
    }
  });
};

module.exports = {
  processUrl
}