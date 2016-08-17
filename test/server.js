import request from 'supertest';
import assert from 'assert';
import listen from './helpers/listen';

describe('tiny-lr', () => {
  before(listen());

  describe('GET /', () => {
    it('respond with nothing, but respond', function (done) {
      request(this.server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(/\{"tinylr":"Welcome","version":"[\d].[\d].[\d]+"\}/)
        .expect(200, done);
    });

    it('unknown route respond with proper 404 and error message', function (done) {
      request(this.server)
        .get('/whatev')
        .expect('Content-Type', /json/)
        .expect('{"error":"not_found","reason":"no such route"}')
        .expect(404, done);
    });
  });

  describe('GET /changed', () => {
    it('with no clients, no files', function (done) {
      request(this.server)
        .get('/changed')
        .expect('Content-Type', /json/)
        .expect(/"clients":\[\]/)
        .expect(/"files":\[\]/)
        .expect(200, done);
    });

    it('with no clients, some files', function (done) {
      request(this.server)
        .get('/changed?files=gonna.css,test.css,it.css')
        .expect('Content-Type', /json/)
        .expect('{"clients":[],"files":["gonna.css","test.css","it.css"]}')
        .expect(200, done);
    });
  });

  describe('POST /changed', () => {
    it('with no clients, no files', function (done) {
      request(this.server)
        .post('/changed')
        .expect('Content-Type', /json/)
        .expect(/"clients":\[\]/)
        .expect(/"files":\[\]/)
        .expect(200, done);
    });

    it('with no clients, some files', function (done) {
      const data = { clients: [], files: ['cat.css', 'sed.css', 'ack.js'] };

      request(this.server)
        .post('/changed')
        // .type('json')
        .send({ files: data.files })
        .expect('Content-Type', /json/)
        .expect(JSON.stringify(data))
        .expect(200, done);
    });
  });

  describe('POST /alert', () => {
    it('with no clients, no message', function (done) {
      const data = { clients: [] };
      request(this.server)
        .post('/alert')
        .expect('Content-Type', /json/)
        .expect(JSON.stringify(data))
        .expect(200, done);
    });

    it('with no clients, some message', function (done) {
      const message = 'Hello Client!';
      const data = { clients: [], message: message };
      request(this.server)
        .post('/alert')
        .send({ message: message })
        .expect('Content-Type', /json/)
        .expect(JSON.stringify(data))
        .expect(200, done);
    });
  });

  describe('GET /livereload.js', () => {
    it('respond with livereload script', function (done) {
      request(this.server)
        .get('/livereload.js')
        .expect(/LiveReload/)
        .expect(200, done);
    });
  });

  describe('GET /kill', () => {
    it('shutdown the server', function (done) {
      const srv = this.server;
      request(srv)
        .get('/kill')
        .expect(200, err => {
          if (err) return done(err);
          assert.ok(!srv._handle);
          done();
        });
    });
  });
});
