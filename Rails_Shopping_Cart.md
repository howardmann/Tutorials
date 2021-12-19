# Rails Shopping Cart

## Overview and Features
Howie's workflow notes for building a simple Rails grocery shopping cart. Summary features outlined below:

* **User is able to:**
  - View all products
  - Add/ remove products to/ from cart
  - Add/ reduce quantity of products in cart
  - Checkout cart by submitting order
  - Enter order details   


* **Admin is able to:**
  - Create, edit and delete products
  - View and delete/ fulfil all user orders

## Models
Build a minimum of four models (excluding User authentication for now):

1. **Product**:
  - Stores individual products and their details
    - has_many :line_items, dependent: :destroy  


2. **LineItem**:
  - Join Table which bridges Product and Cart. Needed to add multiple quantities of each product to Cart (see below)
    - belongs_to :product
    - belongs_to :cart
    - belongs_to :order, optional: true (for checkout see below)  


3. **Cart**:
  - Create a new instance each time a new session occurs to keep track of added products throughout the app. Used to store Product LineItems before proceeding to new Order checkout
    - has_many :line_items, dependent: :destroy
    - has_many :products, through: :line_items  


4. **Order**:
  - New model created from Cart page after user is happy to checkout. Model captures user payment and shipping details and then LineItems are transferred from Cart to Order
    - has_many :line_items, dependent: :destroy  

**Rails generate Model commands**  
Note: remember to set default values in atom Rails migration tables prior to rake db:migrate. Syntax: ```, default: value```

```ruby
rails g model Product name:string price:decimal
rails g model Cart  
rails g model LineItem quantity:integer product_id:integer cart_id:integer order_id:integer
rails g model Order name:string email:string address:text
```

**Database schema reference**  
Schema below for reference. Remember to add associations to model as outlined above
```ruby
create_table "products", force: :cascade do |t|
  t.string   "name"
  t.decimal  "price",      default: 0.0
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "carts", force: :cascade do |t|
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end

create_table "line_items", force: :cascade do |t|
  t.integer  "quantity",   default: 1
  t.integer  "product_id"
  t.integer  "cart_id"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  t.integer  "order_id"
end

create_table "orders", force: :cascade do |t|
  t.string   "name"
  t.string   "email"
  t.text     "address"
  t.string   "pay_method"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end
```

**Seed database with initial models**  
Seed database file with Product data and write simple tests. Also destroy latest session Cart when re-seeding.

```ruby
# PRODUCT
Product.destroy_all
product1 = Product.create({:name=>"tomato", :price => 1})
product2 = Product.create({:name=>"milk", :price => 3})
product3 = Product.create({:name=>"bread", :price => 5.50})
product4 = Product.create({:name=>"bacon", :price => 10})
product5 = Product.create({:name=>"cheese", :price => 3.20})

puts "Total number of products: #{Product.all.count}"
puts "Product names: #{Product.all.pluck("name")}"
puts "Product1: #{product1.name} price: #{product1.price.round(2)}"
puts "Product2: #{product2.name} price: #{product2.price.round(2)}"
puts "Product3: #{product3.name} price: #{product3.price.round(2)}"
puts "Product4: #{product4.name} price: #{product4.price.round(2)}"
puts "Product5: #{product5.name} price: #{product5.price.round(2)}"

# CART
Cart.destroy_all
puts "\nTotal cart count: #{Cart.all.count}"
```

## Controller setup
Setup controllers for each model and associated actions and views. Run terminal commands (see next section) before adding methods

1. **Product**  
  - Actions (full CRUD): index, new, create, edit, update, destroy
  - Views: index, new, edit  

2. **LineItem**  
  - Actions: create, add_quantity, reduce_quantity, destroy  

3. **Cart**:
  - Actions: show, destroy
  - Views: show  

4. **Order**:
  - Actions: index show new create
  - Views: index, new, show

**Rails generate Controller commands**  
Avoid using scaffold as we wont need most of the methods. Remember controllers are plural.  

