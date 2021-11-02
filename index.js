const PORT = process.env.PORT || 8000
const express = require('express')
const app = express()

// imports
const utils = require('./src/utils');
const departments = require('./src/departments');

app.get('/', (req, res) => {
    res.json('Welcome to Aletheia Data API')
})

app.get('/departments', departments.findByAll);

app.get('/utils/transform-csv/:type/:url', utils.transformCSV);

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
