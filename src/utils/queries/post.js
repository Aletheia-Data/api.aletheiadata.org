const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const api_endpoint = process.env.API_ENDPOINT;

exports.createDepartment =  (( issuer )=>{
    return new Promise((resolve, reject) => {
      return axios.post(`${api_endpoint}/departments`, {
        "name": issuer.name,
        "description": issuer.description,
        "website": issuer.url
      }).then(function(department) {
        resolve(department);
        return;
      })
      .catch(function (error) {
        reject(error);
        return;
      }); 
    })
  });

  exports.createSource =  (( source, sourceInfo )=>{
    return new Promise((resolve, reject) => {
      return axios.post(`${api_endpoint}/sources`, {
        "url": source,
        "name": sourceInfo.url,
        "description": sourceInfo.description,
        "status": "under_review",
      }).then(function(department) {
        resolve(department);
        return;
      })
      .catch(function (error) {
        reject(error);
        return;
      }); 
    })
  });

  exports.createImport = (( asset, source, type )=>{
    return new Promise((resolve, reject) => {
      // save document
      return axios.post(`${api_endpoint}/imports`, {
        "source": source,
        "type": type,
        "wallet": asset.owner,
        "status": "in_progress"
      })
      .then(function (response) {
        console.log('starting import: ', response.data.id);
        // before closing save images
        resolve(response.data);
        return
      })
      .catch(error => {
        console.log('import failed: ', error);
        reject(error)
        return
      })

    })
  }); 

  exports.createAsset = ((asset, importId)=>{
    return new Promise((resolve, reject) => {
      // save document
      console.log('saving document: ', asset);
      return axios.post(`${api_endpoint}/alexandrias`, {
          "title": asset.title,
          "description": asset.description ? asset.description : 'none',
          "source_url": asset.docSource,
          "original_url": asset.originalUrl ? asset.originalUrl : asset.docSource,
          "source": asset.sourceId,
          "import": importId,
          "status": "under_review",
          "wallet_address": asset.owner,
          "department": asset.issuerId,
          "category": asset.categoryId,
          "api_enabled": false
      })
      .then(function (response) {
          const item_id = response.data.id;
          resolve(item_id);
          return
      })
      .catch(error => {
          console.log('aletheia failed: ', error);
          reject(error)
          return
      })

    })
  }); 


  exports.uploadAsset = ((asset, item, field)=>{
    console.log(`uploading file to ${field}`);
    return new Promise(async (resolve, reject) => {
        // uploading file
        const form = new FormData();
        var decodedFile = new Buffer.from(asset.data, 'base64');
        console.log(asset);
        await fs.writeFile(`./temp/${item}`, decodedFile, async function (err) {
          if (err) {
            console.log(err)
            reject(err)
            return err
          };
          form.append('files', fs.createReadStream(`./temp/${item}`));
          // form.append('files', decodedFile);
          form.append('ref', 'alexandria');
          form.append('refId', item);
          form.append('field', field);

          console.log('uploading file with id: ', item);
          // console.log('uploading file with field: ', field);
          // console.log('uploading file form: ', form);
          // console.log('headers: ', form.getHeaders());                
          // Display the key/value pairs
          await axios.post(`${api_endpoint}/upload`, form, {
            headers: { 
              ...form.getHeaders()
            },
          }).then(r => {
              console.log('uploaded file: ', r.data[0].url);
              var pathArray = r.data[0].url.split( '/' );
              var host = pathArray[2];
              var cid = host.split( '.' )[0];
              resolve(cid);
          })
          .catch(error => {
              console.log('upload failed --------', JSON.stringify(error));
              let exit = {
                action: 'uploadFile',
                item: item,
                reason: error
              }
              response_exit.errors.push(exit);
              reject(error)
          })
          // delete file
          await fs.unlink(`./temp/${item}`, (err) => {
            if (err) throw err;
            console.log(`successfully deleted /temp/${item}`);
          });
        });
    })
  });


