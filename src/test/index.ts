import { expect } from 'chai';
import request from 'supertest';
import { startServer } from '../server-config';

describe('Apollo Server API', () => {
  let requestServer;

  before(async () => {
    await startServer();
    requestServer = request(`http://localhost:4000`);
  });

  it('query response equal hello world', (done) => {
    requestServer
      .post('/graphql')
      .send({
        query: '{ hello }',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.data.hello).to.equal('Hello world!');
        done();
      });
  });
});
