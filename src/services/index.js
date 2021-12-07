const _minisearch = require('./minisearch');
const _transformCSV = require('./transformCSV');
const _scraper = require('./scraper');
const _screenshot = require('./screenshot');
const _import = require('./import');
const _queryCSV = require('./queryCSV');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.getJson = async (req, res) => {
  console.log('starting csvtojson ------');
  const { params, query } = req; 
  console.log('starting csvtojson - get json ------');
  await _transformCSV.CSVtoJSON(params, query)
  .then((results)=>{
    console.log('done csvtojson -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error csvtojson -------');
    exit(res, 500, err);
  })
  console.log('done csvtojson ------');
}

exports.search = async (req, res) => {
  console.log('starting search ------');
  const { params, query } = req; 
  console.log('start query ------');
  await _minisearch.queryFile(params, query)
  .then((results)=>{
    console.log('done query -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error query -------');
    exit(res, 500, err);
  })
  console.log('done search ------');
};

/* v1.0.0 */
exports._search = async (req, res) => {
  console.log('starting search ------');
  const { params, query } = req; 
  console.log('start query ------');
  await _queryCSV.queryFile(params, query)
  .then((results)=>{
    console.log('done query -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error query -------');
    exit(res, 500, err);
  })
  console.log('done search ------');
};

exports.scraping = async (req, res) => {
  console.log('starting search ------');
  const { params, query } = req; 
  console.log('start query ------');
  await _scraper.processUrl(params, query)
  .then((results)=>{
    console.log('done query -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error query -------');
    exit(res, 500, err);
  })
  console.log('done search ------');
};

exports.makeScreenshot = async (req, res) => {
  console.log('starting search ------');
  const { params, query } = req; 
  console.log('start query ------');
  await _screenshot.makeScreenshot(params, query)
  .then((results)=>{
    console.log('done query -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error query -------');
    exit(res, 500, err);
  })
  console.log('done search ------');
};

exports.importUrl = async (req, res) => {
  console.log('starting search ------');
  const { params, query } = req; 
  console.log('start query ------');
  await _import.importFromUrl(params, query)
  .then((results)=>{
    console.log('done query -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error query -------');
    exit(res, 500, err);
  })
  console.log('done search ------');
};
