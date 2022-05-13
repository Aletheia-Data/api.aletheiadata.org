var assets = require('../../utils/assets');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.add = async (req, res) => {
  console.log('starting getAll ------');
  const { body, files } = req; 
  console.log('getAll - get body ------');
  try {
    exit(res, 200, await assets.add(body, files));
  } catch (error) {
    console.log(error);
    exit(res, 500, JSON.stringify(error));
  }
  
  console.log('done getAll ------');

}