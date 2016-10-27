# Functional JavaScript

## Overview
Introduction to functional programming in JavaScript. This guide covers the following topics:  

1. What is functional programming?  
2. Higher order functions
3. Applicative programming (map, filter, reduce)  
4. Recursion  
5. Bonus: creating our own map function

## 1. What is functional programming and why should I care?
Functional programming is often introduced as a programming style which makes use of some of the following features:
- **Higher-order functions:** functions which take other functions as arguments and/ or return other functions
- **Composability:** functions built from other functions to encourage reusability (includes currying which involves transforming a multi-argument function into a function that takes less arguments then it did originally)
- **Pure functions:** functions which always return the same value when given the same argument
- **Immutability:** functions which return new values without mutating/ changing the state of the argument passed
- **Recursion:** functions that call themselves until they don't

**BUT!** I find this jargon overwhelming and a difficult way to understand functional programming for a JavaScript newbie like myself...

I find examples helpful and I will attempt to compare a simple function whose purpose is to capitalize a name it is given using three approaches:  
- **A. Imperative** - logically solving the task in one capitalize function  
- **B. Object-oriented** - encapsulating the capitalize method in a Person object
- **C. Functional** - breaking down the solution into multiple smaller and reusable functions

### A. Imperative
Imperative approach often follows how we would logically solve the problem. In our example of capitalizing a name we might approach a solution as follows:  

1. Split the name string ```'clark jerome kent'``` into an array of words ```['clark', 'jerome', 'kent']```
2. Loop through the array and transform each word by uppercasing the first letter and adding the remaining letters  ```['Clark', 'Jerome', 'Kent']```
3. Join the array of words into a new string and return the string  ```'Clark Jerome Kent'```

Let's look at this in code imperatively:
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
An object oriented approach may look to encapsulate the capitalize name method in a Person object to prevent naming conflicts. While this example may be a stretch/ overkill it illustrates how we could take an object-oriented approach to encapsulating the function. For example capitalize method could mean something else in our code for finding the capital city of a country (...or wateva).

We might create a Person object which includes a name property and a method for capitalizing its own name. You may notice that the capitalize method in the Person object is similar to the imperative example above; it is important to note that you shouldn't feel obliged to follow any one style dogmatically. Use what is best for readability and debugging.

More code, this time object-oriented:
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
Finally we can compare the above approaches to a functional approach. Here we will create two functions, the first ```capitalizeWord``` whose job as it suggests will be to capitalize one word and another function ```mapString``` who will take two arguments being a function and string to iterate through. The mapString function will then split the string, iterate through and call on the function it was given.

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
- Our functions were composable. The mapString function accepted other function arguments, in this example adding a y to each letter turning ```'bruce wayne'``` to ```'brucey wayney'```
- Our functions were immutable, meaning we did not transform/ destroy any of the arguments but returned a new value
- We used chaining which works well with immutable functions that return new values. In the mapString example we chained ```.split``` ```.map``` and ```.join``` methods
- Finally the biggest thing to remember is that with JavaScript we can accept functions as arguments (e.g. capitalize and endY for our mapString function) and we should be encouraged to do so (which is a perfect segway to our next section on higher-order functions)

## 2. Higher-order functions
Functional programming also makes use of higher-order functions which can take a function as a first parameter and then return another function which awaits a parameter.

In the capitalize name example above we used a higher-order function mapString which accepted another function as an argument. In this example we will write a function which returns another function. Functions which return other functions can be thought of as template functions which allow us to create new custom functions.

Code example should be clearer:

We will write a findAndReplace function which takes two arguments (regex, strReplace) and returns a new function which awaits a text string which will match the previously passed in regex and replace with the strReplace. Confusing I know, just read the code:

