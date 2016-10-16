# Regular Expressions

1. Approximate equality
2. Ranges
3. Character classes
4. Quantifiers
5. Ruby .match method
6. Ruby .scan method
7. Ruby ^ and $ validators
8. Ruby flags
9. Regex greedy vs reluctant <-- This is a common issue, look at the examples

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

## 5. Ruby matching regular expressions
Ruby .match method returns a hash and stores matched regular expressions in number properties. We wrap the matches we want to return in parenthesis which will be accessible in the ruby MatchData hash.

```ruby
matches = "202-55-1701".match(/(\d+)-(\d+)-(\d+)/) # => #<MatchData "202-55-1701" 1:"202" 2:"55" 3:"1701">
matches[1] # => "202"
matches[2] # => "55"
matches[3] # => "1701"
```

We can use the symbol syntax to name the matched groups ```(?<name>(regex))```

```ruby
matches = "202-55-1701".match(/(?<first>\d+)-(?<second>\d+)-(?<banana>\d+)/) # => #<MatchData "202-55-1701" first:"202" second:"55" banana:"1701">
matches['first'] # => "202"
matches[:second] # => "55"
matches['banana'] # => "1701"
```

## 6. Ruby scan regular expressions
Ruby .scan method returns an array of matched regex strings.

```ruby
scanned = "202-55-1701".scan(/\d+/) # => ["202", "55", "1701"]
scanned[0]  # => '202'
scanned[1]  # => '55'
scanned[2]  # => '1701'
```

## 7. Ruby anchors
Use ^ symbol before the regex to say nothing else comes before it and $ at the end of the regex to say nothing comes after.

```ruby
"ruby " =~ /^ruby/ # => 0
" ruby " =~ /^ruby/ # => nil

" ruby" =~ /ruby$/ # => 1
" ruby " =~ /ruby$/ # => nil

"ruby" =~ /^ruby$/ # => 1
```

## 8. Ruby flags
Use i at end of regex to check based on case insensitive.

```ruby
"RUBY" =~ /ruby/i # => 0
"RUBY" =~ /ruby/ # => nil
```

Use x at end of regex to allow writing of code on new lines for readability of code. Note: Multi-line regex can only be done in Ruby, JavaScript cannot do this.

```ruby
some_num = "Number: 202-555-1701."
matchesMulti = some_num.match(/
  (?<first>\d+)- # This should match 202
  (?<second>\d+)- # This should match 55
  (?<banana>\d+)- # This should match 1701
/x)

matchesSingle = "Number: 202-55-1701.".match(/(?<first>\d+)-(?<second>\d+)-(?<banana>\d+)/)
```

## 9. Ruby greedy vs reluctant matches
NOTE: THIS IS IMPORTANT, YOU WILL COME ACROSS THE BUG OFTEN

When we use the .* regex matcher regex will try and match all results. To limit the number of matches we suffix it with a ? to tell regex to match as little as possible. (Note: this is quite complicated, refer to explanation below for more information).
```ruby
some_num = "202-555-1701"
# When just using the .* suffix, causes matching error
some_num.match(/(\d+).*(\d+).*(\d+)/) # => #<MatchData "202-555-1701" 1:"202" 2:"0" 3:"1">

# When just using the .*? suffix, solves the issue
some_num.match(/(\d+).*?(\d+).*?(\d+)/) # => #<MatchData "202-555-1701" 1:"202" 2:"555" 3:"1701">

# Another rexample
html = "<html><div></div></html>"
# Greedy approach matches everything until the last character of the string is >
html.match(/<(.*)>/) # => #<MatchData "<html><div></div></html>" 1:"html><div></div></html">
# Reluctant approach matches the first instance of the closing arrow bracket
html.match(/<(.*?)>/) # => #<MatchData "<html>" 1:"html">
```

Summary for ? symbol: This is confusing because the ? symbol has three separate meanings and uses in regex
1. ```/(?<symbol>/d+)/``` - when used at the beginning of parenthesis it creates a match name variable
2. ```/(optional)?/``` - when used at the end of a character it means that character is optional
3. ```/.*?/``` - when used at the end of a quantifier it refers to reluctant matching (see above)


### Stackoverflow explanation

```
Enter your regex: .*foo  // greedy quantifier
Enter input string to search: xfooxxxxxxfoo
I found the text "xfooxxxxxxfoo" starting at index 0 and ending at index 13.

Enter your regex: .*?foo  // reluctant quantifier
Enter input string to search: xfooxxxxxxfoo
I found the text "xfoo" starting at index 0 and ending at index 4.
I found the text "xxxxxxfoo" starting at index 4 and ending at index 13.

Enter your regex: .*+foo // possessive quantifier
Enter input string to search: xfooxxxxxxfoo
No match found.
```

A greedy quantifier first matches as much as possible. So the .* matches the entire string. Then the matcher tries to match the f following, but there are no characters left. So it "backtracks", making the greedy quantifier match one less thing (leaving the "o" at the end of the string unmatched). That still doesn't match the f in the regex, so it "backtracks" one more step, making the greedy quantifier match one less thing again (leaving the "oo" at the end of the string unmatched). That still doesn't match the f in the regex, so it backtracks one more step (leaving the "foo" at the end of the string unmatched). Now, the matcher finally matches the f in the regex, and the o and the next o are matched too. Success!

A reluctant or "non-greedy" quantifier first matches as little as possible. So the .* matches nothing at first, leaving the entire string unmatched. Then the matcher tries to match the f following, but the unmatched portion of the string starts with "x" so that doesn't work. So the matcher backtracks, making the non-greedy quantifier match one more thing (now it matches the "x", leaving "fooxxxxxxfoo" unmatched). Then it tries to match the f, which succeeds, and the o and the next o in the regex match too. Success!

In your example, it then starts the process over with the remaining unmatched portion of the string, following the same process.

A possessive quantifier is just like the greedy quantifier, but it doesn't backtrack. So it starts out with .* matching the entire string, leaving nothing unmatched. Then there is nothing left for it to match with the f in the regex. Since the possessive quantifier doesn't backtrack, the match fails there.
