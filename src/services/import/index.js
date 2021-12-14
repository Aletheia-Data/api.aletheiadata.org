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
        response_exit.errors.push(error);
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
    if (!params.category) { reject('missing category'); return;}
    if (!params.value) { reject('missing value'); return;}
    if (!params.source) { reject('missing source'); return;}

    try {
      
      console.log(
        `
        ****************************************
        *********** START SCRAPPER *************
        ** CATEGORY: ${params.category} ********
        ** SOURCE: ${params.source} ************
        ** VALUE: ${params.value} **************
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
                        response_exit.errors.push({
                          url: document_url,
                          reason: error
                        });
                        reject(error)
                      })
              
                    } catch (error) {
                      console.log('getting failed: ');
                      response_exit.errors.push({
                        url: document_url,
                        reason: error
                      });
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
                        "description": single_record.record_description,
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
                        response_exit.errors.push({
                          url: doc_source,
                          reason: error
                        });
                        reject(error)
                      })
    
                    } catch (error) {
                      console.log('aletheia failed: ', error);
                      response_exit.errors.push(error);
                      response_exit.errors.push({
                        url: doc_source,
                        reason: error
                      });
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
                        response_exit.errors.push({
                          cid: cid,
                          reason: error
                        });
                        reject(error)
                      })
    
                    } catch (error) {
                      console.log('aletheia failed ------');
                      response_exit.errors.push({
                        cid: cid,
                        reason: error
                      });
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

                      console.log('uploading file with id: ', item);
                      console.log('uploading file with field: ', field);
                      
                      axios.post(`${api_endpoint}/upload`, form, {
                        maxContentLength: 100000000,
                        maxBodyLength: 100000000,
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
                        console.log('upload failed --------');
                        response_exit.errors.push({
                          itemId: item,
                          reason: error
                        });
                        reject(error)
                      })
    
                    } catch (error) {
                      console.log('upload failed: ', error);
                      response_exit.errors.push({
                        itemId: item,
                        reason: error
                      });
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
                      console.log('screen failed: ', error);
                      response_exit.errors.push({
                        source: source,
                        reason: error
                      });
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
                          response_exit.errors.push(error);
                          resolve(error);
                        }
                      })
                      .catch(error => {
                        console.log('downloading failed: ', error);
                        response_exit.errors.push({
                          url: url,
                          reason: error
                        });
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
                      response_exit.errors.push({
                        url: url,
                        reason: error
                      });
                      reject(error)
                    }
                  })
                }); 
  
                // save doc's information
                const itemId = await saveDoc();

                // save doc's screenshot
                try {
                  const saveScreenshot = await saveScreen(doc_source);
                  // upload screenshot
                  const cid = await uploadFile(`./screenshot/${saveScreenshot}`, itemId, 'proof');
                  const metadata = {
                    item: itemId,
                    file: saveScreenshot,
                    cid: cid
                  };
                  response_exit.imports.push(metadata);
                  response_exit.screen_imported.push(metadata);
                  response_exit.total_screen_imported ++;

                } catch (error) {
                  console.log('error saving screenshot: ', error);
                  response_exit.total_screen_errors.push(itemId);
                  response_exit.errors.push({
                    itemId: itemId,
                    reason: error
                  });
                }

                try {
                  const doc_name = await getName(document_url);
                  console.log('getting document headers: ', doc_name['headers']);
                  // docType
                  let res_type = doc_name['headers']['content-type'];
                  console.log('check file content-type: ', res_type);

                  var re = /(?:\.([^.]+))?$/;
                  let url = new URL(document_url);
                  let cleanUrl = new URLSearchParams(url.search); 
                  var ext = re.exec(cleanUrl)[1];
                  console.log('check file extention: ', ext);

                  let mimeType = mime.extension(res_type);
                  console.log('check file extention w/mimeType: ', mimeType);

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
                    case 'text/x-comma-separated-values;charset=UTF-8':
                    case 'application/csv':
                    case 'application/octet-stream':
                    case 'text/csv; charset=utf-8':
                      res_type = 'csv'
                      break;
                    case 'text/plain;charset=UTF-8':
                      res_type = 'txt'
                      break;
                    case 'text/html;charset=UTF-8':
                    case 'text/html; charset=utf-8':
                      res_type = 'txt'
                      break;
                    case 'application/vnd.oasis.opendocument.spreadsheet':
                    case 'application/oleobject':
                    case 'application/ods':
                    case 'text/ods; charset=utf-8':
                      res_type = 'ods'
                      break;
                    case 'application/json; charset=utf-8':
                    case 'application/json;charset=utf-8':
                    case 'application/json':
                    case 'text/json; charset=utf-8':
                      res_type = 'json'
                      break;
                    default:
                      if (ext){
                        // if file has extention, keep it
                        res_type = ext;
                      } else {
                        res_type = mimeType;
                      }
                      break;
                  }

                  nameFile = `${itemId}.${res_type}`;

                  // save doc's file
                  let cidFile;
                  console.log(`saving doc file for item ${itemId} - ${nameFile}`);
                  const file = await saveFile(nameFile, document_url);
                  console.log('document downloaded: ', file);
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
                    cid: cidFile
                  };
                  response_exit.imports.push(metadata);
                  response_exit.docs_imported.push(metadata);
                  response_exit.total_docs_imported ++;

                } catch (error) {
                  response_exit.total_docs_errors.push(document_url);
                  console.log('saving file failed ------');
                  response_exit.errors.push({
                    url: document_url,
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
              ****************************************
              `
            );

            await doneImport(importItem.id, response_exit.documents, response_exit.total_docs_errors, response_exit.docs_imported);
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

module.exports = {
    importFromUrl
}