// Wrap methods to the util object and export
let util = module.exports = {}
// Dependencies
let axios = require('axios')

/**
 * Capitalize a single word
 * @param  {String} word
 * @return {String} {capitalized string}
 */
util.capitalize = (word) => {
  if (typeof word !== 'string') { throw new Error('capitalize: not a string')}
  return word[0].toUpperCase() + word.substr(1)
}

/**
 * Returns a sample member from an array
 * @param  {Array} arr
 * @return {*} {a random member from the Array}
 */
util.sampleItem = (arr) => {
  if (!Array.isArray(arr)) { throw new Error('sampleItem: not an array')}
  let randIndex = Math.floor(Math.random() * arr.length)
  return arr[randIndex]
}

/**
 * Contrived Promise which resolves with 'Hello World'
 * @return {Promise} {resolves to Hello World}
 */
util.fetchHello = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('hello world')
    }, 50)
  })
}

/**
 * Fetches
 * @param  {type} url     {description}
 * @param  {type} request {description}
 * @return {type} {description}
 */
util.fetchFruit = (database, request=axios) => {
  // Made up url, this would normally be the API we are calling
  let url = `http://localhost:3000/api/${database}`
  return request.get(url)
    .catch(err => {
      throw new Error(`fetchFruit: ${err}`)
    })
}