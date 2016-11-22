# Part 2: Node.js authentication with Passport.js

## Introduction
This tutorial follows on from the Node.js Express intro and covers user authentication and authorisation using passport.js. We will add the following features:
* Database integration with Docker and MySql to store our user data and knex to access
* Express sessions to keep track of state
* User sign up, login and logout with Passport
* User authorization for view pages through Express middleware (this is the easiest)

## Docker setup
We use Docker as a container to ensure our development environment works the same in production.

Run the following commands to open a Docker daemon and name your container (in our instance we will call it auth-mysql and call our database auth):

```javascript
// Install docker www.docker.com. Open the application and run the following terminal command
docker run -d --name auth-mysql -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=auth mysql

// To see your docker containers run the following
docker ps
docker ps -a // For all containers

// To stop, start the database by name
docker stop auth-mysql
docker start auth-mysql
docker rm auth-mysql
```

## MySql integration with SequelPro
Integrate your database container with SequelPro. Open the application and pass in the following paramaters and then connect:
```
Host: 127.0.0.1
Username: root
Password: *optional*
```

Choose your named database from the dropdown list (in our instance it was named auth) and then click add to create a users table with the following key value pairs in the Structure tab. VARCHAR is similar to string, TEXT to text and BOOLEAN/ TINYINT to boolean. In Content tab you may want to create some dummy data.
```
Field, Type, Length, Default
id, INT, 11
email, VARCHAR, 50
password, VARCHAR, 100
name, VARCHAR, 50
is_admin, BOOLEAN, 1, 0
```

## Install packages
CD into our app and then in terminal then we install our relevant packages. Each one does the following:
- mysql: requires the mysql database
- express-session: builtin express package to keep track of session cookies
- knex: third party library with helpers to communicate with mysql database (ORM lite version of communicating with SQL database)
- passport and passport-local: third party library for authentication and authorisations (the bulk of this tutorial will be focused on this)
- bcrypt-nodejs: Highly secure hashing algorithim which salts and encrypts our passwords. Similar to bcrypt gem in Rails, we do not save plain text passwords in our database
- connect-flash: node package which helps us flash success and error messages
- connect-redis: memory database for storing our session keys as hashes

```
npm i --save mysql express-session knex passport passport-local bcrypt-nodejs connect-flash connect-redis
```

Next require the relevant packages in our app.js file. Note order here matters, particularly express-sessions, connect-redis passport and flash. Not worth remembering the order.

```javascript
var express = require('express');
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// Require npm packages for authentication
var session = require("express-session");
var RedisStore = require('connect-redis')(session)
var passport = require('passport');
var flash    = require('connect-flash');

var index = require('./routes/index');
var users = require('./routes/users');
var pagesRoutes = require('./routes/pages');

var app = express();

// view engine setup
// ===EXPRESS-HANDLEBARS VIEW===
app.engine('hbs', require('express-handlebars')({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ======PASSPORT AND SESSIONS MIDDLEWARE========
app.use(session({store: new RedisStore(), secret: "i love dogs", resave: false, saveUnitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
```

Note: if you are having error messages with the sessions i.e. req.flash requires sessions, this may be because the redis server is not running. To run the redis server run the terminal command ```redis -server &``` and then enter the cli ```redis-cli```. To see the key value pairs enter ```key *```.



## Setup database and passport
To set up our database and passport authentication we will create a separate directory called config and add two new files: db.js and passport.js. Then we will also add a new auth.js file in our routes directory where we will include all our user signup, login and logout paths. In addition we will create a separate views directory for our authentication being a signup and login page.

Our tree directory should now look like this (note this builds from the first Node.js Express intro tutorial, so refer back to it if you are unsure):

```
.
├── app.js
├── config
│   ├── db.js
│   └── passport.js
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       ├── style.css
│       └── style.scss
├── routes
│   ├── auth.js
│   ├── index.js
│   ├── pages.js
│   └── users.js
├── server.js
└── views
    ├── auth
    │   ├── login.hbs
    │   └── signup.hbs
    ├── error.hbs
    ├── index.hbs
    ├── layouts
    │   └── layout.hbs
    └── pages
        ├── about.hbs
        └── contact.hbs
```

Within our db.js file we will add the following code to connect with our mysql database port and export the module as knex for us to be able to access from other files:
```javascript
// config/db.js
var knex = require('knex')({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "root",
    database: "auth",
  }
});

module.exports = knex;
```

