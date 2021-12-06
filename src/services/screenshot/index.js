const fs = require('fs');
const path = require('path');
const utils = require('../../utils');

const { v4: uuidv4 } = require('uuid');

const Nightmare = require('nightmare');

const compress_images = require("compress-images");

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

    /*

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
    */
    resolve(`${name}.${params.format}`);

  });
};

module.exports = {
  makeScreenshot
}