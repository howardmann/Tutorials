# SQL commands
## Table and associations
- Database: Hoyts
- Tables: `Movies`, `Reviews`, `Genres`, `Movies_Genres` (join table)
- Associations: 
  - `Movies` one-to-many `Reviews` 
  - `Movies` many-to-many `Genres`
  - `Genres` one-to-many `Reviews` through `Movies`

## 1. Setup
Create database
```bash
# run postgresql in terminal
psql
# create database
CREATE DATABASE hoyts_movies;
# connect to database
\c hoyts_movies

# other useful terminal commands
\c {database_name}# connect to [database] 
\l # list all databases
\dt #list all tables in current database
\d {table_name} #list schema of table
```
Create tables
```sql
CREATE TABLE Movies (
  id serial PRIMARY KEY,
  title varchar(255),
  duration int
);

CREATE TABLE Reviews (
  id serial PRIMARY KEY,
  movie_id int REFERENCES movies,
  description varchar(255),
  rating int
);

CREATE TABLE Genres (
  id serial PRIMARY KEY,
  name varchar(255)
);

CREATE TABLE Genres_Movies (
  movie_id int REFERENCES movies,
  genre_id int REFERENCES genres
);
```
## 2. Seed database
Seed movies
```sql
-- DELETE EXISTING DATA
DELETE FROM Movies;
-- REST SERIAL PRIMARY KEY
ALTER SEQUENCE movies_id_seq RESTART WITH 1;
-- SEED NEW DATA
INSERT INTO Movies (id, title, duration) VALUES
(1, 'Alien', 120),
(2, 'Alien 2', 140),
(3, 'Jaws', 100),
(4, 'The Hobbit', 300),
(5, 'Gravity', 60);
-- REST THE AUTOINCREMENT LEVEL (otherwise next id that gets created is 1 and not 6)
SELECT setval('movies_id_seq', (SELECT MAX(id) FROM movies)+1);
-- LIST ALL MOVIES
SELECT * FROM Movies;
```
Seed reviews for movies
```sql
-- DELETE EXISTING DATA
DELETE FROM Reviews;
-- REST SERIAL PRIMARY KEY
ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
-- SEED NEW DATA
INSERT INTO Reviews (movie_id, description, rating) VALUES
(5, 'So short and sweet', 10),
(3, 'I love sharks', 10),
(3, 'Sharks scare me', 1),
(1, 'Aliens are so scary', 5);
-- LIST ALL MOVIES
SELECT * FROM Reviews;
```
Seed genres
```sql
-- DELETE EXISTING DATA
DELETE FROM Genres;
-- REST SERIAL PRIMARY KEY
ALTER SEQUENCE genres_id_seq RESTART WITH 1;
-- SEED NEW DATA
INSERT INTO Genres (id, name) VALUES
(1, 'Drama'),
(2, 'Action'),
(3, 'Comedy'),
(4, 'Horror');
-- LIST ALL MOVIES
SELECT * FROM Genres;
```
Associate movies to genres
```sql
-- DELETE EXISTING DATA
DELETE FROM Genres_Movies;
-- SEED NEW DATA
INSERT INTO Genres_Movies (movie_id, genre_id) VALUES
(1, 2),
(1, 4),
(2, 2),
(3, 4),
(4, 1),
(5, 1);
-- LIST ALL MOVIES
SELECT * FROM Genres_Movies;
```
## 3. Queries

Basic queries
```sql
-- Find all movies and return all properties
SELECT * FROM Movies;

--  id |   title    | duration
-- ----+------------+----------
--   1 | Alien      |      120
--   2 | Alien 2    |      140
--   3 | Jaws       |      100
--   4 | The Hobbit |      300
--   5 | Gravity    |       60

-- Find all movies and return title and duration property
SELECT title, duration FROM Movies;
--    title    | duration
-- ------------+----------
--  Alien      |      120
--  Alien 2    |      140
--  Jaws       |      100
--  The Hobbit |      300
--  Gravity    |       60

-- Find all rows where movie title = 'Alien'
SELECT * FROM movies WHERE title = 'Alien';
--  id | title | duration
-- ----+-------+----------
--   1 | Alien |      120

-- Find all movie rows where duration is > 80
SELECT * FROM movies WHERE duration > 80;
--  id |   title    | duration
-- ----+------------+----------
--   1 | Alien      |      120
--   2 | Alien 2    |      140
--   3 | Jaws       |      100
--   4 | The Hobbit |      300

-- Find all movie rows where duration > 80 and order by duration descending
SELECT * FROM movies WHERE duration > 80 ORDER BY duration DESC;
--  id |   title    | duration
-- ----+------------+----------
--   4 | The Hobbit |      300
--   2 | Alien 2    |      140
--   1 | Alien      |      120
--   3 | Jaws       |      100

-- Find all movies where the title is not equal to Alien
SELECT * FROM movies WHERE title <> 'Alien'; 
--  id |   title    | duration
-- ----+------------+----------
--   2 | Alien 2    |      140
--   3 | Jaws       |      100
--   4 | The Hobbit |      300
--   5 | Gravity    |       60
```

