# Backbone.js

## Introduction
Summary overview of Backbone.js and tutorial to build a comment box using Backbone.js

## Backbone Overview
Backbone.js is a front-end JavaScript framework developed by Jeremy Ashkenas who also developed Underscore.js (a library of useful JavaScript tools) and CoffeeScript.

Backbone encourages separation of concerns and creates order for your front-end application. Logic is separated into ```Models``` and ```Collections```, views are separated as ```Views``` and navigation is represented by the ```Router```. The responsibility of each of these Backbone objects is summarised below, with a comparison to a Rails application:

- **Model**: contains the logic and data of a single item (in Rails this would be item = Item.find(id)). The model is responsible for storing and manipulating the state and properties of an item  
- **Collection**: represents an array of individual Models (in Rails this would be items = Item.all). The collection is responsible for fetching data from the server aggregating the models and has access to helper methods which allow us to filter, sort and manipulate the models  
- **View**: displays html and the properties of the Model it is passed (in Rails this would be our html.erb layer show.html.erb). The view in fact has the most responsibility, it is in charge of rendering html and listening for DOM events and alerting its associated Model of changes
- **CollectionView**: is a view layer responsible for receiving a collection of models and delegetaing responsibility to individual views to render each model (there is no direct comparison to this in Rails). The collectionView instantiates new views and appends them to the DOM, in addition it listens for changes in the size of models in the collection and updates the view accordingly.
- **Router**: responsible for listening for urls and delegating to the relevant Backbone View object (in Rails this would be our routes.rb and controller).

## Tutorial
In our simple tutorial we will apply these concepts and build a simple Comment Box app where a user can add, remove and edit a comment. We will use Backbone.localstorage for persistence of state instead of a back-end server.

### 1. Setup
Backbone's dependencies are Underscore.js and most commonly jQuery (not necessary). Download the latest library versions or link to a CDN. We are also using Backbone.localstorage which is loaded at the end after jQuery, Underscore and Backbone. We will also go ahead and create the relevant directories and files for our application ahead of time, your application tree should be as follows:

```javascript
.
├── index.html
├── js
│   ├── collections
│   │   └── Comments.js
│   ├── main.js
│   ├── models
│   │   └── Comment.js
│   ├── vendor
│   │   ├── backbone.js
│   │   ├── jquery.js
│   │   └── underscore.js
│   └── views
│       ├── CommentView.js
│       ├── CommentsFormView.js
│       └── CommentsView.js
└── styles
    └── styles.css
```

In our index.html file load the files in the following order:

```html
<!DOCTYPE html>
<head>
  <title>Backbone comments</title>
  <link rel="stylesheet" href="styles/styles.css">
  <script src="js/vendor/jquery.js"></script>
  <script src="js/vendor/underscore.js"></script>
  <script src="js/vendor/backbone.js"></script>
  <script src="http://cdnjs.cloudflare.com/ajax/libs/backbone-localstorage.js/1.0/backbone.localStorage-min.js" type="text/javascript"></script>
  <script src="js/models/Comment.js"></script>
  <script src="js/collections/Comments.js"></script>
  <script src="js/views/CommentView.js"></script>
  <script src="js/views/CommentsView.js"></script>
  <script src="js/views/CommentsFormView.js"></script>
  <script src="js/main.js"></script>
</head>
<body>
  <h1>Backbone: Comments</h1>

  <div id="app"></div>
</body>
</html>

```

### 2. Model
Let' start first with our Model. We want our application to represent a single Comment which will have a description, date added and number of likes. We will set default values in the event a model property is not given so as to avoid any undefined errors. In addition we will keep any logic which changes our model's property values within the model. In this example we have created two functions called updateComment and likeOne which when called will update the description and increase the like quantity by 1 respectively.

```javascript
// js/models/Comment.js

// Throughout this application we will be encapsulating our objects in the app object, this helps us organise our code
var app = app || {};

// Date formatter, using JavaScript Date function (not nearly as easy to use as Rails strftime)
var formatDate = function(date){
  return date.toLocaleDateString('en-AU',{hour: 'numeric', minute: 'numeric'});
};

// We extend the Backbone.Model object and pass in relevant properties
app.Comment = Backbone.Model.extend({
  // Sets up default property values of our model
  defaults: {
    description: 'description',
    date: formatDate(new Date()),
    likes: 0
  },

  // Function takes two arguments comment: a string and time: a 24hr string HH:MM and updates the properties of the model accordingly. Note: I've used regex for now to set the time, feel free to refactor but not relevant for understanding Backbone
  updateComment: function(comment, time){
    var time = time.match(/\d{2}/g);
    var date = new Date();
    date.setHours(time[0],time[1]);
    this.set({'description': comment, 'date': formatDate(date)});
  },

  // We use get and set to access and change the attributes of a Backbone.Model as the attributes are represented one level deep. Note: you may often come into this issue when trying to access the models properties directly without using get or set i.e. comment.description vs. comment.get('description')
  likeOne: function(){
    this.set({'likes': this.get('likes') + 1});
  }
});

```

