var app     = require('../../examples/express/app');
var request = require('supertest');

describe('mocha spec examples', function () {
  describe('tinylr', function () {
    it('GET /', function (done) {
      request(app)
        .get('/')
        .expect('Content-Type', /text\/html/)
        .expect(/Testing/)
        .expect(200, done);
    });
  });
});
