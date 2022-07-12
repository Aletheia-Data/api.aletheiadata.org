const PORT = process.env.PORT || 8000
const express = require('express')
const bodyParser = require('body-parser');
const apicache = require('apicache')
const cors = require('cors');
const fileupload = require("express-fileupload");

let cache = apicache.middleware;

var { initialize } = require("express-openapi");
var swaggerUi = require("swagger-ui-express");

const { version } = require('./package.json');

const dotenv = require('dotenv');
dotenv.config();

// imports
const services = require('./src/services');
const entities = require('./src/api/entities');
const assets = require('./src/operations/assets');

// TODO: removed deprecated endpoints after during internal testing v1.3.0

/******************/
/******************/
/***** ENTRY ******/
/******************/
/******************/
const app = express();

// app.use(cache('1 day'));
app.use(cors());
app.use(fileupload());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// OpenAPI routes
initialize({
    app,
    apiDoc: require("./api/api-doc"),
    paths: "./api/paths",
});

// OpenAPI UI
app.use(
    "/api-documentation",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: "http://localhost:8000/api-docs",
      },
    })
);

console.log(
    "OpenAPI documentation available in http://localhost:8000/api-documentation"
);

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
/* Filecoin */
app.get(`/v1/services/filecoin/:cid`, services.filecoin);

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
/******************/
/***** OPERATIONS ***/
/******************/
/******************/

app.post(`/v2/ops/assets/add`, assets.add);

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