```ruby
rails g controller Products index new edit
rails g controller LineItems
rails g controller Carts show
rails g controller Orders index show new
```

## Routes setup
Match routes with controller actions outlined above. The tricky routes here are the line_items routes which we define custom routes for as lineitems will be modified within Product and Cart views.

```ruby  
root 'products#index'

get 'carts/:id' => "carts#show", as: "cart"
delete 'carts/:id' => "carts#destroy"

post 'line_items/:id/add' => "line_items#add_quantity", as: "line_item_add"
post 'line_items/:id/reduce' => "line_items#reduce_quantity", as: "line_item_reduce"
post 'line_items' => "line_items#create"
get 'line_items/:id' => "line_items#show", as: "line_item"
delete 'line_items/:id' => "line_items#destroy"

resources :products
resources :orders
```

We include post url routes directing to the line_item actions of creating, adding and reducing products to the cart. To access these urls from the view pages we need to modify the link_to helpers to specify a post HTTP request as the default method is get. We will see this code later on

```ruby
# Link from the Product index page (erb tags)
button_to "Add to cart", line_items_path(:product_id => product.id)

# Link from the Cart show (erb tags)
link_to "Add (+1)", line_item_add_path(:id => line_item), method: :post
link_to "Reduce (-1)", line_item_reduce_path(:id => line_item), method: :post
link_to "Remove item", line_item_path(line_item), method: :delete
```

## Product

### Products Controller
Build out full CRUD controller actions

```ruby
class ProductsController < ApplicationController
  def index
    @products = Product.all
  end

  def new
    @product = Product.new
  end

  def create
    @product = Product.create(product_params)
    redirect_to products_path
  end

  def edit
    @product = Product.find(params[:id])
  end

  def update
    @product = Product.find(params[:id])
    @product.update(product_params)
    redirect_to products_path
  end

  def destroy
    @product = Product.find(params[:id])
    @product.destroy
    redirect_to products_path
  end

  private
    def product_params
      params.require(:product).permit(:name, :price)
    end
end
```

### Product Views
** Product Index show page**

```ruby
<h2>All Products</h2>

<% @products.each do |product| %>
  <p>Name: <%= product.name %>; unit price of <%= number_to_currency(product.price) %></p>
  <p>
    <%= link_to "Edit", edit_product_path(product) %> |
    <%= link_to "Delete", product_path(product), method: :delete, data: {confirm: "Are you sure?"} %>
    <%= button_to "Add #{product.name} to cart", line_items_path(:product_id => product.id) %>
  </p>
<% end%>

<%= link_to "New product", new_product_path
```

** Product New and Edit form partial **  

```ruby
<%= form_for(@product) do |f| %>
  <p>
    <%= f.label :name %><br>
    <%= f.text_field :name, required: true, autofocus: true, placeholder: "Enter product name" %>
  </p>
  <p>
    <%= f.label :price %><br>
    <%= f.number_field :price, required: true %>
  </p>
  <p>
    <%= f.submit %>
  </p>
<% end
```

## Cart

### Carts Controller
We want the Cart to be accessible throughout the entire app so we store it in the application_controller. We want to create a new Cart model each time a user visits the site and store that cart_id in a session[:cart_id]. This will let us track the same cart and its contents throughout the application. Save the code in the file app/controllers/application_controller.rb and have it run before all actions.  
The code logic below is two fold:
1. If a session[:cart_id] already exists then find the Cart with that id, if there is no cart with that id then set the session id to nil.
2. If there is no session[:cart_id] associated with this user then create a new cart and store it in the users session id

```ruby
class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :current_cart

  private
    def current_cart
      if session[:cart_id]
        cart = Cart.find_by(:id => session[:cart_id])
        if cart.present?
          @current_cart = cart
        else
          session[:cart_id] = nil
        end
      end

      if session[:cart_id] == nil
        @current_cart = Cart.create
        session[:cart_id] = @current_cart.id
      end
    end
end
```

