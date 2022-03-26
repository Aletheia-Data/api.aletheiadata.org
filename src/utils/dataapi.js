
var axios = require('axios');

exports.find = (params, query) =>{
    return new Promise(async (resolve, reject)=> {

        var data = {
            "collection": params.entity,
            "database": "heptastadion",
            "dataSource": "heptastadion",
            "limit": query.limit ? parseInt(query.limit) : 5
        };
    
        if (query.filters){
            console.log('applying filters ------',JSON.parse(query.filters));
            data.filter = JSON.parse(query.filters)
        }
    
        var config = {
            method: 'post',
            url: `https://data.mongodb-api.com/app/${process.env.MONGODB_DATA_API_APP_ID}/endpoint/data/beta/action/find`,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Request-Headers': '*',
                'api-key': `${process.env.MONGODB_DATA_API_KEY}`
            },
            data : JSON.stringify(data)
        };  

        try {
          
          await  axios(config)
          .then(function (response) {
              console.log(JSON.stringify(response.data));
              const result = response?.data?.documents ? response?.data?.documents : response?.data
              resolve(JSON.stringify(result));
          })
      
        } catch (error) {
          reject('query failed: ', error)
        }
      
    });
}
