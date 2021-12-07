const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');

const sanitize = require('sanitize-filename');//Using this npm module to sanitize file names.
const fs = require('fs');
const path = require('path');

const utils = require('../../utils');

const processUrl = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.category) { reject('missing category'); return;}
    if (!params.value) { reject('missing value'); return;}
    if (!params.source) { reject('missing source'); return;}

    const valid_category = [
      'organization'
    ];

    if (!valid_category.includes(params.category)) { reject('wrong category'); return;}
    const valid_source = [
      'datos-abiertos'
    ];
    
    if (!valid_source.includes(params.source)) { reject('source not available yet'); return;}
    
    try {
      
      let base_url;
      let startUrl;
      switch (params.source) {
        case 'datos-abiertos':
          base_url = `https://datos.gob.do`;
          startUrl = `${base_url}/${params.category}/${params.value}`;
          break;
      }

      // config
      const config = {
        baseSiteUrl: base_url,
        startUrl: startUrl,
        filePath: './records/',
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
      
      /*
      // const doc_download = new DownloadContent('.muted a', { name:'url_download', contentType: 'file' });
      // document.addOperation(doc_download);
      
      ALTERNATIVE WAY TO DOWNLOAD FILES
      const getPageHtml = (html, pageAddress) => {//Saving the HTML file, using the page address as a name.
        const name = sanitize(pageAddress)
        fs.writeFile(`./html/${name}`, html, () => { })
      }
      const doc_download_html = new OpenLinks('.muted a', { getPageHtml });
      */
      
      await scraper.scrape(root);    

      const data = {
        title: title.getData().toString(),
        description: description.getData().toString(),
        startUrl: startUrl,
        source: base_url,
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