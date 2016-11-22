# Bonus: Deploy to Heroku

## Overview
Summary setup configurations for deploying a Node app to Heroku when using MySQL and Redis.

This tutorial will deploy the app we developed in earlier Node sections to Heroku.

## 1. Setup Heroku
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

## 2. Configure MySQL
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


## 3. Configuring Redis
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
