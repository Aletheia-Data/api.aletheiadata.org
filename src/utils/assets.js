const post = require('./queries/post');
const get = require('./queries/get');
const put = require('./queries/put');
const extHelper = require('../helpers/ext');

const add = async (body, files) => {

  const api_endpoint = process.env.API_ENDPOINT;

  console.log(
    `
    ****************************************
    ** ENDPOINT: ${api_endpoint} ***********
    ****************************************
    `
  );

  return new Promise(async (resolve, reject) => {
    if (!body){
      reject('missing body'); return;
    }

    let asset;
    if (!body.asset){
      reject('missing parameters'); return;
    } else {
      asset = JSON.parse(body.asset)
    }

    if (!files.fileUploaded) { reject('missing file'); return;}
    if (!files.proof) { reject('missing proof'); return;}

    asset.fileUploaded = files.fileUploaded
    asset.proof = files.proof
    
    if (
      !asset.title || !asset.description || !asset.docType ||
      !asset.docSource
        ) { reject('missing parameters'); return;}

    if (!asset.owner) { reject('missing owner asset'); return;}

    if (!asset.categoryId) { reject('missing category'); return;}

    if (
      !asset.sourceId && (!asset.sourceInfo.name || !asset.sourceInfo.url)
      ) { reject('missing source information'); return;}
      
    if (
      !asset.issuerId && (!asset.issuerInfo.name || !asset.issuerInfo.url)
      ) { reject('missing issuer information'); return;}
    
    try {
      
      console.log(
        `
        ****************************************
        *********** START UPLOADING *************
        ****************************************
        `
      );
      
      const { 
        title,
        docType,
        description,
        docSource,
        sourceInfo,
        newSource,
        issuerInfo,
        newIssuer,
        fileUploaded,
        proof,
        takenProof,
        owner
      } = asset;

      let {
        sourceId,
        issuerId,
        categoryId
      } = asset;

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
        source: docSource, 
        startUrl: docSource,
        original_source: docSource,
        records: 1,
        documents: 0,
        screenCID: '',
        assetCID: ''
      }

      let result = [];

      console.log(
        `
        ****************************************
        ****************************************
        *********** DATA IMPORTER **************
        ****************************************
        ****************************************
        `
      );

      const importItem = await post.createImport(asset, docSource, 'single');

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
      
      if ( issuerId ){
        console.log(
          `
          ****************************************
          ******** CHECKING DEPARTMENT ***********
          *** EDIT: ${issuerId} *********************
          ****************************************
          ****************************************
          `
        );
      } else {
          // double check just in case
        const hasDepartment = await get.checkDepartment(newIssuer.url);
        if ( hasDepartment.data.length > 0 ){
            issuerId = hasDepartment.data[0].id;
            console.log(
                `
                ****************************************
                ******** CHECKING ISSUER ***********
                *** FOUND: ${issuerId} *********************
                ****************************************
                ****************************************
                `
              );
        } else {
            const newDep = await post.createDepartment(newIssuer);
            issuerId = newDep.data.id;
            console.log(
                `
                ****************************************
                ******** CHECKING ISSUER ***********
                *** NEW: ${issuerId} *********************
                ****************************************
                ****************************************
                `
              );
        }
      } 

      console.log(
        `
        ****************************************
        ****************************************
        ************* DONE ISSUER **************
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

      if ( sourceId ){
        
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
          // double check just in case
        const hasSource = await get.checkSource(newSource.url);
        if ( hasSource.data.length > 0 ){
            sourceId = hasSource.data[0].id;
            console.log(
                `
                ****************************************
                ********** CHECKING SOURCE *************
                *** FOUND: ${sourceId} *****************
                ****************************************
                ****************************************
                `
              );
        } else {
            const newSrc = await post.createSource(newSource);
            sourceId = newSrc.data.id;
            console.log(
                `
                ****************************************
                ******** CHECKING SOURCE ***********
                *** NEW: ${sourceId} *********************
                ****************************************
                ****************************************
                `
              );
        }
      }

      let records = {
        data: [
            {
              title,
              docType,
              description,
              docSource,
              sourceInfo,
              newSource,
              issuerInfo,
              newIssuer,
              fileUploaded,
              proof,
              takenProof,
              sourceId,
              issuerId,
              categoryId,
              owner
            }
        ]
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
        
        result.push(record);
        
        console.log(
          `
          ****************************************
          ****************************************
          *********** IMPORTING RECORD ***********
          ** TITLE: ${record.title} **************
          ** RECORD: ${records_count + 1} / ${records.data.length} **************
          ****************************************
          ****************************************
          `
        );

        const saveAsset = ( (asset) =>{
          return new Promise(async (resolve, reject) => {
            const importFiles = [];
            const importErrors = [];
            
            console.log(
              `
              ****************************************
              ****************************************
              ************* SAVING ASSET **************
              ** RECORD: ${asset.title} **
              ****************************************
              ****************************************
              `
            );

            // save doc's information
            console.log('saving: ', asset);
            try {
              var itemId = await post.createAsset(asset, importItem.id);
              importFiles.push(itemId);
              response_exit.assetId = itemId;
              console.log('aletheia created: ', itemId);
              // increase document's count 
              response_exit.documents ++;
            } catch (error) {
              console.log('error saving screenshot: ', error);
              response_exit.total_docs_errors.push(itemId);
              response_exit.errors.push({
                  source: asset.docSource,
                  action: 'savingDoc',
                  reason: error
              });
            }
            // save doc's screenshot
            try {
                const cid = await post.uploadAsset(asset.proof, itemId, 'proof');
                response_exit.screenCID = cid;
                console.log('saved proof with cid: ', cid);
                const metadata = {
                    item: itemId,
                    file: asset.proof.name,
                    action: 'saveScreenshot',
                    source: asset.docSource,
                    cid: cid
                };
                response_exit.imports.push(metadata);
                response_exit.screen_imported.push(metadata);
                response_exit.total_screen_imported ++;

            } catch (error) {
                
                console.log('error saving screenshot: ', error);
                response_exit.total_screen_errors.push(itemId);
                response_exit.errors.push({
                    item: itemId,
                    action: 'saveScreenshot',
                    reason: error
                });
            }

            let doc_info;
            try {
                doc_info = await get.getName(asset.docSource);
            } catch (error) {
                response_exit.total_docs_errors.push(asset.docSource);
                console.log('saving file failed ------', error);
                response_exit.errors.push({
                    source: asset.docSource,
                    action: 'saveFile',
                    reason: error
                });
            }
            // docType
            let res_type = doc_info['headers']['content-type'];
            let mimeType = asset.fileUploaded.mimetype;
            console.log(`checking mimetype: ${mimeType}`);
            console.log(`checking extension: ${res_type}`);
            
            // check ext by headers
            res_type = extHelper.getExtension(mimeType)
            
            console.log('applying ext: ', res_type);
            console.log('name file: ', itemId);

            // save doc's file
            let cidFile;
            console.log(`saving doc file for item ${itemId}`);
            try {
                cidFile = await post.uploadAsset(asset.fileUploaded, itemId, 'file');
                response_exit.assetCID = cidFile;
                // group 'other' type 
                let type;
                if (
                    res_type !== 'pdf' &&
                    res_type !== 'csv' &&
                    res_type !== 'xls' &&
                    res_type !== 'xlsx' &&
                    res_type !== 'ods'
                ) {
                  type = 'other'
                } else {
                  type = res_type
                }
                // saving CID
                try {
                  await put.saveCID(itemId, cidFile, type, res_type);
                  importFiles.push(itemId);
                  console.log('aletheia created: ', itemId);            
                } catch (error) {
                  let exit = {
                    action: 'savingCid',
                    cid: cidFile,
                    reason: error
                  }
                  response_exit.errors.push(exit);    
                }
                // add to response
                const metadata = {
                    item: itemId,
                    file: asset.fileUploaded.name,
                    action: 'saveCID',
                    source: asset.docSource,
                    cid: cidFile
                };
                response_exit.imports.push(metadata);
                response_exit.docs_imported.push(metadata);
                response_exit.total_docs_imported ++;
            } catch (error) {
                response_exit.total_docs_errors.push(asset.docSource);
                console.log('uploading file failed ------', error);
                response_exit.errors.push({
                    source: asset.docSource,
                    action: 'saveFile',
                    reason: error
                });
            }
            
            resolve('docs uploaded');

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

        const filesSaved = await saveAsset(record);

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

          await put.doneImport(importItem.id, response_exit.documents, response_exit.errors, response_exit.docs_imported);
          response_exit.importID = importItem.id;

          console.log(
            `
            ****************************************
            ****************************************
            ******** DONE IMPORTING RECORD *********
            ** ID: ${importItem.id} ****************
            ** RECORDS: ${records_count} ****
            ****************************************
            ****************************************
            `
          );

          resolve(response_exit);

          return;

      }

    } catch (error) {
      console.log('error: ', error);
      reject(error)
      return;
    }
  });
};

module.exports = {
    add
}