JOIN queries: Movie `has_many` Reviews
```sql
-- Find all movies with reviews and list all reviews
-- Use INNER JOIN to find the intersection between movies and reviews. Think venn diagram overlap
SELECT * FROM Movies
INNER JOIN Reviews
ON Movies.id=Reviews.movie_id;
--  id |  title  | duration | id | movie_id |     description     | rating
-- ----+---------+----------+----+----------+---------------------+--------
--   1 | Alien   |      120 |  4 |        1 | Aliens are so scary |      5
--   3 | Jaws    |      100 |  3 |        3 | Sharks scare me     |      1
--   3 | Jaws    |      100 |  2 |        3 | I love sharks       |     10
--   5 | Gravity |       60 |  1 |        5 | So short and sweet  |     10

-- Find all movies regardless if they have reviews and list all reviews
-- Use LEFT OUTER JOIN
SELECT * FROM Movies 
LEFT OUTER JOIN Reviews 
ON Movies.id=Reviews.movie_id;
--  id |   title    | duration | id | movie_id |     description     | rating
-- ----+------------+----------+----+----------+---------------------+--------
--   1 | Alien      |      120 |  4 |        1 | Aliens are so scary |      5
--   2 | Alien 2    |      140 |    |          |                     |
--   3 | Jaws       |      100 |  3 |        3 | Sharks scare me     |      1
--   3 | Jaws       |      100 |  2 |        3 | I love sharks       |     10
--   4 | The Hobbit |      300 |    |          |                     |
--   5 | Gravity    |       60 |  1 |        5 | So short and sweet  |     10

-- Using table alias
SELECT * FROM Reviews r
INNER JOIN Movies m
ON r.movie_id=m.id
WHERE m.title = 'Jaws';
--  id | movie_id |   description   | rating | id | title | duration
-- ----+----------+-----------------+--------+----+-------+----------
--   2 |        3 | I love sharks   |     10 |  3 | Jaws  |      100
--   3 |        3 | Sharks scare me |      1 |  3 | Jaws  |      100
```
OUTER JOIN queries: Movie `has_and_belongs_to_many` Genres
```sql
-- Find the genres of all movies
SELECT title, duration, Genres.name 
FROM Movies
INNER JOIN Genres_Movies
ON Movies.id = Genres_Movies.movie_id
INNER JOIN Genres
ON Genres_Movies.genre_id = Genres.id;

-- Find all movies with the genre Horror
SELECT * 
From Movies
INNER JOIN Genres_Movies
ON Movies.id = Genres_Movies.movie_id
INNER JOIN Genres
ON Genres_Movies.genre_id = Genres.id
WHERE name = 'Horror';

--  id | title | duration | movie_id | genre_id | id |  name
-- ----+-------+----------+----------+----------+----+--------
--   1 | Alien |      120 |        1 |        4 |  4 | Horror
--   3 | Jaws  |      100 |        3 |        4 |  4 | Horror
```

Genre `has_many` Reviews `through` Movies

```sql
-- Find all reviews with the genre of horror
SELECT Reviews.description AS review, Movies.title AS movie, Genres.name AS genre
From Genres
INNER JOIN Genres_Movies
ON Genres_Movies.genre_id = Genres.id
INNER JOIN Movies
ON Movies.id = Genres_Movies.movie_id
INNER JOIN Reviews
ON Reviews.movie_id = Movies.id
WHERE name = 'Horror';
--        review        | movie | genre
-- ---------------------+-------+--------
--  I love sharks       | Jaws  | Horror
--  Sharks scare me     | Jaws  | Horror
--  Aliens are so scary | Alien | Horror
```
Join queries with `json_agg`
```sql
-- Find all movies with reviews as json array
SELECT Movies.*, json_agg(Reviews)
FROM Movies
INNER JOIN Reviews
ON Reviews.movie_id = Movies.id
GROUP BY Movies.id;
--  id |  title  | duration |                                json_agg
-- ----+---------+----------+------------------------------------------------------------------------
--   1 | Alien   |      120 | [{"id":4,"movie_id":1,"description":"Aliens are so scary","rating":5}]
--   5 | Gravity |       60 | [{"id":1,"movie_id":5,"description":"So short and sweet","rating":10}]
--   3 | Jaws    |      100 | [{"id":3,"movie_id":3,"description":"Sharks scare me","rating":1},    +
--     |         |          |  {"id":2,"movie_id":3,"description":"I love sharks","rating":10}]


-- Find all movies with reviews pretty print
SELECT Movies.title, json_agg(json_build_object('comment', Reviews.description, 'rating',Reviews.rating)) AS reviews
  FROM Movies
  INNER JOIN Reviews
  ON Reviews.movie_id = Movies.id
GROUP BY Movies.id;

--   title  |                                            reviews
-- ---------+-----------------------------------------------------------------------------------------------
--  Alien   | [{"comment" : "Aliens are so scary", "rating" : 5}]
--  Gravity | [{"comment" : "So short and sweet", "rating" : 10}]
--  Jaws    | [{"comment" : "Sharks scare me", "rating" : 1}, {"comment" : "I love sharks", "rating" : 10}]
```
