# Regular Expressions

1. Approximate equality
2. Ranges
3. Character classes
4. Quantifiers

## 1. Approximate equality
Regular expressions are used on strings to search and filter. Syntax for regular expressions is outlined below, where =~ represents approximate equality and / / represents the syntax where regular expressions are written.

```ruby
# Syntax "string" =~ / regex /

"bob" =~ / bob /  # => returns 0 index position

"bob" =~ / cat /  # => returns nil
```

## 2. Ranges
Use square brackets to search for characters within a range [a-z] or [0-9]. You can also search for capitalized or lower case [Bb].

```ruby
# Syntax "string" =~ / [Bb] /
"bob" =~ /[Bb]ob/
"Bob" =~ /[Bb]ob/
"bob" =~ /[a-zA-Z]ob/
"012345" =~ /[0-9]/

"MY NAME IS bob" =~ /[a-z]/ # => returns 11 index position where a first lowercase alphabet is found
```
Use the ^ to find anything but. Equivalent to !== in JavaScript.
```ruby
"012345" =~ /[^A-Z]/
```

## 3. Character classes
Used to check for capitalized and uncapitalized versions, digits and spaces.

Lowercase class looks for anything that IS a character class and Uppercase class looks for anything that IS NOT that class. Finds the first instance of the class rule and returns the index position within that string.

```ruby
# \w any word character e.g. all instances of [a-zA-Z] and [0-9]
"!! cat01" =~ /\w/  # => returns 3 first instance of word or digit

# \W any non-word character
"!! cat01" =~ /\W/  # => returns 0 first instance of non-word or digit

# \d any digit character
"!! cat01" =~ /\d/  # => returns 6 first instance of digit

# \D any non-digit character
"!! cat01" =~ /\D/  # => returns 0 first instance of non-digit

# \s any space character and new lines
"!! cat01" =~ /\s/  # => returns 2 first instance of space character

# \S any not-space character
"!! cat01" =~ /\S/  # => returns 0 first instance of non-space character

# . wild card character. Represents any value except a new line
"!! cat01" =~ /./ # => returns 0 first anything

```

We can use ```()``` and ```|``` to check for multiple things

```ruby
"Bob" =~ /(Joe|Bob)/ # returns 0
"Joe" =~ /(Joe|Bob)/ # returns 0
```

## 4. Quantifiers

### Approximate quantifiers
Symbols which matches the preceding regex character based on its occurance. Note: Remember it references the preceding character. So in the example of /hello*/ it would check if the character ```o``` came after ```hell``` any amount of times.

```ruby
# char* equals 0 or more - any amount of times
"howdy hell" =~ /hello*/  # return 6

# char+ equals 1 or more - check if char occurs once or more
"howdy hell" =~ /hello+/  # return nil

# char? equals 0 or 1 - check if char occurs once or none
"howdy hell" =~ /hello?/  # return nil
```

### Specific quantifiers
Find a certain character which occurs exactly n times. Syntax use curly brackets passing in a number argument for preceding character

```ruby
# char{2} must occur exactly twice
"hello" =~ /hel{2}/ # => find hell (ll twice consecutively)
0 # => match at index position 0

# char{2,} must occur at least twice
"hellllllllo" =~ /hel{2,}o/ # => at least two l's
0 # => match at index position 0

# char{,3} must occur three times or less
"hello" =~ /hel{,1}o/ # => l's three times or less
nil # => no l characters matching once or less
```
