import listen from './helpers/listen';
import request from 'supertest';
import {PassThrough} from 'stream';
import testHttpApi from './helpers/test-http-api';

describe('tiny-lr', () => {
  before(listen({
    livereload: function () {
      const s = new PassThrough();

      s.end('// custom live-reload');

      return s;
    }
  }));

  testHttpApi(this);

  describe('GET /livereload.js', () => {
    it('respond with livereload script', function (done) {
      request(this.server)
        .get('/livereload.js')
        .expect('// custom live-reload')
        .expect(200, done);
    });
  });
});
