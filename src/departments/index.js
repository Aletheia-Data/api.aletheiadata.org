const services = require('../services');

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
  const departments = [
    'dgcp', 
    'inefi',
    'jce',
    'ccrd',
    'dicom',
    'digepres',
    'dncd',
    'minerd',
    'mopc',
    'msp',
    'mm',
    'paps',
    'pn',
    'superate',
    'asde',
    'tnrd',
    'senasa',
    'mirex',
    'miderec',
    'mt'
  ];
  if (!departments.includes(params.department)) { exit(res, 200, 'department not available.'); return; }
  console.log('getDepartments - department -----', params.department);
  await services.search(req, res);
  console.log('done getDepartments ------');
}