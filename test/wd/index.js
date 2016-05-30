var wd      = require('wd');
var app     = require('../../examples/express/app');
var assert  = require('assert');
var request = require('supertest');


var port = process.env.LR_PORT || process.env.PORT || 35729;

describe('mocha spec examples', function() {

  this.timeout(10000);

  describe('tinylr', function() {

    it('GET /', function(done) {
      request(app)
        .get('/')
        .expect('Content-Type', /text\/html/)
        .expect(/Testing/)
        .expect(200, done);
    });
  });

});
