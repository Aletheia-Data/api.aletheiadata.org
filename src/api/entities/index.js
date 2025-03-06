var dataAPI = require('../../utils/dataapi');
var dataAPIV2 = require('../../utils/dataPostgress');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.getAll = async (req, res) => {
  console.log('starting getAll ------');
  const { params, query } = req; 
  console.log('getAll - get params ------', params, query);

  if (!params.entity) { exit(res, 404, 'missing entity'); return; }

  try {
    exit(res, 200, await dataAPI.find(params, query));
  } catch (error) {
    console.log(error);
    exit(res, 500, JSON.stringify(error));
  }
  
  console.log('done getAll ------');

}

exports.getAllV2 = async (req, res) => {
  console.log('starting getAllV2 ------');
  const { params, query } = req; 
  console.log('getAllV2 - get params ------', params, query);

  if (!params.entity) { exit(res, 404, 'missing entity'); return; }

  try {
    exit(res, 200, await dataAPIV2.find(params, query));
  } catch (error) {
    console.log(error);
    exit(res, 500, JSON.stringify(error));
  }
  
  console.log('done getAllV2 ------');

}