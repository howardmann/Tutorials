# Node.js and Express

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
