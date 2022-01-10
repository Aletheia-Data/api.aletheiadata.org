const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');
const axios = require('axios');
const FormData = require('form-data');
const qs = require('qs');

const sanitize = require('sanitize-filename');//Using this npm module to sanitize file names.
const fs = require('fs');
const path = require('path');

const utils = require('../../utils');

const _scraper = require('../../services/scraper');
const _screenshot = require('../../services/screenshot');

var mime = require('mime-types');
var https = require('https');

const importFromUrl = (params) => {

  console.log(
    `
    ****************************************
    ****************************************
    ********* START CLEANING ***************
    ****************************************
    ****************************************
    `
  );

  const cleanUp = ( () =>{
    return new Promise((resolve, reject) => {
      try {
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

        resolve('clean up done!');
      } catch (error) {
        console.log('clean up failed: ', error);
        let exit = {
          action: 'cleanUp',
          reason: error
        }
        response_exit.errors.push(exit);
        reject(error)
      }
    })
  }); 

  // clean in case of old records
  cleanUp();

  console.log(
    `
    ****************************************
    ****************************************
    ********* DONE CLEANING ***************
    ****************************************
    ****************************************
    `
  );

  const owner = process.env.WALLET_OWNER;
  const api_endpoint = process.env.API_ENDPOINT;

  console.log(
    `
    ****************************************
    ** ENDPOINT: ${api_endpoint} ***********
    ** OWNER: ${owner} *********************
    ****************************************
    `
  );

  return new Promise((resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.baseUrl) { reject('missing base url'); return;}
    if (!params.startUrl) { reject('missing start url'); return;}

    try {
      
      console.log(
        `
        ****************************************
        *********** START SCRAPPER *************
        ** BASE URL: ${params.baseUrl} ********
        ** START URL: ${params.startUrl} ************
        ****************************************
        `
      );
      
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

        console.log(
          `
          ****************************************
          ****************************************
          *********** DONE SCRAPPER **************
          ****************************************
          ****************************************
          `
        );

        const info = body.data[0];
        const records = body.data[1];

        const response_exit = {
          errors: [],
          imports: [],
          docs_imported: [],
          screen_imported: [],
          total_docs_imported: 0,
          total_screen_imported: 0,
          total_docs_errors: [],
          total_screen_errors: [],
          title, 
          description, 
          source, 
          startUrl,
          original_source,
          records: 0,
          documents: 0
        }

        let result = [];

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
                console.log('import failed: ', error);
                reject(error)
              })
      
            } catch (error) {
              console.log('import doc failed: ', error);
              reject(error)
            }
      
          })
        }); 
      
        // (importItem.id, response_exit.documents, response_exit.total_docs_errors, response_exit.errors);

        const doneImport = ((id, documents, total_docs_errors, docs_imported)=>{
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
                "download_errors": total_docs_errors,
                "download_errors_count": total_docs_errors.length,
                "docs_imported": docs_imported,
                "documents": documents,
              })
              .then(function (response) {
                console.log('starting import: ', response.data.id);
                // before closing save images
                resolve(response);
              })
              .catch(error => {
                console.log('import done failed: ', error);
                reject(error)
              })
      
            } catch (error) {
              console.log('import done failed: ', error);
              reject(error)
            }
      
          })
        }); 

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

        console.log(
          `
          ****************************************
          ****************************************
          *********** DATA IMPORTER **************
          ****************************************
          ****************************************
          `
        );

        const importItem = await startImport(source, 'collection');

        console.log(
          `
          ****************************************
          ****************************************
          *********** START IMPORTING *************
          ** ID: ${importItem.id} *****************
          ****************************************
          `
        );

        console.log(
          `
          ****************************************
          ****************************************
          *********** CHECKING DEPARTMENT ********
          ****************************************
          ****************************************
          `
        );
        const hasDepartment = await checkDepartment(original_source);
        let depId;
        if ( hasDepartment.data.length > 0 ){
          depId = hasDepartment.data[0].id;
          console.log(
            `
            ****************************************
            ******** CHECKING DEPARTMENT ***********
            *** EDIT: ${depId} *********************
            ****************************************
            ****************************************
            `
          );
        } else {
          const newDep = await createDepartment(title, description, original_source);
          depId = newDep.data.id;
          console.log(
            `
            ****************************************
            ******** CHECKING DEPARTMENT ***********
            *** NEW: ${depId} *********************
            ****************************************
            ****************************************
            `
          );
        } 

        console.log(
          `
          ****************************************
          ****************************************
          *********** DONE DEPARTMENT ************
          ****************************************
          ****************************************
          `
        );


        console.log(
          `
          ****************************************
          ****************************************
          *********** CHECKING SOURCE ************
          ****************************************
          ****************************************
          `
        );

        const hasSource = await checkSource(source);
        let sourceId;
        if ( hasSource.data.length > 0 ){
          sourceId = hasSource.data[0].id;
          
          console.log(
            `
            ****************************************
            ****************************************
            *********** CHECKING SOURCE ************
            ** EDIT: ${sourceId} *******************
            ****************************************
            ****************************************
            `
          );

        } else {
          const newSrc = await createSource(source);
          sourceId = newSrc.data.id;
          console.log(
            `
            ****************************************
            ****************************************
            *********** CHECKING SOURCE ************
            ** NEW: ${sourceId} *******************
            ****************************************
            ****************************************
            `
          );
        } 

        console.log(
          `
          ****************************************
          ****************************************
          *********** IMPORTING RECORDS **********
          ** RECORDS: ${records.data.length} ********************
          ****************************************
          ****************************************
          `
        );

        // after department's information
        let records_count = 0;
        for (let record of records.data) {
          
          const record_title = record.data.filter(item => item.name == 'doc_title')[0].data[0];
          const record_description = record.data.filter(item => item.name == 'doc_description')[0].data[0];
          const record_dataset_details = record.data.filter(item => item.name == 'dataset_details')[0].data[0];
          const record_documents = record.data.filter(item => item.name == 'documents')[0].data;

          // increase record count on response
          response_exit.records ++;
          
          let single_record = {
            record_title,
            record_description,
            record_dataset_details,
            record_documents: record_documents.length
          }

          result.push(single_record);
          
          console.log(
            `
            ****************************************
            ****************************************
            *********** IMPORTING RECORD ***********
            ** TITLE: ${record_title} **************
            ** RECORD: ${records_count + 1} / ${records.data.length} **************
            ****************************************
            ****************************************
            `
          );

          const saveFiles = ( (record_documents) =>{
            return new Promise(async (resolve, reject) => {
              const importFiles = [];
              const importErrors = [];
              
              console.log(
                `
                ****************************************
                ****************************************
                ************* SAVING DOCS **************
                ** RECORD: ${record_documents.length} **
                ****************************************
                ****************************************
                `
              );

              if (record_documents.length === 0){
                let exit = {
                  action: 'saveFiles',
                  title: record_title,
                  reason: `records missing: ${record_documents.length}`
                }
                response_exit.errors.push(exit);
                resolve(`records missing: ${record_documents.length}`)
              }

              let docs_count = 0;
              for (let document of record_documents) {

                console.log(
                  `
                  ****************************************
                  ****************************************
                  ************* SAVING DOC **************
                  ** RECORD: ${docs_count + 1} / ${record_documents.length} **
                  ****************************************
                  ****************************************
                  `
                );

                const doc_source = document.address;
                const document_url = document.data[0].data[0];

                const getName = (( source )=>{
                  console.log('getting name file: ', source);
                  return new Promise((resolve, reject) => {
                    // save document
                    try {
                      /*
                      starting
                      in_progress
                      done
                      */
                      axios.get(`${source}`)
                      .then(function (response) {
                        // console.log('gotten name file: ', response);
                        // before closing save images
                        resolve(response);
                      })
                      .catch(error => {
                        console.log('getting failed --------');
                        let exit = {
                          action: 'gettingName',
                          source: source,
                          reason: error
                        }
                        response_exit.errors.push(exit);
                        reject(error)
                      })
              
                    } catch (error) {
                      console.log('getting failed: ');
                      let exit = {
                        action: 'getName',
                        source: source,
                        reason: error
                      }
                      response_exit.errors.push(exit);
                      reject(error)
                    }
              
                  })
                }); 

                const saveDoc = (()=>{
                  return new Promise((resolve, reject) => {
                    // save document
                    try {
                      console.log('saving document: ', doc_source);
                      axios.post(`${api_endpoint}/alexandrias`, {
                        "title": single_record.record_title,
                        "description": single_record.record_description ? single_record.record_description : 'none',
                        "source_url": doc_source,
                        "original_url": document_url,
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
                        // increase document's count 
                        response_exit.documents ++;
                        // before closing save images
                        resolve(item_id);
                      })
                      .catch(error => {
                        console.log('aletheia failed: ', error);
                        let exit = {
                          action: 'savingDoc',
                          source: doc_source,
                          reason: error
                        }
                        response_exit.errors.push(exit);
                        reject(error)
                      })
    
                    } catch (error) {
                      console.log('aletheia failed: ', error);
                      let exit = {
                        action: 'saveDoc',
                        source: doc_source,
                        reason: error
                      }
                      response_exit.errors.push(exit);
                      reject(error)
                    }
    
                  })
                }); 
  
                const saveCID = ((id, cid, type, ext)=>{
                  return new Promise((resolve, reject) => {

                    let data =  {
                      "type": type,
                      "ext": ext
                    };

                    if (cid) { data.cid = cid };
                    // save document
                    try {
                      console.log('saving CID for doc: ', cid, ' - ', id);
                      console.log('saving CID with type: ', type);
                      axios.put(`${api_endpoint}/alexandrias/${id}`, data)
                      .then(function (response) {
                        const item_id = response.data.id;
                        importFiles.push(item_id);
                        console.log('aletheia created: ', item_id);
                        // before closing save images
                        resolve(item_id);
                      })
                      .catch(error => {
                        console.log('aletheia failed ---------');
                        let exit = {
                          action: 'savingCid',
                          cid: cid,
                          reason: error
                        }
                        response_exit.errors.push(exit);
                        reject(error)
                      })
    
                    } catch (error) {
                      console.log('aletheia failed ------');
                      let exit = {
                        action: 'saveCID',
                        cid: cid,
                        reason: error
                      }
                      response_exit.errors.push(exit);
                      reject(error)
                    }
    
                  })
                }); 
  
                // uploading files to admin dashboard 
                const uploadFile = ((file, item, field)=>{
                  console.log(`uploading file to ${field}: `, file, item, field);
                  return new Promise(async (resolve, reject) => {
                    // uploading file
                    const form = new FormData();
                    form.append('files', fs.createReadStream(file));

                    form.append('ref', 'alexandria');
                    form.append('refId', item);
                    form.append('field', field);

                    console.log('uploading file with id: ', item);
                    // console.log('uploading file with field: ', field);
                    // console.log('uploading file form: ', form);
                    // console.log('headers: ', form.getHeaders());
                    
                    await axios({
                      method: 'post',
                      url: `${api_endpoint}/upload`,
                      data: form,
                      maxContentLength: Infinity,
                      maxBodyLength: Infinity,
                      headers: {
                        ...form.getHeaders(),
                      }
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
                      console.log('screen failed: ', error);
                      let exit = {
                        action: 'saveScreen',
                        source: source,
                        reason: error
                      }
                      response_exit.errors.push(exit);
                      reject(error)
                    }
                  })
                }); 
  
                // saving document on department
                const saveFile = ( ( fileName, url ) =>{
                  return new Promise((resolve, reject) => {
                    try {
                      console.log('downloading file: ', fileName, ' - ', url);
                      axios.get(`${url}`, { responseType: 'stream' })
                      .then(function (response) {
                        console.log('file downloaded: ', fileName);
                        try {
                          response.data.pipe(fs.createWriteStream(`./documents/${fileName}`));
                          resolve(`${url}`);
                        } catch (error) {
                          console.log('downloading failed: ', error);
                          let exit = {
                            action: 'downloadingFile',
                            source: url,
                            reason: error
                          }
                          response_exit.errors.push(exit);
                          resolve(error);
                        }
                      })
                      .catch(error => {
                        console.log('downloading failed: ', error);
                        let exit = {
                          action: 'savingFile',
                          source: url,
                          reason: error
                        }
                        response_exit.errors.push(exit);
                        reject(error)
                      })
                      
                      /*
                      utils.downloadFile(fileName, url, './documents')
                      .then(async res => {
                        resolve(`${url}`);
                      })
                      .catch(error => {
                        console.log('downloading failed: ', error);
                        response_exit.errors.push(error);
                        reject(error)  
                      })
                      */
                    } catch (error) {
                      console.log('downloading failed: ', error);
                      let exit = {
                        action: 'saveFile',
                        source: url,
                        reason: error
                      }
                      response_exit.errors.push(exit);
                      reject(error)
                    }
                  })
                }); 
  
                // save doc's information
                const itemId = await saveDoc();

                // save doc's screenshot
                try {
                  await saveScreen(doc_source)
                  .then( async saveScreenshot => {
                    // upload screenshot
                    await setTimeout(async () => {
                      try {
                        const cid = await uploadFile(`./compress/${saveScreenshot}`, itemId, 'proof');
                        console.log('saved proof with cid: ', cid);
                        const metadata = {
                          item: itemId,
                          file: saveScreenshot,
                          action: 'saveScreenshot',
                          source: document_url,
                          cid: cid
                        };
                        response_exit.imports.push(metadata);
                        response_exit.screen_imported.push(metadata);
                        response_exit.total_screen_imported ++;
                      } catch (error) {
                        console.log('error uploading screenshot: ', error);
                        response_exit.total_screen_errors.push(itemId);
                        response_exit.errors.push({
                          item: itemId,
                          action: 'saveScreenshot',
                          reason: error
                        });
                      }
                    }, 1000);
                  });

                } catch (error) {
                  console.log('error saving screenshot: ', error);
                  response_exit.total_screen_errors.push(itemId);
                  response_exit.errors.push({
                    item: itemId,
                    action: 'saveScreenshot',
                    reason: error
                  });
                }

                try {
                  const doc_name = await getName(document_url);
                  // docType
                  let res_type = doc_name['headers']['content-type'];
                  
                  // let url = new URL(document_url);
                  // var re = /(?:\.([^.]+))?$/;
                  // let cleanUrl = new URLSearchParams(url.search); 
                  // var ext = re.exec(cleanUrl)[1];
                  
                  let extUrl = document_url.split(/[#?]/)[0].split('.').pop().trim();
                  let mimeType = mime.extension(res_type);
                  console.log(`checking mimetype: ${mimeType}`);
                  console.log(`checking extension: ${res_type} / ext: ${extUrl}`);
                  
                  // check ext by headers
                  switch (res_type) {
                    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                    case 'application/vnd.ms-excel':
                      res_type = 'xlsx'
                      break;
                    case 'application/pdf':
                      res_type = 'pdf'
                      break;
                    case 'text/csv':
                    case 'text/x-comma-separated-values;charset=UTF-8':
                    case 'text/csv; charset=Windows-1252':
                    case 'application/csv':
                    case 'application/octet-stream':
                    case 'text/csv; charset=utf-8':
                    case 'text/csv;charset=UTF-8':
                      res_type = 'csv'
                      break;
                    case 'text/plain;charset=UTF-8':
                      res_type = 'txt'
                      break;
                    case 'text/html;charset=UTF-8':
                    case 'text/html; charset=utf-8':
                      if (mimeType){
                        res_type = mimeType;
                      } else {
                        // if file has extention, keep it
                        if (extUrl.length <5){
                          res_type = extUrl;
                        } else {
                          res_type = 'txt';
                        }
                      }
                      break;
                    case 'application/vnd.oasis.opendocument.spreadsheet':
                    case 'application/oleobject':
                    case 'application/ods':
                    case 'text/ods; charset=utf-8':
                    case 'application /vnd.openxmlformats-officedocument.wordprocessingml.document':
                      res_type = 'ods'
                      break;
                    case 'application/json; charset=utf-8':
                    case 'application/json;charset=utf-8':
                    case 'application/json':
                    case 'text/json; charset=utf-8':
                      res_type = 'json'
                      break;
                    default:
                      if (mimeType){
                        res_type = mimeType;
                      } else {
                        // if file has extention, keep it
                        res_type = extUrl;
                      }
                      break;
                  }
                  
                  console.log('applying ext: ', res_type);
                  nameFile = `${itemId}`;
                  console.log('name file: ', nameFile);

                  // save doc's file
                  let cidFile;
                  console.log(`saving doc file for item ${itemId} - ${nameFile}`);
                  await saveFile(nameFile, document_url)
                  .then(async file => {
                    console.log('document downloaded: ', file);
                    await setTimeout(async () => {
                      try {
                        cidFile = await uploadFile(`./documents/${nameFile}`, itemId, 'file');
                        // group 'other' type 
                        if (
                          res_type !== 'pdf' &&
                          res_type !== 'csv' &&
                          res_type !== 'xls' &&
                          res_type !== 'xlsx' &&
                          res_type !== 'ods'
                        ) {
                          res_type = 'other'
                        }
                        // saving CID
                        await saveCID(itemId, cidFile, res_type, mimeType ? mimeType : res_type);
                        // add to response
                        const metadata = {
                          item: itemId,
                          file: nameFile,
                          action: 'saveCID',
                          source: document_url,
                          cid: cidFile
                        };
                        response_exit.imports.push(metadata);
                        response_exit.docs_imported.push(metadata);
                        response_exit.total_docs_imported ++;
                      } catch (error) {
                        response_exit.total_docs_errors.push(document_url);
                        console.log('uploading file failed ------', error);
                        response_exit.errors.push({
                          source: document_url,
                          action: 'saveFile',
                          reason: error
                        });
                      }
                    }, 1000);
                  })

                } catch (error) {
                  response_exit.total_docs_errors.push(document_url);
                  console.log('saving file failed ------', error);
                  response_exit.errors.push({
                    source: document_url,
                    action: 'saveFile',
                    reason: error
                  });
                }
                
                if (docs_count === record_documents.length-1){
                  resolve('docs uploaded');
                }
                
                docs_count ++;
              }
  
            })
          }); 

          // saving document on department
          console.log(
            `
            ****************************************
            ****************************************
            ******** START SAVING DOCUMENTS ********
            ****************************************
            ****************************************
            `
          );

          const filesSaved = await saveFiles(record_documents);

          console.log(
            `
            ****************************************
            ****************************************
            ********* DONE SAVING DOCUMENTS ********
            ** RESULT: ${filesSaved} ***************
            ****************************************
            ****************************************
            `
          );

          if (records_count === records.data.length-1){
            
            console.log(
              `
              ****************************************
              ****************************************
              ******** DONE IMPORTING DOCUMENTS ******
              ** DOCS: ${response_exit.documents} ****
              ** ERRORS: ${response_exit.total_docs_errors.length} ****
              ****************************************
              `
            );

            await doneImport(importItem.id, response_exit.documents, response_exit.errors, response_exit.docs_imported);
            response_exit.importID = importItem.id;

            console.log(
              `
              ****************************************
              ****************************************
              ******** DONE IMPORTING RECORD *********
              ** ID: ${importItem.id} ****************
              ** RECORDS: ${records_count+1} ****
              ****************************************
              ****************************************
              `
            );

            resolve(response_exit);

            return;
          } else {
            
            console.log(
              `
              ****************************************
              ****************************************
              *********** DONE IMPORTING DOCUMENT ****
              *********** NEXT RECORDS ***************
              ** RECORD: ${ records_count +1 } / ${records.data.length} **************
              ****************************************
              `
            );
          }

          records_count ++;

        }

      })

    } catch (error) {
      console.log('error: ', error);
      reject(error)
      return;
    }
  });
};

