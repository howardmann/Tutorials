# Part 1: Intro to Node.js and Express

## Introduction
Tutorial to set up node.js and express with handlebars templating views.

## Background
Node is a runtime which allows us to write JavaScript on the server side (similar to irb with ruby). The creators basically took the V8 Chrome engine and wrapped it into the terminal.

Express is a web framework built on top Node which allows for http routing, rendering and communication with a database. Express was inspired by and similar to Sinatra (Ruby) and is a lightweight un-opinionated framework which interacts with many other third party packages.

Packages or modules in Node are a collection of reusable code/ libraries/ tools/ frameworks we can use in our Node applications. It is managed by the open source npm registry (node package manager), and is the same as ruby gems.

In this first part tutorial we will set up a boilerplate Node and Express web app (without a database) with dynamic routes and view rendering. We will require sass for compiling our css and express-handlebars for our view templating (equivalent to html.erb templates in Rails).

### 1. Setup
After installing node and npm we will also install express generator (provided by express) globally to set up our skeleton code ```~npm i -g express-generator```.

Then create a directory ```our-first-express-app``` and cd into it and run the following terminal command which will set up our express app using handlebars as the template and sass as our css compiler: ```express --hbs --css sass```. Then follow the prompt and run ```npm install``` to install all node dependencies for the express app.

We will configure our application slightly for convention purposes:  
* Create a new file named ```server.js``` in the root directory and copy into it all contents from the file ```bin/www```. Then delete the bin folder  
* In ```server.js``` change the app dependency reference to the current directory i.e.: ```var app = require('./app');```  
* In our ```package.json``` file (this is similar to our Rails gemfile) under scripts change the start reference to our server file ```"start": "node server",```  
* If not already install nodemon globally ```npm i -g nodemon``` (this will auto restart our server whenever we make changes to our code, it is needed in development). Then create a new script called dev and run nodemon server ```"dev": "nodemon server"```, this will run the start script and activate nodemon to monitor changes  

Next we need to configure our view templating engine. We will uninstall the default hbs dependecy and instead install the npm package express-handlebars. This gives us more functionality namely being able to use layouts which act as a wrapper for other templates (similar to Rails application/layout.html.erb).
* Uninstall hbs and remove it from our package.json file ```npm uninstall --save hbs```  
* Now instead install express-hbs and add it to our package.json ```npm install express-handlebars```  
* In our app.js file we will set our app to require the module and set the view templating engine. Then create a layouts directory in our views folder and move our layout file into this folder  

```javascript
// app.js
// Boilerplate express-generator modules that are required. Note we use bodyParser to be able to read submitted form data from the DOM
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Require routes to be used later on
var index = require('./routes/index');
var users = require('./routes/users');

// Instantiate express and save in app
var app = express();

// view engine setup
// ===ADD THIS CODE TO REQUIRE EXPRESS-HANDLEBARS
// We set the extension name to hbs and the default layout to a file named layout saved in our views/layouts directory. We will create this enxt. We do this so we can have multiple layouts but our default layout is the one described
app.engine('hbs', require('express-handlebars')({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
// ===ADD THIS CODE TO REQUIRE EXPRESS-HANDLEBARS

// Sets views to be rendered from our view directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
```

* Finally we will make one more adjustment to be able to render scss file and not sass. In our app.js require node-sass-middleware at the top ```var sassMiddleware = require('node-sass-middleware');``` after express and change the reference to the variable and also change some of the options below to be compressed. Then we can rename our .sass file to .scss in our public/stylesheets/style.scss.
```javascript
// app.js

var express = require('express');
var sassMiddleware = require('node-sass-middleware');

...

// ======SASS MIDDLEWARE========
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true,
  outputStyle: 'compressed'
}));

```

Remember to change our .sass default styling to regular .scss
```css
/* public/stylesheets/style.scss */
body {
  font-family: 'arial';
}
header {
  background-color: gainsboro;
}
footer {
  background-color: lemonchiffon;
}
```

* Our tree directory structure should look like this:
```
.
├── app.js
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       ├── style.css
│       └── style.scss
├── routes
│   ├── index.js
│   └── users.js
├── server.js
└── views
    ├── error.hbs
    ├── index.hbs
    └── layouts
        └── layout.hbs
```

