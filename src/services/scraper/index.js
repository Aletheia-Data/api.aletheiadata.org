const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');

const sanitize = require('sanitize-filename');//Using this npm module to sanitize file names.
const fs = require('fs');
const path = require('path');

const utils = require('../../utils');

const processUrl = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.baseUrl) { reject('missing base url'); return;}
    if (!params.startUrl) { reject('missing start url'); return;}

    const valid_base = [
      'https://datos.gob.do'
    ];

    if (!valid_base.includes(params.baseUrl)) { reject('wrong base url'); return;}
    
    try {

      // config
      const config = {
        baseSiteUrl: params.baseUrl,
        startUrl: params.startUrl,
        filePath: './documents/',
        cloneFiles: false,
        concurrency: 10, //Maximum concurrent jobs. More than 10 is not recommended.Default is 3.
        maxRetries: 5, //The scraper will try to repeat a failed request few times(excluding 404). Default is 5.      
      }

      const scraper = new Scraper(config); // Scraper instance, and pass config to it.
      const root = new Root(); //The root object fetches the startUrl, and starts the process.  
      //Any valid cheerio selector can be passed. For further reference: https://cheerio.js.org/
      
      const department = new OpenLinks('.secondary .module.module-narrow.module-shallow.context-info .module-content p > a', { name:'department' });
      const title = new CollectContent('.module.module-narrow.module-shallow.context-info .heading', { name:'title' });
      const description = new CollectContent('.primary .module .module-content p', { name:'description' });
      root.addOperation(department);
      department.addOperation(title);
      department.addOperation(description);
      
      const records = new OpenLinks('.dataset-list .dataset-item .dataset-content .dataset-heading a', { name:'records' });
      root.addOperation(records);
      const doc_title = new CollectContent('.primary .module .module-content h1', { name:'doc_title' });
      const doc_description = new CollectContent('.primary .module .module-content .notes p', { name:'doc_description' });
      records.addOperation(doc_title);
      records.addOperation(doc_description);
      const datasetDetails = new CollectContent('.dataset-details', { name:'dataset_details' });
      records.addOperation(datasetDetails);

      const documents = new OpenLinks('.resource-list .resource-item a.heading', { name:'documents' });
      records.addOperation(documents);
      
      const doc_download = new CollectContent('.muted a', { name:'url_download'});
      documents.addOperation(doc_download);

      // const doc_download_file = new DownloadContent('.muted a', { name:'url_download_file', contentType: 'file' });
      // documents.addOperation(doc_download_file);
      
      // const doc_download = new DownloadContent('.muted a', { name:'url_download', contentType: 'file' });
      // document.addOperation(doc_download);
      
      // ALTERNATIVE WAY TO DOWNLOAD FILES
      /*
      const condition = (cheerioNode) => {
        // console.log('cheerioNode: ', cheerioNode);
        // console.log(cheerioNode.attr('href'));
        return cheerioNode;
      }
      const doc_download_html = new DownloadContent('.muted a', { 
        name:'url_download_file', 
        contentType: 'file', 
        condition 
      });
      documents.addOperation(doc_download_html);
      */
      
      await scraper.scrape(root);    

      const data = {
        title: title.getData().toString(),
        description: description.getData().toString(),
        startUrl: params.startUrl,
        source: params.baseUrl,
        original_source: datasetDetails.getData()[0].toString(),
        errors_downloads: doc_download.getErrors(),
        body: root.getData()
      }
      
      // resolve query
      resolve(data);
      // make query with 
    } catch (error) {
      console.log('error: ', error);
      reject(error)
      return;
    }
  });
};

module.exports = {
  processUrl
}