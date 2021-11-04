const PORT = process.env.PORT || 8000
const express = require('express')
const app = express();
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

app.get(`/${services_version}/services/transform-csv/:host/:cid`, services.getJson);
app.get(`/${services_version}/services/search/:type/:cid`, services.search);

/******************/
/******************/
/***** ENDPOINTS **/
/******************/
/******************/
const api_version = process.env.API_VERSION;
console.log('activating endpoints for version: ', services_version);

app.get(`/${api_version}/:department/:cid/:type`, departments.getDepartments);

/******************/
/***** LISTEN PORT ******/
/******************/
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
