const axios = require('axios');
const api_endpoint = process.env.API_ENDPOINT;

exports.getName = (( source )=>{
  console.log('getting name file: ', source);
  return new Promise((resolve, reject) => {
    // save document
    return axios.get(`${source}`)
      .then(function (response) {
          // console.log('gotten name file: ', response);
          // before closing save images
          resolve(response);
          return
      })
      .catch(error => {
          console.log('getting failed --------');
          reject(error)
          return
      })

  })
}); 

exports.checkDepartment = (( issuerUrl )=>{
    return new Promise((resolve, reject) => {
      return axios.get(`${api_endpoint}/departments?website=${issuerUrl}`)
      .then(function (department) {
        resolve(department);
        return;
      })
      .catch(function (error) {
        reject(error);
        return;
      }); 
    })
  });

exports.checkSource =  (( source )=>{
    return new Promise((resolve, reject) => {
        return axios.get(`${api_endpoint}/sources?url=${source}`)
        .then(function (source) {
            resolve(source);
            return;
        })
        .catch(function (error) {
            reject(error);
            return;
        }); 
    })
});