```javascript
// Create a higher-order function findAndReplace which is used as a template return new custom functions
var findAndReplace = function(regex, strReplace){
  return function(text){
    return text.replace(regex, strReplace);
  };
};

// Create a custom function passing in a custom regex and word to replace it with
var correctJS = findAndReplace(/javascript/g, 'JavaScript');
// correctJS will now be a new function awaiting a text argument which it will then replace with the regex /javascript/g with correct spelling 'JavaScript'
correctJS('I love javascript and spelling javascript');
// => 'I love JavaScript and spelling JavaScript'

// We can compose a new function with the findAndReplace higher-order function template
var correctRails = findAndReplace(/rails/g, 'Ruby on Rails');
correctRails('I am learning rails');
// => 'I am learning Ruby on Rails'
```

Remember that higher-order functions can be thought of as templates/ blueprints to construct other functions. We firstly pass in arguments to create a custom function variable; Then we can call the function by passing in a new argument which will execute against the previously passed in arguments which created the function.

## 3. Applicative programming: map | reduce| filter
Applicative programming is used in functional programming by functions calling other functions. Importantly applicative programming returns new values and does not mutate values. This is most commonly represented by the three methods being ```map```, ```reduce``` and ```filter```. All three methods iterate through an array and return a new value based on the function argument passed in. However, each method performs an iteration differently:
- **map**: iterates through each element in an array and manipulates it returning an array of same length
- **reduce**: iterates and collapses the elements in an array returning a single value
- **filter**: iterates through an array and returns the element based on a predicate method passed in

Once again these examples are best explained through examples and comparisons to an imperative approach:

###map###
Example: double each of the elements in a numbers array [1,2,3,4,5] => [2,4,6,8,10]

```javascript
var arr = [1,2,3,4,5];

// Imperative approach
var newArr = [];
for (var i = 0; i < arr.length; i++){
  newArr.push(arr[i] * 2);
}
console.log(newArr);
// => [2,4,6,8,10]

// Functional approach using map
var newArr = arr.map(function(el){
  return el * 2;
});
console.log(newArr);
// => [2,4,6,8,10]

// ES6 syntax using arrow functions
var newArr = arr.map(el => el * 2); // => [2,4,6,8,10]
```
###reduce###
Example: sum total each of the elements in a numbers array [1,2,3,4,5] => 15

```javascript
var arr = [1,2,3,4,5];

// Imperative approach
var sumTotal = 0;
for (var i = 0; i < arr.length; i++){
  sum += arr[i];
}
console.log(sumTotal);
// => 15

// Functional approach using reduce
var sumTotal = arr.reduce(function(sum,el){
  return sum += el;
},0);
console.log(sumTotal);
// => 15

// Again some more sugar
var sumTotal = arr.reduce( (sum,el) => sum+=el ); // => 15
```

###filter###
Example: return even numbers in the array [1,2,3,4,5] => [2,4]

```javascript
var arr = [1,2,3,4,5];

// Imperative approach
var even = [];
for (var i = 0; i < arr.length; i++){
  if (arr[i] % 2 === 0){
    even.push(arr[i]);
  }
}
console.log(even);
// => [2,4]

// Functional approach using filter
var even = arr.filter(function(el){
  return (el % 2 === 0);
});
console.log(even);
// => [2,4]

// Who doesn't love sugar
var even = arr.filter(el => el % 2 === 0);  // => [2,4]
```

###Method chaining###
Finally the best part of using functional programming is the ability to chain functions (which is encouraged).

Final example: take the array [1,2,3,4,5], double each element, filter for numbers greater than 2 and then calculate sum total. Let's do it imperatively and then functionally.

