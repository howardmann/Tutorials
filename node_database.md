## Part 3: Node database migrations with knex

### Summary
This tutorial will automate our SQL database migrations to be similar to a Rails approach using the knex.js library. We will take the following steps:

1. Configure our knex files and specify our development vs production databases
2. Make our first database migration file and modify with raw SQL (in Rails this would be rails g model User)
3. Write our seed files to populate our database (and configure seeding order)
4. Write a npm script to automate our migration and seed commands (in Rails this would be rake db:migrate and rake db:seed)

Note: this tutorial follows on from Part 2 and assumes you are using SequelPro to set up your initial database and SQL scripts.

### 1. Configure knex
* Firstly install knex globally ```npm i knex -g``` which will allow us to access it via the command line later on.

* Create a new ```knexfile.js``` in our root directory and enter the script below. knex will automatically look in our app's root directory for this file which will sync with the relevant database in development or production.

* Note: the development properties are what we configured using SequelPro and Docker.

```javascript
// knexfile.js
module.exports = {
  development: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      user: "root",
      database: "auth",
    }
  },
  production: {
    client: "mysql",
    connection: {
      host: "production",
      user: "production",
      database: "auth",
    }
  }
}
```

* Modify our db.js file to reference our new knexfile. It will default to our development server if the production environment is not defined.

```javascript
// config/db.js
var config = require("../knexfile")[process.env.NODE_ENV || "development"];
var knex = require("knex")(config);

module.exports = knex;
```

### 2. Make our first database migration

* Enter ```knex``` in the command line to display latest list of commands and options:

```
Commands:

  init [options]                         Create a fresh knexfile.
  migrate:make [options] <name>         Create a named migration file.
  migrate:latest                         Run all migrations that have not yet been run.
  migrate:rollback                       Rollback the last set of migrations performed.
  migrate:currentVersion                View the current version for the migration.
  seed:make [options] <name>            Create a named seed file.
  seed:run                              Run seed files.

Options:

  -h, --help         output usage information
  -V, --version      output the version number
  --debug            Run with debugging.
  --knexfile [path]  Specify the knexfile path.
  --cwd [path]       Specify the working directory.
  --env [name]       environment, default: process.env.NODE_ENV || development
```

* To create our first migration file we will run the command below. This is similar in Rails as ```rails g model User```. Note that here we use plural for the migration table in node
```
knex migrate:make users
```

* This will then create a new migrations folder and timestamped file (this will be familiar for Rails users). The file will be prepopulated with an up and down functions as below. As with rails to modify our tables we should rollback, edit and then migrate:latest

* Next go to our SequelPro interface and copy the raw sequel code from Table Info and paste as follows. Note: that we return knex.raw to write raw SQL code, we write this within back ticks for JS string interpolation but must delete the backticks that come from SequelPro:

```javascript
// migrations/timestamp_users.js
exports.up = function(knex, Promise) {
  // where up will run the SQL code and migration. We will get this initially from SequelPro which writes this out for us
  return knex.raw(`
    CREATE TABLE users (
      id int(11) unsigned NOT NULL AUTO_INCREMENT,
      email varchar(50) DEFAULT NULL,
      password varchar(100) DEFAULT NULL,
      name varchar(50) DEFAULT NULL,
      is_admin tinyint(1) DEFAULT '0',
      oauth_provider varchar(50) DEFAULT NULL,
      oauth_id varchar(50) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;    
  `);
};

exports.down = function(knex, Promise) {
  // Rollback to the last set of migrations performed
  return knex.schema.dropTable("users");
};

```

* Let's create another association table called posts which will belong to a user. Run the command ```knex migrate:make posts``` which will generate a new file, and then copy and paste the SQL code below. Then run the migration ```knex migrate:latest```
```javascript
// migrations/timestamp_posts.js
exports.up = function(knex, Promise) {
  return knex.raw(`
    CREATE TABLE posts (
      id int(11) unsigned NOT NULL AUTO_INCREMENT,
      text longtext,
      user_id int(11) unsigned NOT NULL,
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT posts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
  `);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("posts");
};

```

* Workflow for table migrations are similar to Rails:
  - Firstly make the table migration ```knex migrate:make users```
  - Go in file and write your raw SQL code for the up and return the relevant table to drop for down
  - Then migrate the table ```knex migrate:latest```
  - To then edit the table rollback to the previous migration ```knex migrate:rollback```
  - Then go into the file and make and save your changes before migrating again ```knex migrate:latest```
  - To verify the table changes you can use SequelPro GUI interface



### 3. Creating seed files
* Create a seed file for our users and posts. Seed files in node run alphabetically, this is important as users need to be created first before we can assign a user_id to the post.

* For our workflow we will number our seed files starting with 0 which will have our load order and then 1 for our users and 2 for our posts etc.

* Create our first seed file called 0-cleanup.js which will firstly run and delete/ reset our seed files in the correct order (this is in Rails would be Post.destroy_all, User.destroy_all etc.).

* Run in in terminal ```knex seed:make 0-cleanup``` and then add the delete order code below. We create a cleanup file because users can't be destroyed before posts are, as posts reference a user_id which now will have no association
```javascript
// seeds/0-cleanup.js
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries. Note: we use Promise.join so the code runs in order
  return Promise.join(
    knex('posts').del(),
    knex('users').del()
  );
};
```

* Next we will create our users seed file ```knex seed: 1-users``` and modify the code to below. Note we require bcrypt to hash our seed passwords:
```javascript
// seeds/1-users.js
var bcrypt = require('bcrypt-nodejs');

var pass = bcrypt.hashSync("chicken");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
    return Promise.all([
      // Inserts seed entries
      knex('users').insert({id: 1, email: 'howie@ga.co', password: pass, name: 'Howie Mann', is_admin: 1}),
      knex('users').insert({id: 2, email: 'hela@ga.co', password: pass, name: 'Hela Mann'}),
      knex('users').insert({id: 3, email: 'felix@ga.co', password: pass, name: 'Felix Mann'})
    ]);
};

```

* Then create our posts seed file ```knex seed: 2-posts``` and modify the code to below:
```javascript
// seeds/2-posts.js

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
    return Promise.all([
      // Inserts seed entries
      knex('posts').insert({id: 1, text: 'Some howie post', user_id: 1}),
      knex('posts').insert({id: 2, text: 'Another howie post', user_id: 1}),
      knex('posts').insert({id: 3, text: 'Hela post', user_id: 3})
    ]);
};
```

* Finally run ```knex seed:run``` to add the seed file (similar to Rails rake db:seed). Then check SequelPro that our database has been added


### 4. Automate migration and seed scripts
* After we create our migration file we will mostly be using knex migrate:latest && knex seed:run

* In fact this is so common that we will add this to our package.json file as a script named "boostrap". Then we can run this in terminal as ```npm run bootstrap```

```json

"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "bootstrap": "knex migrate:latest && knex seed:run"
}
```

### BONUS: Pro Tip
If you are using Redis to store your sessions you will need to clear out all sessions if we reset the database.

Run the following command in terminal ```redis-cli``` then ```flushall```.