## Passport authentication
The bulk of our authentication logic will go inside our config/passport.js file. Here we will require bcrypt, knex and passport to write our custom passport authentication strategies which will be used later in our routes.

The two strategies we will write will be 'local-signup' and 'local-login' (passport refers to these functions as strategies and will also include other more advanced login strategies such as with facebook, google etc):
* **local-signup:** will create a new user with the paramaters passed in, making sure to encrypt and save the password with bcrypt. Validations will ensure that if the email already exists or the passwords don't match then an error flash message will be passed.
* **local-login:** will check if the email and hashed passwords match and if so return a user, otherwise will return false.

Note that the custom passport methods only return false or an object. Later on in our routes we will setup the successRedirect, failureRedirect etc. conditions.

Then below the two custom strategies/ functions we have two passport functions which help us set and get the user id from the session cookie:
* **passport.serializeUser:** which saves the user in a session cookie if successful (this is equivalent in Rails to saving the session id as session[:id] = @current_user),
* **passport.deserializeUser:** which is able to fetch the user from the database based on the id (similary this would be the same as @current_user = User.find(session[:id]))

Remember most of this code is not worth memorising as it won't change match, just know that we are firstly writing two custom functions to create a new user and authenticate a user, and two separate functions to get and set the user id from the session.

```javascript
// config/passport.js

var bcrypt = require('bcrypt-nodejs');
var knex = require('./db.js');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// ==========USER SIGN UP AND HASH PASSWORD===========
passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
  },
  function(req, username, password, done) {
    knex("users")
      .where("email", username)
      .first()
      .then(user => {
        if (user){
          return done(null, false, req.flash('message', 'Email taken'));
        }
        if (password !== req.body.password2) {
          return done(null, false, req.flash('message', 'Passwords do not match'));
        }

        var newUser = {
          email: username,
          password: bcrypt.hashSync(password),
          name: req.body.name
        };

        knex("users")
          .insert(newUser)
          .then(ids => {
            newUser.id = ids[0];
            return done(null, newUser, req.flash('message', 'Succesfully created'));
          }, done)
      }, done)
  }
));

// ==========USER LOGIN AUTHENTICATION===========
passport.use('local-login', new LocalStrategy({
    passReqToCallback: true
  },
  function(req, username, password, done) {
    knex("users")
      .where("email", username)
      .first()
      .then(user => {
        if (!user || !bcrypt.compareSync(password, user.password)){
          return done(null, false, req.flash('message', 'Invalid email or password'));
        }
        return done(null, user, req.flash('message', 'Successfully logged in'))
      }, done)
  }
));

// ==========GET AND SET SESSION===========
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  knex("users")
    .where("id", id)
    .first()
    .then(user => {
      return done(null, user)
    }, done)
});
```

## View: Login and Signup
Next we write the forms for our login and signup pages. Note we also pass in a {{message}} hbs field which will render a flash message based on the authentication method. This is quite standard HTML5 form inputs. Both forms will take a post method to their respective urls (Next section will work on routes)

Note: only difference worth noting is that passport.js by default looks for the ```username``` and ```password``` name fields, if you want to edit this refer to the official website, otherwise keep it as username and then refer to it differently in knex i.e. ```  function(req, username, password, done) {knex("users").where("email", username)...```.

```html
<!-- views/auth/login.hbs -->
<form action="/login" method="post">
  <p>Email:</p>
  <input type="text" name="username" required="true" autofocus="true">

  <p>Password:</p>
  <input type="password" name="password" required="true">

  <p><input type="submit" value="Login"></p>
</form>

<p>{{message}}</p>

<!-- views/auth/signup.hbs -->
<form action="/signup" method="post">
  <p>Name:</p>
  <input type="text" name="name"/>

  <p>Email:</p>
  <input type="text" name="username"/>

  <p>Password:</p>
  <input type="password" name="password"/>

  <p>Password (repeat):</p>
  <input type="password" name="password2"/>

  <p><input type="submit" value="Sign up"/></p>
</form>

<p>{{message}}</p>
```

## Routes: Login and Signup
In our routes/auth.js file we will write out our get and post url methods for signup, login and logout.

