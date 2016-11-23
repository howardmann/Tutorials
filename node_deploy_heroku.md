# Bonus: Deploy to Heroku

## Overview
Summary setup configurations for deploying a Node app to Heroku when using SQL and Redis
* **Option 1:** deploying with MySQL database using ClearDB
* **Option 2:** deploying with a Postgresql database

This tutorial will deploy the app we developed in earlier Node sections to Heroku.

## Option 1: deploying with MySQL and ClearDB

### 1. Setup Heroku
* Create a new or cd into existing app directory. From within your root node app folder create your heroku app. Run command in terminal:
```
heroku create howie-node
```

* Create a new file named ```Procfile``` with no extension in your root directory and write the following command to start our node app (note that we called our server file server.js):
```
web: node server.js
```

* In the package.json file add an engine property specifying the current version of node we are using:
```javascript
// package.json
{
  "name": "6-express-hbs",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "node server",
    "dev": "nodemon server",
    "bootstrap": "knex migrate:latest && knex seed:run"
  },
  "engines": {
    "node": "6.7.0"
  },
  "dependencies": {
    ...
  }
}
```

* Push to heroku and open the app (terminal command below). Note: the database and Redis will still not work and we will configure this next
```
git push heroku master
heroku open
```

### 2. Configure MySQL
Heroku by default prefers to work with Postgresl databases and not MySQL. However there is a workaround if we choose to use MySQL.

We will need to install a Heroku addon provided by ClearDB which will host our MySQL database.

The steps involved are as follows:

1. Install the addon in Heroku cli and save details of the host, username, password and database name

```
heroku addons:create cleardb:ignite

heroku config | grep CLEARDB_DATABASE_URL
-----> CLEARDB_DATABASE_URL: mysql://bc6fa5bdca11f5:e6d9f10f@us-cdbr-iron-east-04.cleardb.net/heroku_6ed701c24f9e605?reconnect=true

host: us-cdbr-iron-east-04.cleardb.net
username: bc6fa5bdca11f5
password: e6d9f10f
database: heroku_6ed701c24f9e605
```

2. Go into our app and in our knex file change our production mysql database details to the details in the CLEARDB_DATABASE_URL above

```javascript
// knexfile.js
// Used for database automation
module.exports = {
  development: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      user: "root",
      database: "auth"
    }
  },
  production: {
    client: "mysql",
    connection: {
      host: "us-cdbr-iron-east-04.cleardb.net",
      user: "bc6fa5bdca11f5",
      password: "e6d9f10f",
      database: "heroku_6ed701c24f9e605"
    }
  }
}
```

3. Commit and push changes to heroku. Then run our bootstrap strip to migrate and seed the database
```
git add.
git commit -m "added cleardb"
git push heroku master

heroku run npm run bootstrap
```

* Note: To check that the database connection worked with cleardb we can pass in the CLEARDB_DATABASE_URL details into our SequelPro GUI desktop to check our database


