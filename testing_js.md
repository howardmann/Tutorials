# Testing with JavaScript

## Overview
- Basic unit testing assertion and style
- Testing for validations and throwing errors
- Testing for randomness
- Handling asynchronous code
- Using dependency injection to stub dependencies and mock responses

## Setup
Setup folder structure as follows. Put all test files in a test folder which should mirror the file with a .spec extension.
```shell
├── test
│   └── utils.spec.js
└── utils.js
```
We will require `mocha` for our testing framework and `chai` for our assertion library. We will also install `axios` in advance for our http requester but we will stub this

```shell
npm init -y
npm i --save-dev mocha chai
npm i --save axios
echo node_modules  >> .gitignore
```

Our package.json should look like below. Also change the test script to `mocha` which will run all our test assertions files in the test folder
```javascript
{
  "name": "testing",
  "version": "1.0.0",
  "description": "Tutorial for basic testing principles",
  "main": "utils.js",
  "scripts": {
    "test": "mocha"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "chai": "^4.1.2",
    "mocha": "^4.0.1"
  },
  "dependencies": {
    "axios": "^0.16.2"
  }
}
```
## Basic unit testing assertion and style
Let's write our tests first. We first need to require `chai` and its expect method for our assertions. We also require the method we are testing. 

Mocha let's us wrap our tests in `describe` and `it` blocks. `describe` encapsulates the group/ function we are testing. `it` runs the tests.

We firstly test whether the `capitalize` exists/ was imported correctly. We then write how we expect the function to behave, we enter the `input` and the expected `actual` output. Then we use `chai`'s expect assertion to test that the input our method provides equals the actual result.

```javascript
// test/utils.spec.js

// Use chai as our assertion library using the `expect` syntax
let expect = require('chai').expect
// Import relevant utilities that we are testing
let {
  capitalize
} = require('../utils')

// Wrap functions we are testing in a describe block
describe('.capitalize', () => {
  // Most basic assertion, checking that we have imported it correctly
  it('should exist', () => expect(capitalize).to.not.be.undefined)
  
  // Follow basic `input` vs `actual` style. Assertions for strings are expect(input).to.equal(actual)
  // Assertions for objects and arrays must follow deep equal or eql syntax e.g. expect(input).to.eql(actual)
  it('should capitalize a single string', () => {
    let input = capitalize('hello')
    let actual = 'Hello'
    expect(input).to.equal(actual)
  })

})
```

When we run `npm test` script in our terminal it will fail because we haven't written the functions yet. Let's do this now.

We wrap our module in a `util` object namespace. This makes importing a lot easier. Then we solve for our input and expected actual output. If we run the test runner now `npm test` it should pass

```javascript
// utils.js

// Wrap methods to the util object and export
let util = module.exports = {}

/**
 * Capitalize a single word
 * @param  {String} word
 * @return {String} {capitalized string}
 */
util.capitalize = (word) => {
  return word[0].toUpperCase() + word.substr(1)
}

```

## Testing for validations and throwing errors
We will continue to build on the method and test above and write validations to ensure that only strings are being passed. Let's write the code for this first, we will throw a new Error if the type of argument is not a string
```javascript
// utils.js

util.capitalize = (word) => {
  if (typeof word !== 'string') { throw new Error('capitalize: not a string')}
  return word[0].toUpperCase() + word.substr(1)
}
```

Now we can update our test file. The chai library requires a workaround to test for errors being thrown, it must be encapsulated within an anonymous function inside the expect(). This is the only occasion you will likely need to remember this syntax:
```javascript
// test/utils.spec.js

  // Test for errors being thrown
  it('should throw error if given a number', () => {
    // When testing for thrown errors we cannot use input actual style
    // We must wrap the assertion in an expect function
    expect(() => capitalize(42)).to.throw('capitalize: not a string')
  })
``` 

We can also loop through input arguments to test multiple argument cases:
```javascript
// test/utils.spec.js

  it('should throw error if not given a string', () => {
    // We can test for multiple assertions using a forEach loop
    let inputsArr = [42, undefined, true, [], {}]
    inputsArr.forEach(input => {
      expect(() => capitalize(input)).to.throw('capitalize: not a string')
    })    
  })
``` 

## Testing for randomness
We can use `chai` libraries different assertions to test for randomness. In the example below we create a new method `.sampleItem(arr)` which will return a random member of the array.

