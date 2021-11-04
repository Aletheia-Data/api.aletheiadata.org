const axios = require('axios');
const utils = require('../services');

const admin = require('./minerd/admin');
const budget = require('./minerd/budget');
const hr = require('./minerd/hr');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.getDepartments = async (req, res) => {
  console.log('starting getDepartments ------');
  const { params, query } = req; 
  console.log('getDepartments - get params ------', params, query);

  /*
  http://localhost:8000
  /v2/services/search/ipfs/
  bafybeifds2zwfw7zn7gbh7oa2z23xyuyg6rbs6xizbsvxtg5xrfl4quo3u?
  fields=TOTAL&
  value=4&
  limit=44&
  info=true
  */

  

  await admin.findByAll()
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