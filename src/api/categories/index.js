var axios = require('axios');

const exit = ((res, code, body)=>{
  return res.send({
    code,
    body
  })
})

exports.getAllCategories = async (req, res) => {
  console.log('starting getCategories ------');
  const { params, query } = req; 
  console.log('getCategories - get params ------', params, query);

  var data = JSON.stringify({
    "collection": "categories",
    "database": "heptastadion",
    "dataSource": "heptastadion",
    "filter": {
        "enabled": true
    },
    "limit": 5
  });

  var config = {
    method: 'post',
    url: `https://data.mongodb-api.com/app/${process.env.MONGODB_DATA_API_APP_ID}/endpoint/data/beta/action/find`,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': `${process.env.MONGODB_DATA_API_KEY}`
    },
    data : data
};
            
axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
        exit(res, 200, JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
  
  console.log('done getCategories ------');

}