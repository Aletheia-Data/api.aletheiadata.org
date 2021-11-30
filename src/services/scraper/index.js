const { Scraper, Root, DownloadContent, OpenLinks, CollectContent } = require('nodejs-web-scraper');

const sanitize = require('sanitize-filename');//Using this npm module to sanitize file names.
const fs = require('fs');
const path = require('path');

const utils = require('../../utils');

const processUrl = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.type) { reject('missing type'); return;}
    if (!params.url) { reject('missing url'); return;}
    if (!params.source) { reject('missing source'); return;}

    const valid_type = [
      'organization'
    ];

    if (!valid_type.includes(params.type)) { reject('wrong type'); return;}

    const valid_source = [
      'datos-abiertos'
    ];

    if (!valid_source.includes(params.source)) { reject('source not available yet'); return;}

    try {
      
      const base_url = `https://datos.gob.do`
      // config
      const config = {
        baseSiteUrl: base_url,
        startUrl: `${base_url}/${params.type}/${params.url}`,
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
      
      const documents = new OpenLinks('.dataset-list .dataset-item .dataset-content .dataset-heading a', { name:'documents' });
      root.addOperation(documents);
      const doc_title = new CollectContent('.primary .module .module-content h1', { name:'doc_title' });
      const doc_description = new CollectContent('.primary .module .module-content .notes p', { name:'doc_description' });
      documents.addOperation(doc_title);
      documents.addOperation(doc_description);
      const datasetDetails = new CollectContent('.dataset-details', { name:'datasetDetails' });
      documents.addOperation(datasetDetails);

      const document = new OpenLinks('#dataset-resources .resource-list .resource-item a.heading', { name:'document' });
      documents.addOperation(document);
      
      const doc_download = new DownloadContent('.muted a', { name:'url_download', contentType: 'file' });
      document.addOperation(doc_download);
      
      /*
      ALTERNATIVE WAY TO DOWNLOAD FILES
      const getPageHtml = (html, pageAddress) => {//Saving the HTML file, using the page address as a name.
        const name = sanitize(pageAddress)
        fs.writeFile(`./html/${name}`, html, () => { })
      }
      // const doc_download_html = new OpenLinks('.muted a', { getPageHtml });
      */
      
      await scraper.scrape(root);    
      // download all the files

      const data = {
        title: title.getData().toString(),
        description: description.getData().toString(),
        source: base_url,
        original_source: datasetDetails.getData()[0].toString(),
        errors_downloads: doc_download.getErrors(),
        body: root.getData()
      }

      // clean up folder
      let directory = 'documents';
      fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      });
      
      // resolve query
      resolve(data);
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