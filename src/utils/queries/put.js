const axios = require('axios');
const api_endpoint = process.env.API_ENDPOINT;

exports.doneImport = ((id, documents, total_docs_errors, docs_imported)=>{
    return new Promise((resolve, reject) => {
      // save document
      return axios.put(`${api_endpoint}/imports/${id}`, {
        "status": "done",
        "download_errors": total_docs_errors,
        "download_errors_count": total_docs_errors.length,
        "docs_imported": docs_imported,
        "documents": documents,
      })
      .then(function (response) {
        console.log('starting import: ', response.data.id);
        // before closing save images
        resolve(response);
        return
      })
      .catch(error => {
        console.log('import done failed: ', error);
        reject(error)
        return
      })

    })
  }); 

  exports.saveCID = ((id, cid, type, ext)=>{
    return new Promise((resolve, reject) => {

        let data =  {
            "type": type,
            "ext": ext
        };

        if (cid) { data.cid = cid };
        // save document
        console.log('saving CID for doc: ', cid, ' - ', id);
        console.log('saving CID with type: ', type);
        return axios.put(`${api_endpoint}/alexandrias/${id}`, data)
        .then(function (response) {
            const item_id = response.data.id;
            // before closing save images
            resolve(item_id);
            return
        })
        .catch(error => {
            console.log('aletheia failed ---------');
            reject(error)
            return
        })

    })
}); 