### 3. Collection
Next we build our collection. This is quite straight forward, at a minimum we extend the Backbone.Collection and simply reference the model we created above as this collection's model. In addition here we will be using the Backbone.LocalStorage adapter to ensure persistence and state without needing a backend framework.

```javascript
//  js/collections/Comments.js

var app = app || {};

// Extend the Backbone.Collection object and encapsulate it in our app object
app.Comments = Backbone.Collection.extend({
  // Reference the model that this collection will be holding an arra of
  model: app.Comment,

  // We rely on the Backbone.Localstorage adapter for data persistence. This uses HTML5 localstorage to store small amounts of data in the browser (up to ~5MB)
  localStorage: new Store("backbone-todo"),

  // Comparator function used later in our CollectionView to sort our collection alphabetically (similar to collection.sort(function(item){ return item.get('description').toUpperCase}))
  comparator: function(item){
    return item.get('description').toUpperCase();
  }
});

```

### 4. View
Next we build our View (most of the work is involved here). Here we will build a single CommentView whose responsibility is to receive an individual CommentModel, render html and the model's properties and listen for DOM events and call on the model's methods accordingly. Here our CommentView uses the Underscore.js template to render the Comment's description, date, likes and buttons. Next attach a number of event listeners which listen for clicks on buttons for removing, editing, updating and liking the comment. Remember any logic which changes the properties of the model is delegated to the model (i.e. this.model.likeOne or this.model.updateComment), at the end we also call ```this.model.save()``` to sync with LocalStorage (ordinarily this would sync with our database).

In order to enable two-way data binding we also have our view listen for changes in the model itself and then render accordingly. This is worth repeating (very important in all front-end frameworks), two-way data binding in steps:
1. View listens for DOM event changes (click, dblclick etc) and delegates to a function (```'click .like': 'likeOne'```)
2. View function then captures any data received in the DOM and passes this to the model's function to update accordingly (```likeOne: function(){this.model.likeOne()}  ```)
3. Model receives this and then updates the property value (``` this.set({'likes': this.get('likes') + 1})```)
4. Back at the View we begin with adding an event listener in its initialize function which listens for any changes in the model and then to re-render (```this.model.on('change', this.render, this)```)

```javascript
var app = app || {};

// Extend Backbone.View object
app.CommentView = Backbone.View.extend({
  // Set the class name of the View div that is rendered. The View div is represented as 'this.el'
  className: 'comment-view',

  // Two way data binding, updates based on changes in model properties
  initialize: function(){
    this.model.on('change', this.render, this);
  },

  // Event listeners listening for click handles in the DOM and calling the relevant function
  events: {
    'click .remove': 'removeComment',
    'click .show-edit': 'showEditComment',
    'click .submit-comment': 'updateComment',
    'click .like': 'likeOne'
  },

  // Delete comment entirely
  removeComment: function(){
    this.remove();
    this.model.destroy();
  },

  // For UI purposes only. Using jQuery to show edit fields and set default time value
  showEditComment: function(){
    var time = new Date(this.model.get('date')).toLocaleTimeString('en-AU', {hour12:false, hour: 'numeric', minute: 'numeric'});

    this.$('form').toggle();
    this.$('input[type="time"]').val(time);
  },

  // Update properties of Comment by capturing value entered into DOM and sending to associated Model to deal with
  updateComment: function(e){
    e.preventDefault();
    var text = this.$('.edit-description').val();
    var time = this.$('.edit-time').val();
    if (time.length < 1 || text.length < 1) {return;};
    this.model.updateComment(text, time);
    this.model.save();
  },

  // Increment the like quantity by 1 in the model
  likeOne: function(){
    this.model.likeOne();
    this.model.save();
    this.$('.like').hide();
  },

  // Using underscore.js template to render html and properties of the model it is passed in using erb like tags <%= property %>. Note: to write out the html multi-line we would need to write this in a script tag in the html and reference it, ideally you would do this in a real world application
  template: _.template('<h2>CommentView</h2><p><%=description%> | Likes: <%=likes%> | Date: <%=date%></p><button class="remove">Remove</button><button class="show-edit">Edit</button><button class="like">Like</button><form class="show-edit-form" style="display:none;"><input type="text" class="edit-description" placeholder="description"></input><input type="time" placeholder="wat" class="edit-time"></input><input type="submit" class="submit-comment"></input></form>'),

  // All views have a render function which renders the html template above and passes in the model's attributes. End with return this to enable chaining
  render: function(){
    this.$el.html(this.template(this.model.attributes));
    return this;
  }
});

```

