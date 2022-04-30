// import { Web3Storage } from 'web3.storage'
const web3Storage = require('web3.storage');

const { v4: uuidv4 } = require('uuid');

const Nightmare = require('nightmare');

const compress_images = require("compress-images");

function getAccessToken () {
  // If you're just testing, you can paste in a token
  // and uncomment the following line:
  // return 'paste-your-token-here'

  // In a real app, it's better to read an access token from an
  // environement variable or other configuration that's kept outside of
  // your code base. For this to work, you need to set the
  // WEB3STORAGE_TOKEN environment variable before you run your code.
  return process.env.WEB3_STORAGE_API_KEY
}

function makeStorageClient () {
  return new web3Storage.Web3Storage({ token: getAccessToken() })
}

async function getFiles (path) {
  const files = await web3Storage.getFilesFromPath(path)
  console.log(`read ${files.length} file(s) from ${path}`)
  return files
}

async function storeFiles (path) {
  const files = await getFiles(path);
  const client = makeStorageClient()
  const cid = await client.put(files,{
    wrapWithDirectory: false
  })
  console.log('stored files with cid:', cid)
  return cid
}

const makeScreenshot = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.format) { reject('missing format'); return;}
    if (!params.width) { reject('missing width'); return;}
    if (!params.height) { reject('missing height'); return;}

    if (!query || !query.url) { reject('missing url'); return;}

    const valid_format = [
      'png'
    ];

    if (!valid_format.includes(params.format)) { reject('wrong type'); return;}
    
    if (params.width == 0 || isNaN(params.width)) {reject('wrong width'); return;}
    if (params.height == 0 || isNaN(params.height)) {reject('wrong height'); return;}

    const name = uuidv4();

    var nightmare = new Nightmare({
      show: false,
      width: parseInt(params.width),
      height: parseInt(params.height)
    });

    var dimensions = await nightmare.goto(query.url)
      .wait('body')
      .evaluate(function() {
          var body = document.querySelector('body');
          var timestamp = `<p style="
            position: absolute; 
            bottom: 0; 
            left: 0;
            background-color: #fff;
            padding: 30px 50px;
            font-size: 14px;
          ">
            Certified by Aletheia Systems <br />
            ${(new Date()).toString()}
          </p>`;
          body.innerHTML = body.innerHTML + timestamp;
          return {
              height: document.body.clientHeight,
              width: document.body.clientWidth
          }
      });
    
    await nightmare.viewport(dimensions.width, dimensions.height)
      .screenshot(`./screenshot/${name}.${params.format}`);
    
    await nightmare.end();

    await compress_images(
      `./screenshot/${name}.${params.format}`,
      "./compress/",
      { 
        compress_force: false, 
        statistic: true, 
        autoupdate: true 
      }, false,
      { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
      { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
      { svg: { engine: "svgo", command: "--multipass" } },
      { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
      },async function (err, completed) {
        if (completed === true) {
          // resolve query
          resolve(`${name}.${params.format}`);
        }
      }
    );
    
    // resolve(`${name}.${params.format}`);

  });
};

const certScreenshot = async (params, query) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params and query: ', params, query);
    if (!params.width) { reject('missing width'); return;}
    if (!params.height) { reject('missing height'); return;}

    if (!query || !query.url) { reject('missing url'); return;}

    if (params.width == 0 || isNaN(params.width)) {reject('wrong width'); return;}
    if (params.height == 0 || isNaN(params.height)) {reject('wrong height'); return;}

    const name = uuidv4();
    const width = parseInt(params.width)
    const height = parseInt(params.height)

    var nightmare = new Nightmare({
      show: false,
      width: width,
      height: height
    });

    var dimensions = await nightmare.goto(query.url)
      .wait('body')
      .evaluate(function() {
          var body = document.querySelector('body');
          var timestamp = `<p style="
            position: absolute; 
            bottom: 0; 
            left: 0;
            background-color: #fff;
            padding: 30px 50px;
            font-size: 14px;
          ">
            Certified by Aletheia Systems <br />
            ${(new Date()).toString()}
          </p>`;
          body.innerHTML = body.innerHTML + timestamp;
          return {
              height: document.body.clientHeight,
              width: document.body.clientWidth
          }
      });
    
    await nightmare.viewport(dimensions.width, dimensions.height)
      .screenshot(`./screenshot/${name}.png`);
    
    await nightmare.end();

    await compress_images(
      `./screenshot/${name}.png`,
      "./compress/",
      { 
        compress_force: false, 
        statistic: true, 
        autoupdate: true 
      }, false,
      { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
      { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
      { svg: { engine: "svgo", command: "--multipass" } },
      { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
      },async function (err, completed) {
        if (completed === true) {
          const cid = await storeFiles(`./screenshot/${name}.png`)
          // resolve query
          resolve({
            cid: `${cid}`,
            metadata: {
              width: width,
              height: height,
              url: query.url
            }
          });
        }
      }
    );
    
    // resolve(`${name}.${params.format}`);

  });
};

const getFilecoinInfo = async (params) => {
  return new Promise(async (resolve, reject) => {
    //console.log('getting params: ', params);
    if (!params.cid) { reject('missing cid'); return;}
    
    const client = makeStorageClient()
    try {
      const status = await client.status(params.cid)
      if (status){
        resolve(status);
      } else {
        resolve('status not available');
      }
    } catch (error) {
      reject('CID not valid')
    }

  });
};


module.exports = {
  makeScreenshot,
  certScreenshot,
  getFilecoinInfo
}