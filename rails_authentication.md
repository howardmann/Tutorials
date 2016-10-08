# Rails authentication from scratch
Howie's notes on using rails authentication with bcrypt.

## Overview and Features
- New user signup
- Password store and authentication with bcrypt
- User login and logout
- Using sessions to keep track of user logged in
- Authorizations based on user logged in

**bcrypt principle**
User passwords should never be saved in our database as they will become vulnerable to hacking and compromise. Ruby bcrypt is a Ruby gem which encrypts and compares user passwords against a unique hashes stored in the database.

bcrypt generates a unique password hash when a user creates a new password based on a unique hashing algorithim for that particular user. Only the password hash is saved in the database, never the actual password.

Then each time the user enters their correct actual password, bcrypt uses the same algorithim to create the password hash and verifies it against the one stored in the database. (There is a lot of magic that goes on behind the scenes to generate this algorithim based on hashing algorithims, rails app codes, computer clocks etc.)

**Objectives**
1. Require gem files
2. Create full CRUD User model, view and controller
3. Create session controller and views (no models)
4. Set authorisations

## 1. REQUIRE
In rails Gemfile. Uncomment bcrypt gem in gemfile and run bundle install in terminal.

```ruby
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'
```

## 2. USERS

### Create User model
In terminal create user model and manually add columns for email, name and password_digest (this field is required for bcrypt gem and stores the hashed password). Optional add admin boolean field.

In the User model file assign the bcrypt ```has_secure_password``` field to enable encryption. Also assign any has_many or belongs_to relationships in your app related to User (both ways).

```ruby
# In terminal
rails g model User
# In db/migrate folder
class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :email
      t.string :name
      t.text :password_digest

      t.timestamps null: false
    end
  end
end
# Set up model associations in app/models/user.rb
class User < ActiveRecord::Base
  has_secure_password
  has_many :model_name  
end
# In terminal run migration
rake db:migrate
```

### Create User routes
In config/routes.rb file add full routes for User model

```ruby
resources :users
```

### Seed test files
In seed file, seed some test users and write simple tests. Remember to seed :password and :password_confirmation key value pairs. bcrypt will save this in a unique password_digest key value pair.

**IMPORTANT**: we do not add the :password and :password_confirmation fields in our User model as we rely on bcrypt to save the encrypted hash :password_digest in our model (see explanation above).

```ruby
User.destroy_all # Reset the seed file

u1 = User.create :name => "howie", :email => "howie@ga.co", :password => "chicken", :password_confirmation => "chicken"
```

### Create User controller
Create full CRUD controller for User model. Remember to params.require the email, name, password and password_confirmation. (Note: This should be straight forward, hard part will be linking this to sessions in next section).

```ruby
# In terminal generate controller
rails g controller Users index show new edit

# Create full User CRUD controller
class UsersController < ApplicationController
  def index
   @user = User.all
  end

  def show
   @user = User.find(params[:id])
  end

  def new
   @user = User.new
  end

  def create
   @user = User.create(user_params)
   redirect_to users_path
  end

  def edit
   @user = User.find(params[:id])
  end

  def update
   user = User.find(params[:id])
   user.update( user_params )
   redirect_to user_path(user)
  end

  def destroy
   user = User.find(params[:id])
   user.destroy
   redirect_to users_path
  end

  private
   def user_params
     params.require(:user).permit(:email, :name, :password, :password_confirmation)
   end
end
```

### Create User Views
In user views folder set up full view CRUD for user. Only difference is for form field to have f.password_field vs. text_field to hide the passwords being entered. (Example user form_partial below).

```html
<%= form_for(@user) do |f| %>
  <fieldset>
    <p>
      <%= f.label :name %><br>
      <%= f.text_field :name %>
    </p>
    <p>
      <%= f.label :email %><br>
      <%= f.email_field :email %>
    </p>
    <p>
      <%= f.label :password %><br>
      <%= f.password_field :password %>
    </p>
    <p>
      <%= f.label :password_confirmation %><br>
      <%= f.password_field :password_confirmation %>
    </p>
    <p>
      <%= f.submit%>
    </p>
  </fieldset>
<% end %>
```
## 3. SESSIONS

### Create session controller
Create session controller in terminal. This is a bit weird, it is a controller but we do not pluralise we use singular. We only create a controller and view, no models. We add the new at the end to generate a new view for us for the login page

```ruby
rails g controller Session new
```

### Create session routes
In routes write the session login routes referencing
- get request to login url which will call on the session controller new method
- post request to same url which will call on the session controller create method
- delete request to different url which will call on the destroy method (more on this later, quite tricky)

```ruby
# In config/routes.rb file
get '/login' => 'session#new', :as => 'login'
post '/login' => 'session#create'
delete '/logout' => 'session#destroy', :as => 'logout'
```
### Create session view login
In view session new file create a login form. This is not worth memorising but good to understand. Difference is we are using a form_tag helper vs. standard form_for helper as we are not trying to edit or create anything in the model, we are only using to submit the params values to the create method to authenticate with brypt. Remember difference is use form_tag and '/login' url defined in route above, not any instance object.

```html
<%= form_tag login_path do %>
  <%= label_tag :email %>
  <%= email_field_tag :email, 'please enter', required: true %>
  <%= label_tag :password %>
  <%= password_field_tag :password %>
  <%= submit_tag 'Login' %>
<% end %>
```

### Define session controller actions
In the session controller start by defining three methods:
- **new**: for displaying the login page. We do not write anything in this method, it only serves the purpose of redirecting to the login view page from our route request
- **create**: for logging in and authenticating user params. Logic takes the following steps:
  1. Find the user in the database from the email params submitted from the form
  2. Check if the user exists and also using bcrypt to authenticate the password to check if it matches with the password_digest hash saved in the database
  3. If not successful then flash error message and re-render page
  4. If successful then set the session[:user_id] as the user.id found in the database. This is for authentication purposes
  5. Redirect to relevant page and flash success
  6. Optional add intended_url as session
- **destroy**: for logging out of our session. Set the session[:user_id] to nil and redirect back to relevant url.

```ruby
class SessionController < ApplicationController
  def new
  end

  def create
    user = User.find_by(:email => params[:email])
    if user.present? && user.authenticate(params[:password])
      session[:user_id] = user.id
      flash[:success] = "Successful login, welcome back"
      # Redirects to the intended url or the root path
      redirect_to(session[:intended_url] || user_path(user))
      session[:intended_url] = nil
    else
      flash.now[:error] = "Email or password incorrect"
      render :new
    end
  end

  def destroy
    session[:user_id] = nil
    flash[:success] = "Logged out"
    redirect_to root_path
  end
end
```
## 4. SET AUTHORIZATIONS

### Find current_user
In applicaiton controller write a method to find the current_user logged in before calling on any other controller actions. Find the current_user based on the session[:user_id] that was stored when a successful new session was created.

```ruby
class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :fetch_user

  private
    def fetch_user
      @current_user = User.find_by(:id => session[:user_id]) if session[:user_id]

      session[:user_id] = nil unless @current_user.present?
    end
end

```

### Set authorizations
Back in the users controller and every other view page you need we want to write in the authorisations which will only allow users to view certain pages if they have been authenticated in the session login stage.

```ruby
class UsersController < ApplicationController
  before_action :require_login, :only => [:index, :edit]

  # Code from above

  private
    def require_login
      unless @current_user.present?
        # For redirecting to intended url. Save the request.url in a session
        session[:intended_url] = request.url
        flash[:error] = "You must be logged in to access this page"
        redirect_to login_path
      end
    end
end
```

## Author
Howie_Burger
