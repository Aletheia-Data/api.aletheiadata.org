const PORT = process.env.PORT || 8000
const express = require('express')
const apicache = require('apicache')
const app = express();
const cors = require('cors');
let cache = apicache.middleware;

const { version } = require('./package.json');

const dotenv = require('dotenv');
dotenv.config();

// imports
const services = require('./src/services');
const departments = require('./src/departments');
const entities = require('./src/api/entities');

// TODO: removed deprecated endpoints after during internal testing v1.3.0

/******************/
/******************/
/***** ENTRY ******/
/******************/
/******************/
app.use(cache('1 day'));

app.use(cors())

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
console.log('activating services for version: ', version);

/* Screenshots */
app.get('/v1/services/screenshot/:format/:width/:height', services.makeScreenshot);

/* Scraper */
app.get('/v1/services/scraper/:source/:category/:value', services.scraping);

/* Services */
app.get(`/v1/services/transform-csv/:host/:cid`, services.getJson);
app.get(`/v1/services/search/:host/:type/:cid`, services.search);

/******************/
/******************/
/***** DATA API ***/
/******************/
/******************/

/* Data API - DEPRECATED */
console.log('activating Data API');
app.get(`/v1/api/:entity/getAll`, entities.getAll);

/******************/
/******************/
/***** OPEN API ***/
/******************/
/******************/

app.get(`/v2/open-data/:entity/getAll`, entities.getAll);

/******************/
/******************/
/******* SEARCH ******/
/******************/
/******************/
const api_endpoint = process.env.API_ENDPOINT;
console.log('activating search on: ', api_endpoint);
console.log('activating endpoints for version: ', version);

/* v1.0.0  - DEPRECATED */
app.get(`/v1/_search/:department/:type/:host/:cid`, departments.getDepartments);

/* v1.1.0 - DEPRECATED */
app.get(`/v1/_search/:host/:format/:cid`, services._search);

/* v2.0.0 */
app.get(`/v2/_search/:host/:cid`, services._search);

/******************/
/**** CAUTION *****/
/***** IMPORT *****/
/******************/
/******************/

/* v1.0.0 - DEPRECATED */
app.get(`/v1/import/:baseUrl/:startUrl`, services.importUrl);
app.get(`/v1/_import/:source/:operation`, services._import);

/* v2.0.0 */
app.get(`/v2/import/datos-abiertos/:operation`, services._import);

/******************/
/***** LISTEN PORT ******/
/******************/
app.listen(PORT, () => console.log(`CORS-enabled server running on PORT ${PORT}`))