* Finally start our server by running ```node run dev```

### 2. View layouts
Within our layouts let's render a header and footer which will wrap our application and style it for color. Notice the triple handlebar syntax {{{body}}} is the same as <%= yield %> in ruby and allows to render html.

```html
<!-- views/layouts/layout.hbs -->
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <header>
      <h1>Our first express app</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>

    {{{body}}}

    <footer>
      <small>A Howie_Burger tutorial</small>
    </footer>
  </body>
</html>
```

Now let's create our new views. Create a new directory called pages and two new view files about.hbs and contact.hbs
```
└── views
    ├── error.hbs
    ├── index.hbs
    ├── layouts
    │   └── layout.hbs
    └── pages
        ├── about.hbs
        └── contact.hbs
```

Then render some text into each file. Refer to next section of how we render dynamic content with hbs:
```html
<!-- pages/about.hbs -->
<h1>About page</h1>
<p>Find me in views/pages/about.hbs</p>
<p><em>{{someText}}</em></p>

{{global}}

<!-- pages/about.hbs -->
<h1>Contact page</h1>
<p>Find me in views/pages/contact.hbs</p>

{{#someArray}}
  <p><em>{{this}}</em></p>
{{/someArray}}

{{#if condition}}
  <p>Secret message</p>
{{else}}
  <p>Nothing to see here folks</p>
{{/if}}

{{global}}

```

### 3. Routes
Now we have our view templates we need to render them in our routes folder and then also require it in our app.js file. Firstly in our rotes folder create a new file called pages.js and then we can write out our routes below. The syntax to render a view page in express is a get request for the url and then to call the response argument and render the view file as well as passing in any objects we may want to dynamically render. As an example in our about route we will pass in a single someText object while in our contacts route we will pass in an array value which our view will then use hbs to iterate through and render. We can also send through booleans and set conditional logic in our hbs view.

```javascript
// routes/pages.js

/* Require this at the top of all of our route files, we use router so we can modularise our code */
var express = require('express');
var router = express.Router();

/* GET about and contacts page. */
router
  .get('/about', function(req, res, next) {
    res.render('pages/about', { someText: 'This is some dynamic content' });
  })
  .get('/contact', function(req, res, next) {
    res.render('pages/contact', { someArray: ['email@email.com', '123456', '123 fake street'], condition: true });
  });

module.exports = router;
```

Finally we need to require our route files in our main app.js file. We firstly require it ```var pagesRoutes = require('./routes/pages');``` then we set it in the middleware using ```app.use(pagesRoutes);```
```javascript
...
// Require our routes
var index = require('./routes/index');
var users = require('./routes/users');
var pagesRoutes = require('./routes/pages');

...

// Apply our routes in the middleware. We can also add a prefix url as the first argument which will namespace our routes, similar in Rails to namespacing our resources and routes
app.use('/', index);
app.use('/users', users);
app.use(pagesRoutes);
```

### 3 BONUS. Routes/ controller organisation
As our application scales and we have multiple CRUD features and data tables we will want to organise our routes in a RESTful approach. We will adopt a Rails approach to organising our apps as follows:
- ```routes/index.js```: will be our index of routes mapping the url to the relevant controller action (similar to Rails config/routes)
- ```routes/[model].js```: create a separate routes file for each of our database models (similar to Rails controllers)

In the example below we will have two models being topics and questions (where questions will belong to a topic). Note: The controller code here represents a Postgresql database using Bookshelf and Knex ORMs (beyond the scope of this tutorial).

In our routes/index.js file:
```javascript
// routes/index.js
var express = require('express');
var router = express.Router();
var topics = require('./topics.js');
var questions = require('./questions.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// TOPICS
router
  .get('/topics', topics.index)
  .get('/topics/new', topics.new)
  .post('/topics', topics.create)
  .get('/topics/:id', topics.show)
  .get('/topics/:id/edit', topics.edit)
  .put('/topics/:id', topics.update)
  .delete('/topics/:id', topics.destroy);

// QUESTIONS
router
  .get('/questions', questions.index)
  .get('/questions/new', questions.new)
  .get('/questions/:id', questions.show)
  .post('/questions', questions.create)
  .put('/questions/:id', questions.update)
  .delete('/questions/:id', questions.destroy);


module.exports = router;
```