After a cart is created we want to be able to show and empty the cart:
1. Show: Within the carts_controller.rb file define the show action to reference the current_cart as determined by the session above
2. Destroy: To empty the cart we call the destroy action to destroy the current cart, reset the cart_id to nil and redirect back to the root page

```ruby
class CartsController < ApplicationController
  def show
    @cart = @current_cart
  end

  def destroy
    @cart = @current_cart
    @cart.destroy
    session[:cart_id] = nil
    redirect_to root_path
  end
end
```

### Cart View
**Cart show page**: Cart show view page to display all line_items and relevant, product, quantity and price details. (See sections below for explanation of LineItem and Order links).

```ruby
<h2>Cart show</h2>
<ul>
  <% @cart.line_items.each do |line_item| %>
    <li>Item: <%= line_item.product.name %>/ Price: <%= number_to_currency(line_item.product.price) %>/ Quantity: <%= line_item.quantity %>/ Total Price: <%= number_to_currency(line_item.total_price) %>
    # See lineItem section below for explanation of line_item links
    <ul>
      <li>
        <%= link_to "Add one", line_item_add_path(:id => line_item), method: :post %>
        <%= link_to "Reduce one", line_item_reduce_path(:id => line_item), method: :post %>
      </li>
      <li>
        <%= link_to "Remove item", line_item_path(line_item), method: :delete %>
      </li>
    </ul>
    #
  <% end %>
</ul>
<h3>Sub total: <%= number_to_currency(@cart.sub_total) %></h3>
# See Order section below for explanation of new_order_path
<%= link_to "Proceed to checkout", new_order_path %><br>
#
<%= link_to "Empty cart", cart_path(@current_cart),method: :delete, data: {confirm: "Are you sure?"}
```

**Model Helpers**: Add Model helper methods to calculate LineItem total_price and Cart Sub_total:  
1. LineItem: write total_price helper to find value of lineItem
2. Cart: write sub_total helper to calculate sum total of the total_price for each line_item

```ruby
class LineItem < ActiveRecord::Base
  belongs_to :product
  belongs_to :cart
  belongs_to :order

  # LOGIC
  def total_price
    self.quantity * self.product.price
  end
end

class Cart < ActiveRecord::Base
  has_many :line_items, dependent: :destroy
  has_many :products, through: :line_items

  # LOGIC
  def sub_total
    sum = 0
    self.line_items.each do |line_item|
      sum+= line_item.total_price
    end
    return sum
  end
end
```

## LineItem
LineItems includes the most logic as it joins all models together: Product, Cart and Order. We will want to perform four key actions with the LineItem model:
1. **Create LineItem**:
  1. **Controller logic**: If it is a new product then create a new line_item and append the product and cart to it. If the cart already has this product then find the line_item with this product and increment its quantity by 1

  ```ruby

  def create
    # Find associated product and current cart
    chosen_product = Product.find(params[:product_id])
    current_cart = @current_cart

    # If cart already has this product then find the relevant line_item and iterate quantity otherwise create a new line_item for this product
    if current_cart.products.include?(chosen_product)
      # Find the line_item with the chosen_product
      @line_item = current_cart.line_items.find_by(:product_id => chosen_product)
      # Iterate the line_item's quantity by one
      @line_item.quantity += 1
    else
      @line_item = LineItem.new
      @line_item.cart = current_cart
      @line_item.product = chosen_product
    end

    # Save and redirect to cart show path
    @line_item.save
    redirect_to cart_path(current_cart)
  end

  private
    def line_item_params
      params.require(:line_item).permit(:quantity,:product_id, :cart_id)
    end
  ```

  2. **View link**: Add button link to products index page (erb tags). Include reference to the relevant product when linking to LineItem url
  ```ruby
  button_to "Add #{product.name} to cart", line_items_path(:product_id => product.id)
  ```

  3. **Routes url**: Add as a post url request in routes linking to the create action in LineItems controller
  ```ruby
  post 'line_items' => "line_items#create"
  ```