### 5. CollectionView
CollectionViews are responsible for rendering the container which holds all the individual views and more importantly is responsible for the instantiating of single views from a collection of models it is passed.  

**A Collection View doesn't render any of it's own HTML. It delegates that responsibility to the model views.**

```javascript
// js/views/CommentsView.js

var app = app || {};

// Extend another View. CollectionView has the same properties and syntax as a regular single view
app.CommentsView = Backbone.View.extend({
  className: 'comments-view',

  // Listen for changes in the collection size and render accordingly
  initialize: function(){
    this.collection.on('add', this.addOne, this);
    this.collection.on('remove', this.updateView, this);
  },

  // Event listener to sort the comments alphabetically
  events: {
    'click .sort': 'updateView'
  },

  // Re-renders the container
  updateView: function(){
    this.$el.html('');
    this.render();
  },

  // Most important: Responsible for instantiating new single views and appending them to this container. This way we then only append a single CommentsView div who is then in charge of appending all other views
  addOne: function(comment){
    var commentView = new app.CommentView({model: comment});

    this.$('.comments-view-content').append(commentView.render().el);
  },

  template: _.template('<h2>CommentsView</h2><button class="sort">SORT</button><div class="comments-view-content"></div>'),

  // Iterates through the collection it received and calls on the addOne function to create new single views from each of the models in the collection it iterates through
  render: function(){
    this.$el.prepend(this.template);
    this.collection.sort().each(this.addOne,this);
    return this;
  }
});

```

### 6. CollectionView - Form
We create another CollectionView but this one will be our input form which is in charge of capturing data entry from the DOM and adding a new model to the collection. It is a CollectionView because it receives a collection for the purpose of being able to ```add``` new models to it.

```javascript
// js/views/CommentsFormView.js

var app = app || {};

app.CommentsFormView = Backbone.View.extend({
  className: 'comments-form-view',

  // One event listener for form submit
  events: {
    'click .add-comment': 'addComment'
  },

  // Captures the input entry from the DOM and then instantiates a new Comment Model based on that value. Then adds this model to the collection. Our CommentsView had an initialize event listener which listened to changes in the collection size and then would render accordingly - this ensures 2-way data binding so our form does not need to concern itself with rendering the Comment
  addComment: function(e){
    e.preventDefault();
    var $text = this.$('input[type="text"]');
    if ($text.val().length < 1) {return;};

    var comment = new app.Comment({'description':$text.val()});
    this.collection.add(comment);
    comment.save();
    $text.val('');
  },

  // Template contains the HTML input form
  template: _.template('<h2>CommentsFormView</h2><form><input type="text" placeholder="type comment"></input><input type="submit" class="add-comment"></input></form>'),

  render: function(){
    this.$el.html(this.template);
    return this;
  }
});

```

### 7. Wrap Up!
Finally, to start our application, within document read we create a new collection and fetch it from localstorage whenever a new page loads. We then instantiate the collection views passing in the collection and append them to the DOM. Thereafter each of the CollectionViews and Views will proceed with each of their responsibilities and render to the DOM.

```javascript
// js/main.js

var app = app || {};

$(document).ready(function() {
  app.comments = new app.Comments();
  app.comments.fetch();

  app.commentsFormView = new app.CommentsFormView({
    collection: app.comments
  });

  app.commentsView = new app.CommentsView({
    collection: app.comments
  });

  $('#app').append(app.commentsFormView.render().el);
  $('#app').append(app.commentsView.render().el);
});

```


*Stylsheets below for reference.*

```css
* {
  text-align: center;
  margin: 5px;
}

.comment-view {
  border: 1px solid hotpink;
}

.comments-view {
  border: 1px solid chartreuse;
}

.comments-form-view {
  border: 1px solid rebeccapurple;
}
```

## Author
Howie_Burger
