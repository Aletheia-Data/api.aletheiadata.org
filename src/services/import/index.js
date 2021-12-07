const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');
const axios = require('axios');
const FormData = require('form-data');

const sanitize = require('sanitize-filename');//Using this npm module to sanitize file names.
const fs = require('fs');
const path = require('path');

const utils = require('../../utils');

const _scraper = require('../../services/scraper');
const _screenshot = require('../../services/screenshot');

var mime = require('mime-types');

const importFromUrl = (params) => {
  // clean up folders
  fs.readdir('screenshot', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join('screenshot', file), err => {
        if (err) throw err;
      });
    }
  });

  fs.readdir('documents', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join('documents', file), err => {
        if (err) throw err;
      });
    }
  });

  fs.readdir('compress', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join('compress', file), err => {
        if (err) throw err;
      });
    }
  });

  fs.readdir('log/compress-images', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join('log/compress-images', file), err => {
        if (err) throw err;
      });
    }
  });

  const owner = process.env.WALLET_OWNER;
  const api_endpoint = process.env.API_ENDPOINT;

  return new Promise((resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.category) { reject('missing category'); return;}
    if (!params.value) { reject('missing value'); return;}
    if (!params.source) { reject('missing source'); return;}

    try {
      
      // call scrapper
      _scraper.processUrl(params)
      .then(async (data)=>{
        
        const { 
          title, 
          description, 
          startUrl,
          source, 
          original_source,
          body
        } = data;

        const info = body.data[0];
        const records = body.data[1];

        const response_exit = {
          errors: [],
          title, 
          description, 
          source, 
          original_source,
          documents: 0
        }

        let result = [];

        console.log(data);

        // start importing
        const startImport = (( source, type )=>{
          return new Promise((resolve, reject) => {
            // save document
            try {
              /*
              starting
              in_progress
              done
              */
              axios.post(`${api_endpoint}/imports`, {
                "source": startUrl,
                "type": type,
                "wallet": owner,
                "status": "in_progress"
              })
              .then(function (response) {
                console.log('starting import: ', response.data.id);
                // before closing save images
                resolve(response.data);
              })
              .catch(error => {
                console.log('upload failed: ', error);
                reject(error)
              })
      
            } catch (error) {
              console.log('upload doc failed: ', error);
              reject(error)
            }
      
          })
        }); 
      
        const doneImport = ((id, documents)=>{
          return new Promise((resolve, reject) => {
            // save document
            try {
              /*
              starting
              in_progress
              done
              */
              axios.put(`${api_endpoint}/imports/${id}`, {
                "status": "done",
                "documents": documents,
              })
              .then(function (response) {
                console.log('starting import: ', response.data.id);
                // before closing save images
                resolve(response);
              })
              .catch(error => {
                console.log('upload failed: ', error);
                reject(error)
              })
      
            } catch (error) {
              console.log('upload doc failed: ', error);
              reject(error)
            }
      
          })
        }); 

        // start importing
        const importItem = await startImport(source, 'collection');

        // checking department
        const checkDepartment =  (( original_source )=>{
          return new Promise((resolve, reject) => {
            return axios.get(`${api_endpoint}/departments?website=${original_source}`)
            .then(function (department) {
              resolve(department);
              return;
            })
            .catch(function (error) {
              reject(error);
              return;
            }); 
          })
        });

        const createDepartment =  (( title, description, original_source )=>{
          return new Promise((resolve, reject) => {
            return axios.post(`${api_endpoint}/departments`, {
              "name": title,
              "desciption": description,
              "website": original_source
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

        const hasDepartment = await checkDepartment(original_source);
        let depId;
        if ( hasDepartment.data.length > 0 ){
          depId = hasDepartment.data[0].id;
          console.log('editing department found: ', depId);
        } else {
          const newDep = await createDepartment(title, description, original_source);
          depId = newDep.data.id;
          console.log('created department: ', depId);
        } 

        // check source
        const checkSource =  (( source )=>{
          return new Promise((resolve, reject) => {
            return axios.get(`${api_endpoint}/sources?url=${source}`)
            .then(function (source) {
              resolve(source);
              return;
            })
            .catch(function (error) {
              reject(error);
              return;
            }); 
          })
        });

        const createSource =  (( source )=>{
          return new Promise((resolve, reject) => {
            return axios.post(`${api_endpoint}/sources`, {
              "url": source,
              "name": source,
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

        const hasSource = await checkSource(source);
        let sourceId;
        if ( hasSource.data.length > 0 ){
          sourceId = hasSource.data[0].id;
          console.log('source found: ', sourceId);
        } else {
          const newSrc = await createSource(source);
          sourceId = newSrc.data.id;
          console.log('created source: ', sourceId);
        } 

        console.log('dep id: ', depId);
        console.log('source id: ', sourceId);
        
        // after department's information
        for (let record of records.data) {
          
          const record_title = record.data.filter(item => item.name == 'doc_title')[0].data[0];
          const record_description = record.data.filter(item => item.name == 'doc_description')[0].data[0];
          const record_dataset_details = record.data.filter(item => item.name == 'dataset_details')[0].data[0];
          const record_documents = record.data.filter(item => item.name == 'documents')[0].data;
          
          let single_record = {
            record_title,
            record_description,
            record_dataset_details,
            record_documents: record_documents.length
          }
          
          result.push(single_record);
          console.log('importing record: ', single_record);

          // saving document on department
          const saveFiles = new Promise(async (resolve, reject) => {
            const importFiles = [];
            const importErrors = [];

            for (let document of record_documents) {
              const doc_source = document.address;
              const document_url = document.data[0].data[0];
              
              const saveDoc = (()=>{
                return new Promise((resolve, reject) => {
                  // save document
                  try {
                    console.log('saving document: ', doc_source);
                    axios.post(`${api_endpoint}/alexandrias`, {
                      "title": single_record.record_title,
                      "description": single_record.record_description,
                      "source_url": doc_source,
                      "source": sourceId,
                      "import": importItem.id,
                      "status": "under_review",
                      "wallet_address": owner,
                      "department": depId,
                      "api_enabled": false
                    })
                    .then(function (response) {
                      const item_id = response.data.id;
                      importFiles.push(item_id);
                      console.log('aletheia created: ', item_id);
                      // before closing save images
                      resolve(item_id);
                    })
                    .catch(error => {
                      console.log('upload failed: ', error);
                      response_exit.errors.push(error);
                      reject(error)
                    })
  
                  } catch (error) {
                    console.log('upload doc failed: ', error);
                    response_exit.errors.push(error);
                    reject(error)
                  }
  
                })
              }); 

              const saveCID = ((id, cid, type)=>{
                return new Promise((resolve, reject) => {
                  // save document
                  try {
                    console.log('saving CID for doc: ', cid, ' - ', id);
                    let res_type;
                    switch (type) {
                      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                        res_type = 'xlsx'
                        break;
                      case 'application/pdf':
                        res_type = 'pdf'
                        break;
                      case 'text/csv':
                        res_type = 'csv'
                        break;
                      default:
                        res_type = 'other'
                        break;
                    }
                    console.log('saving CID with type: ', type, ' - ', res_type);
                    axios.put(`${api_endpoint}/alexandrias/${id}`, {
                      "cid": cid,
                      "type": res_type
                    })
                    .then(function (response) {
                      const item_id = response.data.id;
                      importFiles.push(item_id);
                      console.log('aletheia created: ', item_id);
                      // before closing save images
                      resolve(item_id);
                    })
                    .catch(error => {
                      console.log('upload failed: ', error);
                      response_exit.errors.push(error);
                      reject(error)
                    })
  
                  } catch (error) {
                    console.log('upload doc failed: ', error);
                    response_exit.errors.push(error);
                    reject(error)
                  }
  
                })
              }); 

              // uploading files to admin dashboard 
              const uploadFile = ((file, item, field)=>{
                console.log(`uploading file to ${field}: `, item);
                return new Promise((resolve, reject) => {
                  // uploading file
                  try {

                    const fileUpload = fs.createReadStream(file);
                    const form = new FormData();
                    // screenForm.append('files', file, `${item}.png`);
                    form.append('files', fileUpload);
                    form.append('ref', 'alexandria');
                    form.append('refId', item);
                    form.append('field', field);
                    
                    axios.post(`${api_endpoint}/upload`, form, {
                      headers: {
                        ...form.getHeaders(),
                      }
                    }).then(r => {
                      var pathArray = r.data[0].url.split( '/' );
                      var host = pathArray[2];
                      var cid = host.split( '.' )[0];
                      resolve(cid);
                    })
                    .catch(error => {
                      console.log('upload failed: ', error);
                      response_exit.errors.push(error);
                      reject(error)
                    })
  
                  } catch (error) {
                    console.log('upload failed: ', error);
                    response_exit.errors.push(error);
                    reject(error)
                  }
                })
              }); 

              // saving document on department
              const saveScreen = ((source)=>{
                return new Promise((resolve, reject) => {
                  // save screenshot
                  // take screenshot source
                  let screen_params = {
                    width: 1920,
                    height: 1080,
                    format: 'png'
                  }
                  let screen_query = {
                    url: source
                  }
                  
                  try {
                    _screenshot.makeScreenshot(screen_params, screen_query).then(async res => {
                      resolve(res);
                    })
                  } catch (error) {
                    console.log('upload screen failed: ', error);
                    response_exit.errors.push(error);
                    reject(error)
                  }
                })
              }); 

              // saving document on department
              const saveFile = ((fileName, url)=>{
                return new Promise((resolve, reject) => {
                  try {
                    console.log('downloading file: ', fileName, ' - ', url);
                    const urlExt = url.split('.');
                    const ext = urlExt.pop();
                    utils.downloadFile(`${fileName}.${ext}`, url, './documents').then(async res => {
                      resolve(`${fileName}.${ext}`);
                    })
                    .catch(error => {
                      console.log('upload failed: ', error);
                      response_exit.errors.push(error);
                      reject(error)  
                    })
                  } catch (error) {
                    console.log('upload failed: ', error);
                    response_exit.errors.push(error);
                    reject(error)
                  }
                })
              }); 

              // save doc's information
              const itemId = await saveDoc();
              
              // save doc's screenshot
              const saveScreenshot = await saveScreen(doc_source);
              // upload screenshot
              await uploadFile(`./screenshot/${saveScreenshot}`, itemId, 'proof');
              // save doc's file
              const saveFileItem = await saveFile(itemId, document_url);
              // upload file
              const cidFile = await uploadFile(`./documents/${saveFileItem}`, itemId, 'file');
              // updating CID on item
              await saveCID(itemId, cidFile, mime.lookup(`./documents/${saveFileItem}`));
              
              if (response_exit.documents === record_documents.length-1){
                resolve('docs uploaded');
              }
              
              response_exit.documents ++;
            }

          });

          const filesSaved = await saveFiles;
          console.log('files saved: ', filesSaved);
          await doneImport(importItem.id, response_exit.documents);

          resolve('done');
          return;

        }

      })

    } catch (error) {
      console.log('error: ', error);
      reject(error)
      return;
    }
  });
};

module.exports = {
    importFromUrl
}