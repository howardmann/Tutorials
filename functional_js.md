# Functional JavaScript

## Overview
Introduction to functional programming in JavaScript. This guide covers the following topics:  

1. What is functional programming?  
2. Applicative programming (map, filter, reduce)  
3. Recursion  

## 1. What is functional programming and why should I care?
Functional programming is often introduced as a programming style which makes use of some of the following features:
- **Higher-order functions:** functions take other functions as arguments and/ or return other functions
- **Composability:** functions built from other functions to encourage reusability (includes currying)
- **Pure functions:** functions which always return the same value when given the same argument
- **Immutability:** functions which return new values without mutating/ changing the state of the argument passed
- **Recursion:** functions that call themselves until they don't

**BUT!** I find this jargon overwhelming and a terrible way understand functional programming as a JavaScript newbie like myself...

I find examples helpful and I will attempt to compare a simple function whose purpose is to capitalize a name it is given using three approaches:  
- **A. Imperative** - what we typically start out doing  
- **B. Object-oriented** - what we may do as an attempt to organise our code as it scales  
- **C. Functional** - the approach this article hopes to elucidate

### A. Imperative
Imperative approach often follows how we would logically solve the problem. In our example of capitalizing a name we might approach a solution as follows:
1. Split the name string into an array of words
2. Loop through the array and transform each word by uppercasing the first letter and adding the remaining letters
3. Join the array of words into a new string and return the string

Let's look at this in code
```javascript
var capitalize = function(str){
  var arr = str.split(' ');
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i][0].toUpperCase() + arr[i].substr(1);
  }
  return arr.join(' ');
};

capitalize('clark jerome kent');
// => 'Clark Jerome Kent'
```

Now while there is nothing wrong with this approach we can point out a few issues which may occur as our codebase scales. Firstly, this function serves a very specific purpose and is not composable, meaning we may find ourselves writing a new function to uppercase the second letter in the string (why? I dunno). Secondly, there could be a risk of naming conflicts if later on we assign a different value to capitalize.

### B. Object-Oriented
An object oriented approach may look to encapsulate the capitalize name method in a Person object to prevent naming conflicts. While this example may be a stretch/overkill it illustrates how we can take an object-oriented approach and encapsulate the function.

We might create a Person object which includes a name property and a method for capitalizing its own name. You may notice that the capitalize method in the Person object is similar to the imperative example above; it is important to note that you shouldn't feel obliged to follow any one style dogmatically. Use what is best for readability and debugging.

More code
```javascript
var Person = {
  addName: function(name){
    this.name = name;
  },
  capitalize: function(){
    var arr = this.name.split(' ');
    for (var i = 0; i < arr.length; i++){
      arr[i] = arr[i][0].toUpperCase() + arr[i].substr(1);
    }
    this.name = arr.join(' ');
  }
};

var superman = Object.create(Person);
superman.addName('clark jerome kent');
superman.capitalize();
superman.name;
// => 'Clark Jerome Kent'
```

### C. Functional
Finally we can compare an imperative and object-oriented approach to a functional approach. Here we will create two functions, the first capitalizeWord whose job as it suggests will be to capitalize one word and another function mapString who will take two arguments being a function and string to iterate through. The mapString function will then split the string, iterate through and call on the function it was given.

Let's see this in code
```javascript
var capitalizeWord = function(word){
  return word[0].toUpperCase() + word.substr(1);
};

var mapString = function(string, fun){
  return string.split(' ').map(fun).join(' ');  // Refer sections below for an explanation of the map, filter and reduce functions
};

mapString('clark jerome kent', capitalizeWord);
// => 'Clark Jerome Kent'
```

We can also refactor this code into some ES6 syntactic sugar. While it may only be syntax different, it in fact promotes the use of simple one line functions and encourages chaining.
```javascript
var capitalizeWord = (word) => word[0].toUpperCase() + word.substr(1);
var mapString = (string, fun) => string.split(' ').map(fun).join(' ');

mapString('bruce wayne', capitalizeWord);
// => 'Bruce Wayne'
```

Our mapString function is now composable and can accept any functions. Here we create a new function called endY which as its name suggests adds a Y to the end of the word
```javascript
// mapString function is now composable accepting any function
var endY = (word) => word + 'y';

mapString('bruce wayne', endY);
// => 'brucey wayney'
```

Key observations in above functional example:
- We broke aspects of the solution into smaller solutions. 1) One function was to transform one element; and (2) Another function was to split a string into an array and iterate through passing a function
- Our functions were composable. The mapString function accepted other function arguments, in this example adding a y to each letter to make brucey wayney
- Our functions promoted immutability, meaning we did not transform/ destroy any of the arguments but returned a new value
- We used chaining which works well with immutable functions that return new values. In the mapString example we chained a split map join methods
- Finally the biggest thing to remember is that with JavaScript we can accept functions as arguments (e.g. capitalize and endY for our mapString function) and we should be encouraged to do so

## 2. Applicative programming
*In progress*

## 3. Recursion
*In progress*