We will also require our config/passport.js file where we wrote our passport strategies for local-signup and local-login. Here it becomes quite easy, we call on the passport.authenticate method and pass in as a second argument the conditions for success or failure redirect and the option to flash a message. For our get methods we render the relevant view page but also pass in a message object with req.flash('message') which relies on the connect-flash package to render the flash messages we stored in our passport.js file.

For logout it is quite straight forward, we create a get request and then rely on the passport req.logout() method to delete our session and redirect back to the root page

```javascript
// routes/auth.js

var express = require('express');
var router = express.Router();
var passport = require('passport');
var knex = require('../config/db');
require('../config/passport.js');

router
  .get('/signup', function(req, res, next) {
    res.render('auth/signup', {
      message: req.flash('message')
    });
  })
  .post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: 'auth/signup',
    failureFlash: true
  }))
  .get('/login', function(req, res, next) {
    res.render('auth/login', {
      message: req.flash('message')
    });
  })
  .post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: 'auth/login',
    failureFlash: true
  }))
  .get('/logout', function(req, res, next) {
    req.logout();
    req.flash('message', 'Succesfully logged out');
    res.redirect('/');
  })

module.exports = router;
```

## Requiring our authentication in our app.js
Remember to require our new routes/auth.js file in our app and then app.user it

```javascript
// routes/auth.js
...
// Require the routes.js files
var index = require('./routes/index');
var users = require('./routes/users');
var pagesRoutes = require('./routes/pages');
var authRoutes = require('./routes/auth');

...
// Pass them to our app as middleware
app.use('/', index);
app.use('/users', users);
app.use(pagesRoutes);
app.use(authRoutes);
```

Also add the relevant links to our layouts nav bar for easy access. I have also added a url link to users which will respond in json
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
        <a href="/users">Users</a>
        <br>
        <a href="/login">Login</a>
        <a href="/logout">Logout</a>
        <a href="/signup">Signup</a>
      </nav>
    </header>

    {{{body}}}

    <footer>
      <small>A Howie_Burger tutorial</small>
    </footer>
  </body>
</html>
```

Within our users routes lets make a small change to respond back in json all users by requiring the knex and database file
```javascript
// routes/users.js
var express = require('express');
var router = express.Router();
var knex = require('../config/db.js');

/* GET users listing. */
router.get('/', function(req, res, next) {

  knex("users")
    .then(data => {
      res.send(data);
    }, next)

});

module.exports = router;
```

## Authorizations
Authorisations are quite straight forward when using Express. We will simply setup some middleware functions in our relevant routes files which will determine if a user is authenticated or not, if so it will pass next otherwise it will not.

In our example we will only allow authenticated users to be able to view the users url.

```javascript
// routes/users.js
var express = require('express');
var router = express.Router();
var knex = require('../config/db');

// =========AUTHORIZATION MIDDLEWARE=======
// Beautiful middleware syntax, if you are not authenticated then redirect, otherwise proceed with next
var loginRequired = function(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash('message', 'Must be authenticated');
    return res.redirect("auth/login");
  }
  next()
};

// INSERT IN MIDDLEWARE BETWEEN URL AND REQUEST CALLBACK


/* GET users listing. */
router.get('/', loginRequired, function(req, res, next) {
  knex("users")
    .then(data => {
      res.send(data);
    }, next)
});

module.exports = router;

```

## Authorizations view logic
Finally we want to be able to show the relevant login or signup if a user has not logged in and logout if a user has logged in. To do this we will go back to our app.js file and save as a global req.local object the property user with the value req.isAuthenticated(), which will search the session and return true/false if the user has logged in (tracked by our passport.serialize method).

Then later in our hbs views we can then access this ```user``` boolean property value and render the relevant content/ links accordingly. Please see below in code:

```javascript
// app.js
app.use(function (req, res, next) {
   res.locals = {
     user: req.isAuthenticated()
   };
   next();
});
```

Finally edit our links slightly with the new user boolean:

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
        <a href="/users">Users</a>
        <br>
        {{#if user}}
          <a href="/logout">Logout</a>
        {{else}}
          <a href="/login">Login</a>
          <a href="/signup">Signup</a>
        {{/if}}
      </nav>
    </header>

    {{{body}}}

    <footer>
      <small>A Howie_Burger tutorial</small>
    </footer>
  </body>
</html>
```