We can change our assertions to test that the randomly sampled item is included in the original whole sample. 

Let's see the code first. Note we also test that the argument is an array
```javascript
// utils.js

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
```

Now the test. Note we use chai's `.to.include` helper
```javascript
// test/util.js

// Testing for randomness
describe('.sampleItem', () => {
  // Use .to.include to check that the sampled item is included in the original array 
  it('should sample a random item from an array', () => {
    let fruitArr = ['apple', 'banana', 'orange', 'pear']
    let input = sampleItem(fruitArr)
    expect(fruitArr).to.include(input)
  })

  // Test whether item is an array
  it('should throw error if item is not an array', () => {
    let inputsArr = [42, 'hello', {}, undefined, null, true]
    inputsArr.forEach(input => {
      expect(() => sampleItem(input)).to.throw('sampleItem: not an array')
    })
  })
})

```

## Handling asynchronous code
We will create a contrived asynchronous method which returns a Promise that resolves to 'hello world' after 50ms:

```javascript
// utils.js

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
```

To test this we will need to use `mocha`'s argument of `done` and call it when the code completes. This tells mocha to wait for the Promise to resolve before completing the test. Alternatively we can use ES7's `async await` to test, however this is only available on node version 8+ and above 

```javascript
// test/util.js

// Testing asynchronous
describe('.fetchHello', () => {
  // Mocha provides a `done` argument which we need to call to let the test runner to wait for the function to complete before calling done()
  it('should return a hello world message', (done) => {
    let actual = 'hello world'
    // Our asynchronous function is a Promise which allows us to use .then syntax
    fetchHello().then(message => {
      expect(message).to.equal(actual)
      done()
    })
  })

  // If using node v 8 and above We can use ES7 async await which enables us to use input actual syntax
  it('should also reutrn a hello world message using async await', async() => {
    let input = await(fetchHello())
    let actual = 'hello world'
    expect(input).to.equal(actual)
  })
})

```

## Using dependency injection to stub dependencies and mock responses
In the example below we have a fetchFruit helper which uses axios to return a Promise which makes a http get request to an API url. Here we rely on ES6 default params and dependency injection. This method will allow us to inject a fake HTTP request object with a .get method that resolves to a Promise.

If none is given (i.e. in a non-test environment), it will default to using the `axios` library which we require above.

```javascript
// utils.js

// Wrap methods to the util object and export
let util = module.exports = {}
// Dependencies
let axios = require('axios')

/**
 * Fetches fake fruit
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
```

This makes it easier for us to test. We can mock a fake request method which resolves to our fruitObj. There isn't a major benefit of mocking and directly testing the mocked object (as we are forcing a positive test result). The key advantage is that  1) it allows us to combine tests with other utilities and 2) test for errors being thrown.

```javascript
// test/utils.js

// Mocking, stubbing responses using dependency injection
describe('.fetchFruit', () => {
  // We can use ES6 default arguments to stub out dependencies

  // Object that our fake requester will resolve to
  let fruitObj = {
    data: {
      fruits: ['apple', 'orange', 'banana', 'pear', 'peach']
    }
  }
  // Create a fakeRequest function with a get method that resolves our fruit object
  let fakeRequest = {
    get: function () {
      return Promise.resolve(fruitObj)
    }
  }
  
  // Double check that our stub works
  it('should fake fetch a fruit object', (done) => {
    // We pass in the fakeRequest as our dependency
    fetchFruit('fruit', fakeRequest)
      .then(resp => {
        expect(resp).to.eql(fruitObj)
        done()
      })
  })

  // Now let's put it all together
  // This then allows us to do integration testing without calling external APIs
  it('should all work together, hit the api to get some fruits, sample a random one and capitalize it', (done) => {
    fetchFruit('fruit', fakeRequest)
      .then(resp => {
        let fruits = resp.data.fruits
        let randomFruit = sampleItem(fruits)
        let capitalizedFruit = capitalize(randomFruit)
        expect(fruits).to.include(randomFruit)
        done()
      })
  })
  
  // Let's force an error and test for errors
  it('should catch and throw error if badRequest', (done) => {
    let badRequest = {
      get: function () {
        return Promise.reject('nar mate')
      }
    }
    fetchFruit('dog', badRequest)
      .catch(resp => {
        let input = resp.message;
        let actual = 'fetchFruit: nar mate'
        expect(input).to.equal(actual)
        done()
      })
  })
})
```