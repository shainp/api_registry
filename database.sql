CREATE TABLE api(
   id                 SERIAL PRIMARY KEY,
   api                VARCHAR(255),
   url                VARCHAR(255),
   input              TEXT,
   output             TEXT,
   description        TEXT,
   name               VARCHAR(255)
);
