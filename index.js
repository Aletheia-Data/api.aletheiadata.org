const PORT = process.env.PORT || 8000
const express = require('express')
const app = express();

// imports
const utils = require('./src/utils');
const departments = require('./src/departments');

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
/***** UTILS ******/
/******************/
/******************/

app.get('/utils/transform-csv/:host/:cid', utils.getJson);

app.get('/utils/search/:type/:cid', utils.search);

/******************/
/******************/
/***** ENDPOINTS ******/
/******************/
/******************/
const api_version = 'v2';

app.get(`/${api_version}/:department/:category/:cid/:type`, departments.dep_minerd);

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
