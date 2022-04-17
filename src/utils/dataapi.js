
var axios = require('axios');

exports.find = (params, query) =>{
    return new Promise(async (resolve, reject)=> {

        var data = {
            "collection": params.entity,
            "database": "heptastadion",
            "dataSource": "heptastadion",
            "limit": query.limit ? parseInt(query.limit) : 25,
            "filter": {
            },
            "skip": query.start ? parseInt(query.start) : 0
        };

        if (query.id){
            data.filter["_id"] = { "$oid": `${query.id}` }
        }

        for (key in query) {
            // remove limit from filters
            if (key !== 'limit' && key !== 'id' && key !== 'start'){
                if (query[key] === 'true' || query[key] === 'false'){ query[key] = JSON.parse(query[key])}
                data.filter[key] = query[key]
            }
        }

        var config = {
            method: 'post',
            url: `${process.env.MONGODB_DATA_API_ENDPOINT}/app/${process.env.MONGODB_DATA_API_APP_ID}/endpoint/data/beta/action/find`,
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
