const PORT = process.env.PORT || 8000
const express = require('express')
const apicache = require('apicache')
const app = express();
let cache = apicache.middleware;

const { version } = require('./package.json');

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

/******************/
/******************/
/****** UTILS *****/
/******************/
/******************/
app.get('/utils/transform-csv/:host/:cid', services.getJson);
app.get('/utils/search/:type/:cid', services.search);

/******************/
/******************/
/***** SERVICES ***/
/******************/
/******************/
/* V1 */
const services_version = process.env.SERVICES_VERSION;
console.log('activating services for version: ', services_version);

/* Screenshots */
app.get('/v1/services/screenshot/:format/:width/:height', services.makeScreenshot);

/* Scraper */
app.get('/v1/services/scraper/:source/:category/:value', services.scraping);

/* Services */
app.get(`/v1/services/transform-csv/:host/:cid`, services.getJson);
app.get(`/v1/services/search/:host/:type/:cid`, services.search);

/******************/
/******************/
/******* SEARCH ******/
/******************/
/******************/
const api_endpoint = process.env.API_ENDPOINT;
console.log('activating api_endpoint: ', api_endpoint);

const api_version = version;
console.log('activating endpoints for version: ', api_version);

/* DEPRECATED */
app.get(`/v2/:department/:type/:host/:cid`, departments.getDepartments);

/* v1.0.0 */
app.get(`/v1/_search/:department/:type/:host/:cid`, departments.getDepartments);
/* v1.1.0 */
app.get(`/v1/_search/:host/:format/:cid`, services._search);


/******************/
/**** CAUTION *****/
/***** IMPORT *****/
/******************/
/******************/

/* v1.0.0 */
app.get(`/v1/import/:baseUrl/:startUrl`, services.importUrl);
app.get(`/v1/_import/:source/:operation`, services._import);


/******************/
/***** LISTEN PORT ******/
/******************/
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