### 3. Configuring Redis
* First install an npm package that makes configuring redis with heroku easier: [github link is here](https://github.com/cmanzana/heroku-redis-client)

```
npm i --save heroku-redis-client
```

* Within our app.js file require it after our RedisStore and then pass into the new Redistore an object:

```javascript
// app.js
...
var RedisStore = require('connect-redis')(session);
var redis = require('heroku-redis-client');
...

app.use(session({
  store: new RedisStore({client: redis.createClient()}),
  secret: "i love dogs",
  resave: false, saveUnitialized: false
}));

```

* In our terminal we will install the heroku Redis To Go addon. Our npm plugin will search for the heroku ENV for the url we create and start Redis on our production server. Now our sessions should work and persist after server reloads.
```
heroku addons:create redistogo

heroku config --app howie-node | grep REDISTOGO_URL

```

* Note: the npm heroku-redis-client package is essentially the code provided by heroku in its tutorial for accessing the REDISTOGO_URL. If the above does not work then revert to the official Heroku guide. The link can be found [here](https://devcenter.heroku.com/articles/redistogo)


## Option 2: deploying with Postgresql

Heroku prefers working with a Postgresql database. If deploying on Herok it will be better to follow this approach at the beginning:

### 1. Create a postgresql database
Install the latest version of postgresql from the official website. Make sure the elephant is running in your window.

In terminal open psql and create a new database:
```
$ psql
psql (9.4.5)
Type "help" for help.

# CREATE DATABASE myfirstpostgres;
CREATE DATABASE
# \q
```

To check if the database was created go into terminal and run ```psql``` and ```\l``` to see full list of apps and the username:
```
psql (9.5.4)
Type "help" for help.

howardmann=# \l
                                               List of databases
               Name                |   Owner    | Encoding |   Collate   |    Ctype    |   Access privileges
-----------------------------------+------------+----------+-------------+-------------+-----------------------
 myfirstpostgres                   | howardmann | UTF8     | en_US.UTF-8 | en_US.UTF-8 |

howardmann=#
```

### 2. Configure the knexfile for a postgres database
Install postgresql npm package ```npm i --save pg```.

In the knex file change the database connection details and client to pg. For development the host will be localhost (127.0.0.1), user will be the owner of the database (per above), password if any, and database the name of the database created. For heroku deployment we will create a production with the connection referencing the DATABASE_URL that Heroku will give us (see next step).
```javascript
// knexfile.js
module.exports = {
  development: {
    client: "pg",
    connection: {
      host: "127.0.0.1",
      user: "howardmann",
      password: '',
      database: "myfirstpostgres"
    }
  }
  ,
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL
  }
}

```

### 3. Create our migration files
For database migrations we will rely on the knex library to create our database schema. Generate the migration if not already done so: ```knex migrate:make users```. Then inside the file write the following code to create the table, refer to official knex docs for syntax to create schema

```javascript
// migrations/timestamp_users.js
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function(table){
    table.increments();
    table.string('email');
    table.string('password');
    table.string('name');
    table.string('oauth_provider');
    table.string('oauth_id');
    table.boolean('is_admin').defaultTo(false);
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("users");
};
```

Seed files remain unchanged from our MySQL example:
```javascript
// seeds/1-users.js
var bcrypt = require('bcrypt-nodejs');

var pass = bcrypt.hashSync("chicken");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
    return Promise.all([
      // Inserts seed entries
      knex('users').insert({email: 'howie@ga.co', password: pass, name: 'Howie Mann', is_admin: true}),
      knex('users').insert({email: 'hela@ga.co', password: pass, name: 'Hela Mann'}),
      knex('users').insert({email: 'felix@ga.co', password: pass, name: 'Felix Mann'})
    ]);
};
```

### 4.Configure Heroku
Finally to configure Heroku with postgresql we install the Heroku pg addon. Visit the Heroku website for any changes to this addon [here](https://devcenter.heroku.com/articles/getting-started-with-nodejs#provision-a-database):
```
// Create our postgresql database
heroku addons:create heroku-postgresql:hobby-dev

// Find the process.env.DATABASE_URL that we connect to in our knexfile. This will automotically connect
heroku config -s | grep HEROKU_POSTGRESQL
-> HEROKU_POSTGRESQL_CRIMSON_URL='postgres://hscegdxgjpiuch:Ih1wkjpUJn9x82qsn6WoARAe5r@ec2-23-23-226-24.compute-1.amazonaws.com:5432/df0cgvia0o6h8n'
```

Then push all changes to heroku and run our migration and seed script to populate the databse
```
git push heroku master
heroku run npm run bootstrap
heroku open
```

### Notes:
When using passport.js knex communicates slightly differently with a postgresql database after inserting a new row. We need to change the syntax as per below:
```javascript
//config.passport.js
....
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

        // We use this strange syntax because of issues with knex and postgres. We must specify what we want returned after we insert a new object into the users database. Here we want back the id which is returned as an array. We then assign our newUser variable to the newly created id and assign it to our passport.done session (PAINFUL i know)
        knex.insert(newUser)
          .returning('id')
          .into('users')
          .then(ids => {
            newUser.id = ids[0];
            return done(null, newUser, req.flash('message', 'Succesfully created'));
          }, done)
      }, done)
  }
));
```
