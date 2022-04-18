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

/******************/
/******************/
/***** SERVICES ***/
/******************/
/******************/
/* V1 */
console.log('activating services for version: ', version);

/* Scraper */
app.get('/v1/services/scraper/:source/:category/:value', services.scraping);

/* Services */

/* DEPRECATED */
app.get('/v1/services/screenshot/:format/:width/:height', services.makeScreenshot);

/* Screenshots */
if (process.env.WEB3_STORAGE_API_KEY){
    console.log('activating Web3 Storage for screenshoot service');
} else {
    throw new Error('missing Web3 Storage API Key')
}
app.get('/v1/services/certified-screenshot/:width/:height', services.certScreenshot);
/* Transform CSV */
app.get(`/v1/services/transform-csv/:host/:cid`, services.getJson);
/* Search */
app.get(`/v1/services/search/:host/:cid`, services.minisearch);

/******************/
/******************/
/***** DATA API ***/
/* DEPRECATED */
/******************/

/* DEPRECATED */
console.log('activating Data API');
app.get(`/v1/api/:entity/getAll`, entities.getAll);

/******************/
/******************/
/***** OPEN API ***/
/******************/
/******************/

app.get(`/v2/open-data/:entity/getAll`, entities.getAll);

/******************/
/**** CAUTION *****/
/***** IMPORT *****/
/******************/
/******************/

/* DEPRECATED */
app.get(`/v1/import/:baseUrl/:startUrl`, services.importUrl);
app.get(`/v1/_import/:source/:operation`, services._import);

/* v2.0.0 */
app.get(`/v2/import/datos-abiertos/:operation`, services._import);

/******************/
/***** LISTEN PORT ******/
/******************/
app.listen(PORT, () => console.log(`CORS-enabled server running on PORT ${PORT}`))