```javascript
var arr = [1,2,3,4,5];

// Imperative approach in one go
var double = [];
for (var i = 0; i < arr.length; i++){
  double.push(arr[i] * 2);
}

var overTwo = [];
for (var i = 0; i < double.length; i++){
  if (double[i] > 2){
    overTwo.push(double[i]);
  }
}

var sumTotal = 0;
for (var i = 0; i < overTwo.length; i++){
  sumTotal += overTwo[i];
}

console.log(sumTotal);
// => 28

// Functional approach chaining map, filter and reduce with sugar of course
var sumTotal = arr.map(el => el * 2)
                  .filter(el => el > 2)
                  .reduce((sum,el) => sum += el);

console.log(sumTotal);
// => 28
```
As we can see while the functional approach may seem like a syntax difference on a standalone basis, when chained with other methods it makes our code easier to reason, debug and reuse our functions. This is the essence of functional programming.

## 4. Recursion
Recursive functions are ones that call themselves from inside the function until a condition is reached and they stop. Recursive functions can be used as an alternative to for loops, and in particular if the bounds are unknown.

Let's start with a simple example of writing a countdown timer in an imperative vs. recursive approach:

```javascript
// Imperative approach
var countDown = function(num) {
  for (var i = num; i > 0; i--){
    console.log(i);
  }  
};
countDown(10);
// => 10, 9 ... 1

// Recursive approach
var countDownRecursive = function(num){
  if (num === 0) { return; }
  console.log(num);
  countDownRecursive(num - 1);
};
countDownRecursive(10);
// => 10, 9 ... 1
```

A recursive function should include three patterns: 1) a condition for when to stop; 2) take one step; 3) smaller problem for function to solve. Let's compare another example to find the length of an array (I know you can do this normally):

```javascript
// Define an array
var arr = [1,2,3,4,5,6];

// Imperative approach
var countLen = function(arr){
  var count = 0;
  var length = arr.length;
  var i;
  for (i = 0; i < length; i++){
    count++;
  }
  return count;
};
countLen(arr);
// => 6

// Recursive approach
var countLenRecursive = function(arr){
  // 1) condition to stop when length === 0 (I know we are using length here but hey its just an example)
  if (arr.length === 0) { return 0;}
  // 2) take one step by adding 1 to previous function return and slicing the array
  // 3) smaller problem to solve by passing in a smaller array
  return 1 + countLenRecursive(arr.slice(1));
};
countLenRecursive(arr);
// => 6
```

Let's do one more example: find the factorial (e.g. factorial of 6 is 6 x 5 x 4 x 3 x 2 x 1). I know maths sucks but lets do it anyway:

```javascript
// Imperative approach
var factorial = function(num){
  var sumProduct = 1;
  for (var i = 2; i <= num; i++){
    sumProduct = sumProduct * i;
  };
  return sumProduct;
};
factorial(6);
// => 720

// Recursive approach
var factorialRecursive = function(num){
  // 1) Stop when: Terminate by returning 1 if number is less than 0;
  if (num === 0) {return 1;}
  // 2) Take one-step (num *)
  // 3) Smaller problem (num -1)
  return num * factorialRecursive(num -1);
};
factorial(6);
// => 720
```

## 5. Bonus: Creating our own map function
As outlined above, JavaScript's map function is heavily used in functional programming styles to iterate through and transform an array (non-destructively). ```map``` is a higher order function in that it accepts another function as an argument. In this example we will show how we can build our own custom ```customMap``` function by creating a new Array prototype method.

In our example we will again iterate through an ```arr = [1,2,3,4,5]``` and double each of the values returning a ```newArr = [2,4,6,8,10]```

```javascript
var arr = [1,2,3,4,5];

// Defining a simple double function
var double = function(num){
  return num * 2;
};

// Using the map method
var newArr = arr.map(double); // => [2,4,6,8,10]

// Looking under the hood we can define our own higher-order map method by adding it to the Array prototype. It will accept one function argument and iterate through each of the elements in the array passing in each element into the function and returning a new array value
Array.prototype.customMap = function(fun){
  var result = [];
  for (var i = 0; i < this.length; i++){
    result.push(fun(this[i]));
  }
  return result;
};

var customArr = arr.customMap(double); // => [2,4,6,8,10]

// That's all folks!
```