2. **Destroy LineItem**:
  1. **Controller logic**: Find the current LineItem, destroy and redirect back to cart
  ```ruby
  def destroy
    @line_item = LineItem.find(params[:id])
    @line_item.destroy
    redirect_to cart_path(@current_cart)
  end  
  ```

  2. **View link**: Add link to carts/show page
  ```ruby
  link_to "Remove item", line_item_path(line_item), method: :delete
  ```

  3. **Routes url**:  Add delete method url and also get request for individual line_item which delete method will access to delete
  ```ruby
  get 'line_items/:id' => "line_items#show", as: "line_item"
  delete 'line_items/:id' => "line_items#destroy"
  ```

3. **add_quantity** and **remove_quantity**:
  1. **Controller logic**: Find line_item then increment or decrement, save and redirect back to cart show page. Additional logic in reduce_quantity to ensure cannot reduce below 1.

  ```ruby
  def add_quantity
    @line_item = LineItem.find(params[:id])
    @line_item.quantity += 1
    @line_item.save
    redirect_to cart_path(@current_cart)
  end

  def reduce_quantity
    @line_item = LineItem.find(params[:id])
    if @line_item.quantity > 1
      @line_item.quantity -= 1
    end
    @line_item.save
    redirect_to cart_path(@current_cart)
  end
  ```  

  2. **View link**: Reference url links in step 3 below and call on method: :post (You could also write as a get method but may cause performance issue, and as we are posting an increment/ decrement value it is better to use POST)
  ```ruby
  link_to "Add one", line_item_add_path(:id => line_item), method: :post
  link_to "Reduce one", line_item_reduce_path(:id => line_item), method: :post
  ```
  3. **Routes url**: Create custom urls similar to RESTful routes and including add and reduce to end of urls in order to differentiate HTTP POST requests
  ```ruby
  post 'line_items/:id/add' => "line_items#add_quantity", as: "line_item_add"
  post 'line_items/:id/reduce' => "line_items#reduce_quantity", as: "line_item_reduce"
  ```

## Order

### Orders Controller
Create Orders controller with typical index, show and new actions.  

```ruby
class OrdersController < ApplicationController
  def index
    @orders = Order.all
  end

  def show
    @order = Order.find(params[:id])
  end

  def new
    @order = Order.new
  end
end
```

**Create**: Create method takes four logical steps:
1. Instantiate a new Order variable passing in the form params (see below for the new form page view which collects the params).
2. Then before saving, iterate through the current_cart's line_items and append them to the new order variable. Then remember to assign the cart_id of the line_item to nil - NOTE: THIS IS IMPORTANT AS IT STOPS THE LINE_ITEMS BEING DELETED AFTER WE DESTROY THE CART LATER.
3. Save the order after appending all line_items from the cart
4. Destroy the cart and set the session[:cart_id] = nil as the order and cart has been fulfilled and the user can start shopping for a new order. Redirect back to root_path

```ruby
def create
  @order = Order.new(order_params)
  @current_cart.line_items.each do |item|
    @order.line_items << item
    item.cart_id = nil
  end
  @order.save
  Cart.destroy(session[:cart_id])
  session[:cart_id] = nil
  redirect_to root_path
end

private
  def order_params
    params.require(:order).permit(:name, :email, :address, :pay_method)
  end
```

### Orders View
New Order page which asks user for payment details
```ruby
<%= form_for(@order) do |f| %>
  <p>
    <%= f.label :name %><br>
    <%= f.text_field :name, required: true, autofocus: true %>
  </p>
  <p>
    <%= f.label :email %><br>
    <%= f.email_field :email %>
  </p>
  <p>
    <%= f.label :address %><br>
    <%= f.text_area :address %>
  </p>
  <p>
    <%= f.submit %>
  </p>
<% end
```

Index page listing out all orders
```ruby
<h2>All Orders</h2>

<% @orders.each do |order| %>
  <p>Name: <%= order.name %></p>
  <p>Email: <%= order.email %></p>
  <p>Line Items: </p>
  <ul>
    <% order.line_items.each do |item| %>
    <li><%= item.quantity %> x <%= item.product.name %></li>
    <% end %>
  </ul>
<% end
```

# END