Then going back to our app.js file we will direct the middleware towards our routes index.js file which will then be connected to each of the controllers:

```javascript
// app.js
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// ===== DELETE THIS BELOW
// var index = require('./routes/index');
// var users = require('./routes/users');

//...

// ==== USE THIS AS OUR ROUTES
// app.use('/', index);
// app.use('/users', users);
app.use(require('./routes'));

```

In our routes/topics.js file:

```javascript
var Topic = require('../models/topic');

exports.index = function(req, res, next) {
  Topic
    .fetchAll({withRelated: ['questions']})
    .then(data => {
      // res.render('topics/index', {data: data.toJSON()});
      res.json(data);
    }, next)
};

exports.show = function(req, res, next) {
  Topic
    .where({id: req.params.id})
    .fetch({withRelated: ['questions']})
    .then(data => {
      res.json(data);
    }, next)
};

exports.new = (req, res, next) => {res.render('topics/new') };

exports.create = (req, res, next) => {
  Topic
    .forge({name: req.body.name})
    .save(null, {method: 'insert', require:true})
    .then(data => {
      // res.redirect('/topics');
      res.json(data);
    }, next)
};

exports.destroy = (req, res, next) => {
  Topic
    .forge({id: req.params.id})
    .fetch()
    .then( topic => {
      topic.destroy({require:true})
      .then(res.json('success'));
    }, next)
};

exports.edit = (req, res, next) => {
  Topic
    .where({id: req.params.id})
    .fetch()
    .then(data => {
      res.json(data);
      res.render('topics/edit', {data: data.toJSON()});
    }, next)
};

exports.update = (req, res, next) => {
  Topic
    .forge({id: req.params.id})
    .fetch()
    .then( data => {
      data.save({name: req.body.name})
      .then(res.json('success'));
    }, next);
};
```

In our routes/questions.js file:

```javascript
var Question = require('../models/question');
var Topic = require('../models/topic');
var _ = require('underscore');

exports.index = function(req, res, next) {
  Question
    .fetchAll({withRelated: ['topic']})
    .then(data => {
      var questions = data.toJSON();
      var topics = _.uniq(questions.map(el => el.topic.name));

      var dataSort = topics.map(function(el){
        return {topic: el, questions: questions.filter(question => question.topic.name === el )};
      });
      console.log(dataSort);
      res.render('questions/index', {
        data: dataSort
      })
    }, next)
};

exports.show = function(req, res, next) {
  Question
    .where({id: req.params.id})
    .fetch({withRelated: ['topic']})
    .then(data => {
      res.json(data);
    }, next)
};

exports.new = (req, res, next) => {
  Topic
    .fetchAll()
    .then(data => {
      console.log(data.toJSON());
      res.render('questions/new', {
        topics: data.toJSON(),
        create: true
      });
    }, next)

};

exports.create = (req, res, next) => {
  Question
    .forge({question: req.body.question, answer: req.body.answer, topic_id: req.body.topic_id})
    .save(null, {method: 'insert', require:true})
    .then(data => {
      res.redirect('/#');
      // res.json(data);
    }, next)
};

exports.destroy = (req, res, next) => {
  Question
    .forge({id: req.params.id})
    .fetch()
    .then( topic => {
      topic.destroy({require:true})
      .then(res.redirect('/#'));
    }, next)
};

exports.update = (req, res, next) => {
  Question
    .forge({id: req.params.id})
    .fetch()
    .then(data => {
      data.save({question: req.body.question, answer: req.body.answer, topic_id: req.body.topic_id},{method: 'update', patch: true})
      .then(res.json(data));
    }, next)
};
```

### 4. Global view objects
We can also pass in global objects which are accessible across all templates without us having to explicitly render them. This becomes very useful later on when we are needing to access session data across views (e.g. in Rails @curren_user). For now we will just pass in a simple string. Follow the express syntax below and store your global objects into res.locals within a custom use middleware function.

This is now accessible in all view templates by calling ```{{global}}```.

```javascript
// app.js

// ===Custom setting res.locals to objects accessible across all views. Best apply this to our application.layout file. Remember to put after session
app.use(function (req, res, next) {
   res.locals = {
     global: 'Dynamic on all templates'
   };
   next();
});
```
