
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

        if (query.projection){
            const pro = query.projection;
            let fields = pro.split( ',' );
            data.projection = {}
            fields.map(fieldValue =>{
                let field = fieldValue.split( ':' )[0];
                let value = fieldValue.split( ':' )[1];
                data.projection[field] = parseInt(value)
            })
            console.log(`projecting query with: ${fields}`);
        }

        if (query.sort){
            const sort = query.sort;
            let fields = sort.split( ',' );
            data.sort = {}
            fields.map(fieldValue =>{
                let field = fieldValue.split( ':' )[0];
                let value = fieldValue.split( ':' )[1];
                data.sort[field] = parseInt(value)
            })
            console.log(`sort query with: ${fields}`);
        }

        for (key in query) {
            // remove limit from filters
            if (
                key !== 'limit' && 
                key !== 'id' && 
                key !== 'start' && 
                key !== 'projection' &&
                key !== 'sort'
            ){
                // fix for error endpoint 
                if (query[key] === 'true' || query[key] === 'false'){ query[key] = JSON.parse(query[key])}

                if (key === 'title' || key === 'name' || key === 'description'){
                    // `like` operation for text fields
                    data.filter[key] = { $regex: query[key] }
                } else {
                    // `eq` operation for rest of fields
                    data.filter[key] = query[key]
                }
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
              // console.log(response);
              console.log(JSON.stringify(response.data));
              const result = response?.data?.documents ? response?.data?.documents : response?.data
              resolve(JSON.stringify(result));
          })
          .catch(err =>{
              console.log(err);
              reject(`query failed: ${err}`)
          })
      
        } catch (error) {
            console.log(error);
          reject('query failed: ', error)
        }
      
    });
}
