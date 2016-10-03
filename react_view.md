# React view

## Overview
Howie's workflow notes for building a simple React view app for writing and displaying comments.

**Features**  
- Single Page Application for displaying and writing comments
- Ajax request for JSON data to render initial comments
- Comment form for writing new comments. Live preview loading as user types
- Live posting new comments
- Deleting posts

## 1. Installation

See official React site for installation instructions ([React Tutorial](https://facebook.github.io/react/docs/tutorial.html)).

## 2. Setup HTML and CSS

Include an empty div with unique id on your index.html. This is where we will load our React app. Optional: set up placeholder html on the page which you will want React to eventually render. This will help in the long run.

```html
<!-- index.html -->
  <div id="comment-box">
    <!-- Optionally include placeholder for now. Delete this after you paste it into your React Component render functions -->
    <div class="comments-container">
      <h1>CommentBox React.Component</h1>

      <form class="comment-form">
        <h1>CommentForm React.Component</h1>
        <input type="text" placeholder="Comment body">
        <input type="text" placeholder="Author body">
        <input type="submit">
        <h3>Live preview</h3>
        <p>Live load comment goes here</p>
        <p>Live load author goes here</p>
      </form>

      <div class="comment">
        <h1>Comment React.Component</h1>
        <p>Author: Joe</p>
        <p>Body: Lorem ipsum dolor sit amet, consectetur adipisicing elit. Magnam, nemo.</p>
      </div>

      <div class="comment">
        <h1>Comment React.Component</h1>
        <p>Author: Jane</p>
        <p>Body: Lorem ipsum dolor sit amet, consectetur adipisicing elit. Magnam, nemo.</p>
      </div>

    </div>
  </div>   
```

Basic CSS styling to differentiate between components

```css
/* style.css */
.comments-container {
  border: 3px solid black;
  padding: 15px;
}

.comment-form {
  border: 3px solid hotpink;
  padding: 15px;
}

.comment {
  border: 3px solid chartreuse;
  padding: 15px;
}
```

Let's set up some placeholder json data which we can fetch. This will simulate fetching data from an API or our own back-end server. Saved in file.
```javascript
// comments.json
[
  {
    "id": 1,
    "author": "Clu",
    "body": "A machine’s ability to think logically and devoid of emotion is our greatest strength over humans. Cold, unfeeling decision-making is the best kind. Just say no to love!",
    "avatarUrl": "assets/images/avatars/avatar-default.png"
  },
  {
    "id": 2,
    "author": "Anne Droid",
    "body": "I wanna know what love is...",
    "avatarUrl": "assets/images/avatars/avatar-benderson.png"
  },
  {
    "id": 3,
    "author": "Morgan McCircuit",
    "body": "Great picture!",
    "avatarUrl": "assets/images/avatars/avatar-sumo.png"
  }
]
```

## 3. Create React Components

As per our HTML placeholder above we will need to create three React components:
1. **CommentBox** (render single)
2. **Comment** (render multiple)
3. **CommentForm** (render single)

### 1. CommentBox
Our CommentBox React Component will have three primary responsibilities:
- **Instantiating other Components**: rendering the CommentForm and Comment as well as passing in the fetched JSON data to individual Comment Components (this is similar to a Backbone HandleView which loops through its collection and instantiates single views and passes in single elements/models)
- **Fetching JSON data**: via ajax request and storing it in its React state for access and manipulation. (This is similar to a Backbone Collection's responsibility)
- **Custom methods**: passing in custom addComment method to the CommentForm component. We write the addComment method in the CommentBox parent because we need the 'this' lexical scope of the CommentBox parent
in order to add new comments to its state (we will achieve this by pushing new comments into its React state which contains the json data)

```javascript
// component.js

// ES6 class syntax, similar to Ruby initialize. Call super() to inherit from parent class.
class CommentBox extends React.Component {
  // State is a React JavaScript object which exists in each component and lives in memory. Think of this as a Backbone model or collection. We do not modify the DOM in REACT and instead interact with a Components state. React will automatically listen for differences in state and only modify those properties that have changed - this increases performance.
  // Important: we can reference a Components state as variables throughout the render. Any changes to the state will then be updated in all locations where it is referenced
  constructor(){
    super();

    this.state = {
      jsonData: []
    }
  }

  // React lifecycle method means it will fetch comments from the server before the component is rendered. If we don't do this then state will have no data initially to render
  // To change a Components state we need to use the syntax this.setState({property: value}). Setting it directly as this.property = value will not work
  componentWillMount(){
    $.ajax({
      method: "GET",
      url: 'comments.json'
    }).done(response => {
      this.setState({jsonData: response});
    });
  }

  // All React Components will have a render method which includes a return method which takes JSX, renders it into JavaScript and then renders to the DOM in html. JSX is the same as HTML except we need to reference className (as class is a reserved word). Also if we want to write JavaScript in JSX we use curly braces.
  // Add a custom function as prop for CommentForm which will take the input values from the CommentForm component and create a new comment to push into the state of the CommentBox. HM: Remember that strings, variables and functions can be passed around form parents and children
  render(){
    return (
      <div className="comments-container">
        <h1>CommentBox</h1>
        <CommentForm
          addComment={this._addComment.bind(this)}/>
        {this._displayComment()}
      </div>
    )
  }

  // We take reference the JSON data we fetched in the Components state and loop through and instantiate new Comment Components while passing in the values of each JSON element into the Comment Component as React Properties (Props). This is similar to Backbone HandleView which looped through its collection and passed on individual models to SingleViews, here we need to be explicit about what properties we want the child to be access (i.e. author, body). React also requires unique key properties to be included in Child Comments for performance reasons
  _displayComment(){
    return this.state.jsonData.map(function(el){
      return <Comment
              id = {el.id}
              author= {el.author}
              body= {el.body}
              removeComment = {this._removeComment.bind(this)}
              key= {el.id}/>
    });
  }

  // Define custom function to pass in to the CommentForm as Props. Add another comment into the state jsonData array
  _addComment(body, author){
    let comment = {
      id: this.state.jsonData.length + 1,
      author: author,
      body: body
    };

    // React prefers concat method over push for passing in objects into arrays for performance reasons. Push does noto work because it returns the length of the array
    this.setState({
      jsonData: this.state.jsonData.concat([comment])
    });

    // Alternative approach using push.
    // this.state.jsonData.push(comment);
    // this.setState({
    //   jsonData: this.state.jsonData
    // });

  }

  // Define custom delete comment function. Filter the state jsonData array to return all values other than that selected. Then set this new array as the state. This approach is more performant for React. Then pass this custom method as props to each comment (see above _displayComment) and bind to the lexical scope
  _removeComment(commentId) {
    let commentFilter = this.state.jsonData.filter(el=> el.id !== commentId);
    this.setState({
      jsonData: commentFilter
    });
  }

}
```

At the end of our component.js components we will instantiate the script within a jQuery document ready and render the CommentBox into the div comment-box in our index.html.
```javascript
// Instantiate a new CommentBox class within the document ready and select the commet-box id to render inside
$(document).ready(function(){
  ReactDOM.render(<CommentBox/>, document.getElementById('comment-box'));
})
```


### 2. Comment
Our Comment React Component will have one primary responsibility, taking the property data passed in from the CommentBox parent and rendering and returning the properties into JSX which the CommentBox will then be able to access. Quite straight forward here, the responsibility is smaller because we will be instantiating many individual Comment components

```javascript
// components.js

class Comment extends React.Component {
  render(){
    return (
      <div className="comment">
        <h1>Comment</h1>
        <p>Author: {this.props.author}</p>
        <p>Body: {this.props.body}</p>
        <button onClick={this._handleDelete.bind(this)}>Delete comment</button>
      </div>
    )
  }

  // Custom handler to call on the removeComment function passed in as props from CommentBox parent
  _handleDelete(){
    this.props.removeComment(this.props.id);
  }  
}
```

### 3. CommentForm
Our CommentForm Component will be responsible for rendering the form to add new comments, listening for changes in the input form and live rendering the text as well as capturing the value in the input form to call the addComment method it was passed in as a property by its CommentBox parent.

```javascript
// components.js

class CommentForm extends React.Component {
  constructor(){
    super();
    this.state = {
      comment: "Comment body",
      author: "Author"
    };
  }

  // ref stores the value of the input text into a custom variable for access throughout the component. Use ES6 arrow syntax to bind this scope
  // We can listen to events on the input with the onChange method which will call the custom method _.liveLoad when an event is triggered
  render(){
    return (
      <form className="comment-form"
        onSubmit={this._handleSubmit.bind(this)}>

        <h1>CommentForm</h1>

        <input type="text" placeholder="Comment body"
          ref = {input => this._bananaComment = input}
          onChange={this._liveLoad.bind(this)}/>

        <input type="text" placeholder="Author name"
          ref = {input => this._bananaAuthor = input}
          onChange={this._liveLoad.bind(this)}
        />

        <input type="submit"/>
        <h3>Live preview</h3>
        <p>{this.state.comment}</p>
        <p><em>{this.state.author}</em></p>
      </form>

    )
  }

  // Custom event handler which resets the state of the component to the value stored in ref whenever an onChange event is triggered
  _liveLoad(){
    console.log("live load");
    this.setState({
      comment: this._bananaComment.value,
      author: this._bananaAuthor.value
    })
  }

  // When submit event is clicked, firstly prevent default action of page being reloaded Then pass in the value of the form stored in the ref and call on the addComment function it received from its parent. We do this, because the value is captured in the CommentForm Component but the state and rendering of individual exists in the CommentBox Component
  // We also write some validations to prevent blank comments being submitted
  _handleSubmit(event){
    event.preventDefault();
    // Received the addComment function from the parent
    if (this._bananaComment.value.length > 0) {
      this.props.addComment(this._bananaComment.value, this._bananaAuthor.value);
      this._bananaComment.value = "";
      this._bananaAuthor.value = "";
      this._liveLoad();
    } else {
      alert("Please include some text");
    }
  }
}
```