const importAll = (params) => {
  
  const owner = process.env.WALLET_OWNER;
  const api_endpoint = process.env.API_ENDPOINT;

  console.log(
    `
    ****************************************
    ** ENDPOINT: ${api_endpoint} ***********
    ** OWNER: ${owner} *********************
    ****************************************
    `
  );

  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.operation) { reject('missing operation'); return;}
    if (!params.source) { reject('missing source'); return;}

    let valid = utils.validSource(params.source);
    if (!valid){
      reject('source not available yet');
    } else {
      // get all links
      // check source
      const getAllSource = (async source =>{
        console.log('getting links for: ', source);
        let source_search;
        switch (source) {
          case 'datos-abiertos':
            source_search = 'datos.gob.do';
            break;
          default:
            source_search = 'no-source';
            break;
        }

        const query = qs.stringify({
          _where: [{ source_contains: source_search }],
          _start: 0,
          _limit: 0
        });

        return await axios.get(`${api_endpoint}/imports?${query}`)
          .then(function (links) {
            return links;
          })
          .catch(function (error) {
            return error;
          });
      });
      
      let linksData;
      switch (params.operation) {
        case 'all':
          linksData = await getAllSource(params.source);
          break;
        default:
          reject({
            source: params.source,
            action: 'getOperation',
            reason: 'operation not valid'
          });
          return;
      }

      if (
        !linksData.data || 
        linksData.data.length === 0
      ){
        reject({
          source: params.source,
          action: 'getAllSource',
          reason: 'import not found'
        });
        return;
      }

      const linksUrl = linksData.data;
      
      const links = linksUrl.filter((v,i,a)=>a.findIndex(t=>(t.source===v.source))===i);
      // links.splice(0, 199);
      const links_length = links.length;

      let response = [];
      let response_errors = [];
      for (let index = 0; index < links_length; index++) {
        
        const link = links[index];
        // loop and call importFromUrl();
        let paramsLink = {
          baseUrl: `https://datos.gob.do`,
          startUrl: `${link.source}`
        }

        console.log(
          `
          ****************************************
          ****************************************
          *********** START RE-IMPORTING **********
          ** BASE: ${ paramsLink.baseUrl } ********
          ** START: ${ paramsLink.startUrl } ******
          *********** RECORD: ${link.id} ********
          ** RECORD: ${ index +1 } / ${links_length} **************
          ****************************************
          `
        );

        
        await importFromUrl(paramsLink)
        .then(imported => {
          response.push(imported);
        })
        .catch(error => {
          response_errors.push(error);
        })
        
        if (index === links_length-1){
          
          console.log(
            `
            ****************************************
            ****************************************
            *********** DONE RE-IMPORTING ****
            ************* RECORDS ******************
            ** RECORDS: ${ index +1 } / ${links_length} **************
            ****************************************
            `
          );

          let res = {
            response,
            records: links_length,
            source: params.source,
            operation: params.operation,
            response_errors
          }

          resolve(res); 
          return;
        }

        console.log(
          `
          ****************************************
          ****************************************
          *********** DONE RE-IMPORTING **********
          *********** RECORDS: ${link.id} ********
          *********** NEXT RECORDS ***************
          ** RECORD: ${ index +1 } / ${links_length} **************
          ****************************************
          `
        );

      }
      
    }

  })


}

module.exports = {
    importFromUrl,
    importAll
}