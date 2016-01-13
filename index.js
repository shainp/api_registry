var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json({ type: 'application/json' }));

var postgres = require('./lib/postgres');

function lookupApi(req, res, next) {
  var apiId = req.params.id;
  var sql = 'SELECT * FROM api WHERE id = $1';
  postgres.client.query(sql, [ apiId ], function(err, results) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({ errors: ['Could not retrieve api'] });
    }
    if (results.rows.length === 0) {
      res.statusCode = 404;
      return res.json({ errors: ['api not found']});
    }

    req.api = results.rows[0];
    next();
  });
}

var apiRouter = express.Router();

apiRouter.get('/', function(req, res) {
  var page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  var limit = parseInt(req.query.limit, 10);
  if (isNaN(limit)) {
    limit = 10;
  } else if (limit > 50) {
    limit = 50;
  } else if (limit < 1) {
    limit = 1;
  }

  var sql = 'SELECT count(1) FROM api';
  postgres.client.query(sql, function(err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Could not retrieve apis']
      });
    }

    var count = parseInt(result.rows[0].count, 10);
    var offset = (page - 1) * limit;

    sql = 'SELECT * FROM api OFFSET $1 LIMIT $2';
    postgres.client.query(sql, [offset, limit], function(err, result) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.json({
          errors: ['Could not retrieve apis']
        });
      }

      return res.json(result.rows);
    });
  });
});

apiRouter.post('/', function(req, res) {
  var sql = 'INSERT INTO api (api, url, input, output, description, name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id';
  var data = [
    req.body.api,
    req.body.url,
    req.body.input,
	req.body.output,
	req.body.description,
	req.body.name
  ];
  postgres.client.query(sql, data, function(err, result) {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.json({
        errors: ['Could not insert api']
      });
    }

    var apiId = result.rows[0].id;
    var sql = 'SELECT * FROM api WHERE id = $1';
    postgres.client.query(sql, [ apiId ], function(err, result) {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        return res.json({ errors: ['Could not retrieve api after insert'] });
      }

      res.statusCode = 201;
      res.json(result.rows[0]);
    });
  });
});
apiRouter.get('/:id([0-9]+)', lookupApi, function(req, res) {
  res.json(req.api);
});
app.use('/apis', apiRouter);

module.exports = app;
