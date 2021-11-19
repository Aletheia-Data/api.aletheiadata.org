const PORT = process.env.PORT || 8000
const express = require('express')
const apicache = require('apicache')
const app = express();
let cache = apicache.middleware;
const dotenv = require('dotenv');
dotenv.config();

// imports
const services = require('./src/services');
const departments = require('./src/departments');

/******************/
/******************/
/***** ENTRY ******/
/******************/
/******************/
app.use(cache('1 day'));

app.get('/', (req, res) => {
    res.json('Welcome to Aletheia Data API')
})

/*
    department: 
    - minerd
    - mirex
    ...

    type:
    - admin
    - budget
    - hr

    cid:
    - CID number of file uploaded on IPFS

    type:
    - pdf
    - csv
    - docx
*/

/******************/
/******************/
/***** SERVICES ***/
/******************/
/******************/
/* DEPRECATED: keep until fix frontend */
app.get('/utils/transform-csv/:host/:cid', services.getJson);
app.get('/utils/search/:type/:cid', services.search);

const services_version = process.env.SERVICES_VERSION;
console.log('activating services for version: ', services_version);

app.get(`/v1/services/transform-csv/:host/:cid`, services.getJson);
app.get(`/v1/services/search/:host/:type/:cid`, services.search);

/******************/
/******************/
/***** ENDPOINTS **/
/******************/
/******************/
const api_version = process.env.API_VERSION;
console.log('activating endpoints for version: ', services_version);

/* DEPRECATED */
app.get(`/v2/:department/:type/:host/:cid/`, departments.getDepartments);

/* v3.0.0 - coming soon */
app.get(`/v3/_search/:department/:type/:host/:cid/`, departments.getDepartments);


/******************/
/***** LISTEN PORT ******/
/******************/
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