## BONUS - OAUTH Github login
### Summary overview
We will now add an alternative login approach using github login.

A lot of the code will be copy and paste and the easiest way to find alternative login strategies (i.e. github, facebook, google etc) is to visit passportjs.org. In our case the github link is [here](https://github.com/cfsghost/passport-github).

Most OAUTH login approaches with Node will be as follows:
* User clicks on github login link and goes to github api website where they can authorize our app to have access
* Github api sends an authenticated callback url to our app and provides custom JSON data on the user (in our case we will access the github username)
* Then beforehand we create two new rows in our database storing the oauth provider and the appropriate identified we want to save. In our case => oauth_provider: 'github' and oauth_id: 'howardmann'
* Back to the callback url: If the username returns matches our oauth_id field then we store that user in the session, otherwise we create a new user in our database and store the oauth_id: 'newgithubaccount'

Note: by using this simple approach we do not save the users email address, name or any passwords. If the user chooses to create a new account with us then we will have duplicate data entries (that is ok for this example app, but going forward we may want to capture the users email and other data as well).

### 1. Install and setup passport configuration
Refer to the latest passportjs.org website strategy for github. As of the time of writing this tutorial the original passport-github repo was deprecated and replaced with passport-github2, therefore always check.

npm install the library: ```npm i --save passport-github2```.

Next we configure the app. This will be mostly copy and paste from the repo. Then visit the [github oauth api site](https://github.com/settings/applications/new) to register your app and get your oauth tokens (look to save these in ENV variables if in production). Remember that the callbackURL you write here must match what you record in your github api token site.

For the second argument we write a custom ORM script which takes the profile returned (will be a JSON object with details of the user) and then query the database to see if that unique username exists in our database (we saved it as oauth_id). If so then we call done and return the user, otherwise we create a new user with those properties.

```javascript
// config/passport.js
var bcrypt = require('bcrypt-nodejs');
var knex = require('./db.js');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// Require passport-github2 and save in variable GitHubStrategy
var GitHubStrategy = require("passport-github2").Strategy

...

// ======OAUTH GITHUB LOGIN STRATEGY REFER passportjs.org=========
passport.use(new GitHubStrategy({
  // Copy and paste from passport-github2 github repo. Then go on github and configure clientID and clientSecret by registering an app https://github.com/settings/applications/new
    clientID: '2e5f40e551b5ed1a1637',
    clientSecret: '656d1285badbd994a0d7c0b0efef03b0c049c7e3',
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    knex("users")
      .where("oauth_provider", "github")
      .where("oauth_id", profile.username)
      .first()
      .then((user) => {
        if (user) {
          return done(null, user)
        }

        var newUser = {
          oauth_provider: "github",
          oauth_id: profile.username,
        };

        return knex("users")
          .insert(newUser)
          .then((ids) => {
            newUser.id = ids[0]
            done(null, newUser)
          })
      })
  }
));
```

### 2. Configure routes
This is again a copy and paste from the repo to call on the passport github method we defined in our passport.js file. The only customisation we can add is the success and failure redirect routes.

```javascript
// routes/auth.js
...

router
  ...
  .get('/logout', function(req, res, next) {
    req.logout();
    req.flash('message', 'Succesfully logged out');
    res.redirect('/');
  })
  .get('/auth/github',passport.authenticate('github', {
      scope: [ 'user:email' ]
  }))
  .get('/auth/github/callback', passport.authenticate('github', {
    failureRedirect: '/login' }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

module.exports = router;
```
### 3. Add link
Finally in our login view page we simply add a new url path to ```/auth/github```

```html
<!-- views/auth/login.hbs -->
<form action="/login" method="post">
  <p>Email:</p>
  <input type="text" name="username" required="true" autofocus="true">

  <p>Password:</p>
  <input type="password" name="password" required="true">

  <p><input type="submit" value="Login"></p>
</form>

<a href="/auth/github">Login with Github</a>

<p>{{message}}</p>
```


## Summary
In this tutorial we learnt the following:
* Setup and integrate a Docker and MySQL database to store our user account details
* Communicate with our SQL database using knex.js
* Create a user signup, login and logout system with passport.js
* Setup authorizations and session view pages including using Redis for session data store
* Setup conditional view logic based on session data
* Setup 3rd party OAUTH login with Github as a strategy example
