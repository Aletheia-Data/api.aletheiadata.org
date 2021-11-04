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
  /*
  {
    department: 'minerd',
    category: 'admin',
    cid: 'ipfs',
    type: 'bafybeifds2zwfw7zn7gbh7oa2z23xyuyg6rbs6xizbsvxtg5xrfl4quo3u'
  } 
  { 
    fields: 'TOTAL,TEST', 
    value: '4', 
    limit: '44', 
    info: 'true' 
  }
  */
  const department = params.department;
  console.log('getDepartments - department -----', department);
  switch (department) {
    case 'minerd':
      // do query
      console.log('getDepartments - department -----', department);
      services.search(req, res);
      break;
    default:
      // alert user
      exit(res, 200, 'department not available.');
      break;
  }
  console.log('done getDepartments ------');
}