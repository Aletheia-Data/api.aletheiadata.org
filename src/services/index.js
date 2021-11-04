const minisearch = require('./minisearch');
const transformCSV = require('./transformCSV');

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
  await transformCSV.CSVtoJSON(params, query)
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
  await minisearch.queryFile(params, query)
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