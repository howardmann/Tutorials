# Rails API 
Building simple rails API only using rails v5+ and active model serializer.

Example will be a movie database API with entries for movies and directors.

## rvm
Check you have rails 5+ installed
```shell
$ rails -v
Rails 5.1.1
```
Use rvm to switch between ruby and rails versions
```shell
# switch to rails 4.2.6 with ruby 2.3.1
$ rvm 2.3.1@rails426
# switch to rails 5.1.1 with ruby 2.3.1
$ rvm 2.3.1@rails511
```
Refer to [rvm documentation](https://rvm.io/gemsets/basics) for setting up rails versioning via gems

## Setup

### Create app
Create new rails api using the --api path. This will create api specific rails middleware, e.g. no views etc.
Remember to use postgresql as the default database vs sqlite3
```shell
$ rails new movie_api --api -d postgresql
```

### Enable CORS
Enable Cross Origin Resource Sharing (CORS) to enable other apps to send requests to the rails API. Uncomment the rack-cors gem in the gemfile
```ruby
# Gemfile
gem 'rack-cors'
```
Update bundle
```shell
$ bundle
```
In `config/initializers/cors.rb` uncomment out the snippet to allow cors for all requests. Make one change, replace `origins 'examples.com'` with `origins '*'` to enable CORS from any server application
```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end

```

### Serialization
Use active_model_serializers gem which will serialize our controller json responses. This gem is handy as it will allow us to specify which properties and associations we want returned as json. We can also customize the adapter to automatically serialize the json into a predefine format. For our purposes we will be using the JsonAPI adapter to make it consistent with default Ember apps which will be consuming this api.

Add following to Gemfile:
```ruby
# Gemfile
gem 'active_model_serializers', '~> 0.10.0'
```
Update bundle
```shell
$ bundle
```
After that create config/initializers/active_model_serializers.rb file and write following code below. This will specify the jsonApi adapter and also tell the adapter not to convert our underscore properties to hyphens.
```ruby
# config/initializers/active_model_serializers.rb
# Use jsonAPI format adapter
ActiveModel::Serializer.config.adapter = :json_api
# Do not change rails underscore convention for multiple property names e.g. box_office not box-office
ActiveModel::Serializer.config.key_transform = :unaltered
```

## Database 
Create our movie model
```shell
$ rails g model Movie title:string year:integer box_office:integer
```
Create our director model which will belong to our movie model
```shell
$ rails g model Director name:string age:integer movie_id:integer
```
Update model associations. Note we use optional:true to avoid validation errors. This is a Rails 5 feature which requires belongs_to associations by default before we create entries. As we will want to create an entry before making the association in our seeds file, we can be more relaxed with this.

[See link for further explanation on this Rails 5 feature](http://blog.bigbinary.com/2016/02/15/rails-5-makes-belong-to-association-required-by-default.html)
```ruby
# models/movie.rb
class Movie < ApplicationRecord
  belongs_to :director, optional:true
end

# models/director.rb
class Director < ApplicationRecord
  has_many :movies
end
```
Create pg database and then run migration
```shell
$ rails db:create
$ rails db:migrate
```
Create our seeds file and tests
```ruby
# db/seeds.rb
# MOVIE ..........................................
Movie.destroy_all
jaws = Movie.create(
  :title => 'Jaws',
  :year => 1970,
  :box_office => 100000000
)
alien = Movie.create(
  :title => 'Alien',
  :year => 1975,
  :box_office => 70000000
)
gladiator = Movie.create(
  :title => 'Gladiator',
  :year => 2000,
  :box_office => 1000000
)
jurassic = Movie.create(
  :title => 'Jurassic Park',
  :year => 1995,
  :box_office => 200000000
)

# Movie tests
p "MOVIES........"
p "Movie count: #{Movie.all.length}"
p "Movie titles: #{Movie.all.pluck(:title)}"

# DIRECTOR ..........................................
Director.destroy_all
steven = Director.create(
  :name => 'Steven Spielberg',
  :age => 70
)
ridley = Director.create(
  :name => 'Ridley Scott',
  :age => 65
)

# Movie tests
p "DIRECTOR........"
p "Director count: #{Director.all.length}"
p "Director titles: #{Director.all.pluck(:name)}"

# ASSOCIATIONS...................
steven.movies << alien << gladiator
ridley.movies << jaws << jurassic

# Association tests
p "ASSOCIATIONS........"
p "Stevens movies: #{steven.movies.pluck(:title)}"
p "Ridleys movies: #{ridley.movies.pluck(:title)}"

```
Seed our database
```shell
$ rails db:seed
```

## Routes
Add our routes. Use resources help to create our RESTful routes which will match our controllers
```ruby
# config/routes.rb
resources :movies
resources :directors
```

## Serializers
Create our serializers for Movie and Director (singular)
```shell
rails g serializer Movie
rails g serializer Director
```

In our serializers define all properties we would like rendered as well as associations
```ruby
# app/serializers/movie_serializer.rb
class MovieSerializer < ActiveModel::Serializer
  attributes :id, :title, :year, :box_office
  belongs_to :director
end

# app/serializers/director_serializer.rb
class DirectorSerializer < ActiveModel::Serializer
  attributes :id, :name, :age
  has_many :movies
end
```

## Controllers
Create our Movies and Directors (plural) controllers with basic CRUD methods
```shell
rails g controller Movies index show create update destroy
rails g controller Directors index show create update destroy
```
Delete auto-generated GET routes from controller as required in config/routes.rb file.

Create our controllers. If we wish to sideload association data, then add include: after render json and include the associated model and then the properties we want associated. The serializer will then sideload this data per jsonAPI standard

For ember specific apps we will be serving our create and update payload in the jsonAPI format. As a result we will need our strong params to accept the payload in the format of :data[:attributes]. To enable AMS to be able to parse this we have to add an additional mime type change (see next section below)
```ruby
# app/controllers/movie_controllers.rb
class MoviesController < ApplicationController
  def index
    @movies = Movie.all
    render json: @movies, include: ['director', 'director.name', 'director.age']
  end

  def show
    @movie = Movie.find(params[:id])
    render json: @movie, include: ['director', 'director.name', 'director.age']
  end

  def create
    @movie = Movie.create(movie_params)
    render json: @movie    
  end

  def update
    @movie = Movie.find(params[:id])
    @movie.update(movie_params)
    @movie.save
    render json: @movie    
  end

  def destroy
    @movie = Movie.find(params[:id])
    title = @movie.title
    @movie.destroy
    # returns HTTP Status Code 204: The server has successfully fulfilled the request and that there is no additional content to send in the response payload body. This is expected as part of jsonapi
    head :no_content
  end

  private
    def movie_params
      # params.require(:data).require(:attributes).permit(:title, :year, :box_office, :director_id)
      # Use AMS to deserialize jsonAPI payload into ruby hash
      ActiveModelSerializers::Deserialization.jsonapi_parse(params)
    end

end

```
Same for director
```ruby
# app/controllers/director_controllers.rb
class DirectorsController < ApplicationController
  def index
    @directors = Director.all
    render json: @directors, include: ['movies', 'movies.title', 'movies.year', 'movies.box_office']
  end

  def show
    @director = Director.find(params[:id])
    render json: @director, include: ['movies', 'movies.title', 'movies.year', 'movies.box_office']
  end

  def create
    @director = Director.create(director_params)
    render json: @director    
  end

  def update
    @director = Director.find(params[:id])
    @director.update(director_params)
    @director.save
    render json: @director    
  end

  def destroy
    @director = Director.find(params[:id])
    title = @director.title
    @director.destroy
    head :no_content
  end

  private
    def director_params
      # params.require(:data).require(:attributes).permit(:name, :age)
      # Use AMS to deserialize jsonAPI payload into ruby hash
      ActiveModelSerializers::Deserialization.jsonapi_parse(params)      
    end

end

```

ActiveModelSerializer gem has a workaround required to the mimetype initializer file in the rails gem in order for the strong params to accept the modified params from an Ember jsonapi payload. [Visit stackoverflow link for discussion](https://stackoverflow.com/questions/35733430/jsonapi-strong-params-with-rails-and-ember)
```ruby
# config/initializers/mime_types.rb
api_mime_type = %W(
  application/vnd.api+json
  text/x-json
  application/json
)

Mime::Type.unregister :json
Mime::Type.register 'application/json', :json, api_mime_type
```

Test API using postman 

## Author
Howie_Burger
