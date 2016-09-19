# Nokogiri

## Overview and Features
Howie's workflow notes for using the [Nokogiri Ruby gem](http://www.nokogiri.org/) to webscrape a live e-commerce website: [rosefield watches](https://www.rosefieldwatches.com/au/watches.html).

**Objectives**
  1. Install Nokogiri gems and dependencies
  2. Identify with jQuery in DOM information to cache from 3rd party website << Spend most time here to be productive
  3. Write a script to scrape and store identified information
  4. Use Rails to render scraped information

## 1. Installation
Install the following gems and dependencies in terminal:
- **Nokogiri** to manipulate HTML string (using similar CSS selector and jQuery syntax)
- **HTTParty** to fetch HTML from url and pass to Nokogiri
- **Pry** for Ruby debugging

```ruby
gem install nokogiri
gem install httparty
gem install pry
```

When using Rails require the gems in gemfile before running bundle.

```ruby
gem 'nokogiri'
gem 'httparty'
gem 'pry-rails'
```

## 2. Identify with jQuery in DOM
Visit the website you are looking to scrape information from in the browser. Use inspect element, console and jQuery to identify the relevant DOM nodes which contain the information you need.

In our [watch website example]((https://www.rosefieldwatches.com/au/watches.html) we will use jQuery to select the 'li' elements which return our watch name, price and url. Ideally we will be spending the majority of our time in the DOM identifying and keeping track of jQuery selected items vs. writing Nokogiri and Rails script

```javascript
$("#category-node-11 .rose-category ul li") // Returns jQuery array of li elements
$("#category-node-11 .rose-category ul li .rose-category-label") // Returns specifically the div's containing the name text
$("#category-node-11 .rose-category ul li .price") // Returns specifically the div's containing the price text
$("#category-node-11 .rose-category ul li .rose-category-watches-img") // Returns specifically the div's containing the image tags
```

## 3. Write a Nokogiri script
Using nokogiri and HTTParty create a script to cache the jQuery identified variables in custom Ruby hashes and arrays.

**Summary steps**  
1. Use HTTParty to fetch the HTML content from the url
2. Parse the HTML into a Nokogiri object
3. Create a meaningful hash/ array to store the manipulated information
4. Loop through the Nokogiri object using CSS selectors to identify and cache the desired information

**WARNING**: The amount and complexity of the Nokogiri script that you write will depend each time on how the HTML class and id names are defined on the website and how much manipulation/ grunt work will be required. It is better to spend the time to view the page in the DOM using jQuery before writing the script.

```ruby
#1. HTTParty to fetch and convert url HTML into a Ruby hash and store in variable
page = HTTParty.get('https://www.rosefieldwatches.com/au/watches.html')

#2. Parse the variable into a Nokogiri object and save as variable
parse_page = Nokogiri::HTML(page)

#3. Create a meaningful Ruby Hash to store the variable. Here we are storing the information in a hash with three primary key value pairs being the key brands which will each hold an array of hashes representing the name, price and image_url of each of the brands watches
@watches = {:bowery => [], :mercer => [], :gramercy => []}

#4. Use Nokogiri's css method to select the DOM nodes to loop through and manipulate (similar to jQuery). You will notice that the jQuery selectors are quite different for each node and will depend each time on how the author of the website has written out their classes and ids. Each case will be different, so it is best to rely on jQuery initially to identify where the information lies and how specific it is. Best rely on websites with well defined DOM names. This is not the best example
parse_page.css("#category-node-8 .rose-category ul li").map do |el|
  # .text extracts the text from the DOM
  # gsub(/\s+/,"") Ruby method to remove white space in text returned
  label = el.css(".rose-category-label").text.gsub(/\s+/,"")
  price = el.css(".price").text

  el.css(".slider-swipe [align='center']").map do |el|
    # ['src'] nokogiri method to extract value of src attribute, which in this case is the url value
    image = el['src']
    @watches[:bowery] << {:name => label, :price => price, :image => image}
  end
end

# Notice: it is quite repetitive and again will depend on how the HTML class and id names are labelled on the page
parse_page.css("#category-node-11 .rose-category ul li").map do |el|
  label = el.css(".rose-category-label").text.gsub(/\s+/,"")
  price = el.css(".price").text

  el.css(".rose-category-watches-img").map do |el|
    image = el['src']
    @watches[:mercer] << {:name => label, :price => price, :image => image}
  end
end

parse_page.css("#category-node-9 .rose-category ul li").map do |el|
  label = el.css(".rose-category-label").text.gsub(/\s+/,"")
  price = el.css(".price").text

  el.css(".rose-category-watches-img").map do |el|
    image = el['src']
    @watches[:gramercy] << {:name => label, :price => price, :image => image}
  end
end

```

##4. Bring back to Rails
Create a new rails app and a Pages controller with index method. Remember to add gem dependencies as outlined above
```ruby
rails new web_scrape
rails g controller Pages index
rails s
```

In the Pages controller and within the index action add the Nokogiri script as written above, then also add the Rails helper at the end to render the Ruby hash array @watches into JSON if needed by our front-end team. This will be helpful for our front-end work if we need to manipulate the JSON data with jQuery

```ruby
class PagesController < ApplicationController
  def index

    # Copy and paste Nokogiri script from above

    # Render data as json when user visits the url.json. Rails view page will still access the Ruby hash
    respond_to do |format|
      format.json { render :json => @watches}
      format.html
    end

  end
end
```

Render the scraped data into the Pages view template `app/views/pages/index.html.erb`. Note that html.erb file still renders the data as a Ruby hash so we must use Ruby vs. JSON notation.

```html
<h1>Nokogiri Webscraping</h1>

<h3>The Mercer collection</h3>
<% @watches[:mercer].each do |item| %>
    <p><%= image_tag(item[:image]) %></p>
    <p><%= item[:name] %></p>
    <p><%= item[:price] %></p>
<% end %>

<h3>The Bowery</h3>
<% @watches[:bowery].each do |item| %>
    <p><%= image_tag(item[:image]) %></p>
    <p><%= item[:name] %></p>
    <p><%= item[:price] %></p>
<% end %>


<h3>The Gramercy</h3>
<% @watches[:gramercy].each do |item| %>
    <p><%= image_tag(item[:image]) %></p>
    <p><%= item[:name] %></p>
    <p><%= item[:price] %></p>
<% end %>
```

##Summary
Now our feature is complete the following steps will occur each time a user visits our Rails Pages Index view page:  

1. The url request will call on the Pages controller Index action
2. HTTParty will make a get request to the url passed in and convert the HTML string into a Ruby hash
3. Nokogiri will parse/take the HTML data from HTTParty and store it in a Nokogiri object
4. Our custom scraping script gets run with the relevant data stored in a new Ruby hash object
5. Our erb view page then renders the Ruby hash object. We are also able to access the returned JSON parsed data using JavaScript (not covered in this guide, see below)
6. We use Rails helper to render JSON to the view page if needed (Note: this is not necessary if we are only rendering the view page with Rails html.erb and not rendering JSON with JavaScript, but we should include for completeness and future front-end features)

# END
