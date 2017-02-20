import listen from './helpers/listen';
import request from 'supertest';
import testHttpApi from './helpers/test-http-api';

describe('tiny-lr', () => {
  before(listen());

  testHttpApi(this);

  describe('GET /livereload.js', () => {
    it('respond with livereload script', function (done) {
      request(this.server)
        .get('/livereload.js')
        .expect(/LiveReload/)
        .expect(200, done);
    });
  });
});
