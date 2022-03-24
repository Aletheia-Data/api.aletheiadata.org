const _categories = require('./category');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.getCategories = async (req, res) => {
  console.log('starting getCategories ------');
  const { params, query } = req; 
  console.log('starting getCategories - get json ------');
  await _categories.getAllCategories(params, query)
  .then((results)=>{
    console.log('done getCategories -------');
    exit(res, 200, results);
  })
  .catch(err => {
    console.log('error getCategories -------');
    exit(res, 500, err);
  })
  console.log('done getCategories ------');
}