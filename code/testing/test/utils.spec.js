// Use chai as our assertion library using the `expect` syntax
let expect = require('chai').expect
// Import relevant utilities that we are testing
let {
  capitalize,
  sampleItem,
  fetchHello,
  fetchFruit
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

  // Test for errors being thrown
  it('should throw error if given a number', () => {
    // When testing for thrown errors we cannot use input actual style
    // We must wrap the assertion in an expect function
    expect(() => capitalize(42)).to.throw('not a string')
  })

  it('should throw error if not given a string', () => {
    // We can test for multiple assertions using a forEach loop
    let inputsArr = [42, undefined, true, [], {}]
    inputsArr.forEach(input => {
      expect(() => capitalize(input)).to.throw('capitalize: not a string')
    })    
  })
})

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
