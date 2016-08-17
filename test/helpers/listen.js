
import {Server} from '../..';
import request from 'supertest';

export default function listen (opts) {
  opts = opts || {};

  return function _listen (done) {
    this.app = new Server();
    const srv = this.server = this.app.server;
    const ctx = this;
    this.server.listen(err => {
      if (err) return done(err);
      ctx.request = request(srv)
        .get('/')
        .expect(200, done);
    });
  };
};
