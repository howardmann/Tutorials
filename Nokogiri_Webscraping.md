# Nokogiri

## Overview and Features
Howie's workflow notes for using the [Nokogiri Ruby gem](http://www.nokogiri.org/) to webscrape a live [comparison website](http://www.getprice.com.au/men-watches-watches-gpc205t21192mp200np100.htm).

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

In our [comparison website example](http://www.getprice.com.au/men-watches-watches-gpc205t21192mp200np100.htm) we will use jQuery to select the elements which return our watch name, price, image and shop url. Ideally we will be spending the majority of our time in the DOM identifying and keeping track of jQuery selected items vs. writing Nokogiri and Rails script

```ruby
# Make note of the jQuery selected objects as you go along. Note this will not be coded, just for your benefit
container = $('.results')
price = $('.results .price_box .price') #  e.g. $199.99
name = $('.results .name a')  #  e.g. Mens Rip Curl Flyer Ii Lth Watch Blue Cotton
image = $('.results .pic img')  # e.g. image url with src
brand_logo = $('.results .logo img')  # e.g. surfstitch logo
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
#1. Visit getprice.com for two url's being female and male watches between $100 and $200
male_page = HTTParty.get('http://www.getprice.com.au/men-watches-watches-gpc205t21192mp200np100.htm')
female_page = HTTParty.get('http://www.getprice.com.au/women-watches-watches-gpc205t21191mp200np100.htm')

#2. Transform our HTTP response to a nokogiri object
parse_male_page = Nokogiri::HTML(male_page)
parse_female_page = Nokogiri::HTML(female_page)

#3. Create a meaningful Ruby Hash to store the variable. Here we are storing the information in a hash with two primary key value pairs being the male and female urls which will each hold an array of hashes representing the name, price, image, supplier logo and link to supplier website of each of the watches
@getprice = {:male => [], :female => []}

#4a. Use Nokogiri's css method to select the DOM nodes to loop through and manipulate (similar to jQuery). You will notice that the jQuery selectors are quite different for each node and will depend each time on how the author of the website has written out their classes and ids. Each case will be different, so it is best to rely on jQuery initially to identify where the information lies and how specific it is. Best rely on websites with well defined DOM names. This is not the best example
parse_male_page.css(".results .list-item-grid").each do |el|
  name = el.css('.name a').text
  price = el.css('.price_box .price').text
  # This is very important, to get the href link you need to call .attribute('src').to_s
  image = el.css('.pic img').attribute('src').to_s
  supplier = el.css('.logo img').attribute('src').to_s
  gotoshop = el.css('.action .gotoshop a').attribute('href').to_s

  @getprice[:male] << {:name => name, :price => price, :image => image, :supplier => supplier, :gotoshop => gotoshop}
end

#4b. We run the same code as above but this time to parse through the female watch page url
parse_female_page.css(".results .list-item-grid").each do |el|
  name = el.css('.name a').text
  price = el.css('.price_box .price').text
  image = el.css('.pic img').attribute('src').to_s
  supplier = el.css('.logo img').attribute('src').to_s
  gotoshop = el.css('.action .gotoshop a').attribute('href').to_s

  @getprice[:female] << {:name => name, :price => price, :image => image, :supplier => supplier, :gotoshop => gotoshop}
end
```

##4. Bring back to Rails
Create a new rails app and a Pages controller with index method. Remember to add gem dependencies as outlined above
```ruby
rails new web_scrape
rails g controller Pages index
rails s
```

In the Pages controller and within the index action add the Nokogiri script as written above, then also add the Rails helper at the end to render the Ruby hash array @getprice into JSON if needed by our front-end team. This will be helpful for our front-end work if we need to manipulate the JSON data with jQuery

```ruby
class PagesController < ApplicationController
  def index

    # Copy and paste Nokogiri script from above

    # Render data as json when user visits the url.json. Rails view page will still access the Ruby hash
    respond_to do |format|
      format.json { render :json => @getprice}
      format.html
    end

  end
end
```

Render the scraped data into the Pages view template `app/views/pages/index.html.erb`. Note that html.erb file still renders the data as a Ruby hash so we must use Ruby vs. JSON notation.

```html
<h1>Web scraping competitor live pricing</h1>

<h2>Male watches</h2>

<% @getprice[:male].each do |item| %>
  <p><%= image_tag(item[:image]) %></p>
  <p><%= item[:name] %></p>
  <p><%= item[:price] %></p>
  <p><%= image_tag(item[:supplier]) %></p>
  <a href="<%= item[:gotoshop] %>" target="_blank">Go to shop</a>
<% end %>

<h2>Female watches</h2>
<% @getprice[:female].each do |item| %>
  <p><%= image_tag(item[:image]) %></p>
  <p><%= item[:name] %></p>
  <p><%= item[:price] %></p>
  <p><%= image_tag(item[:supplier]) %></p>
  <a href="<%= item[:gotoshop] %>" target="_blank">Go to shop</a>
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
