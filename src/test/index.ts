import supertest from 'supertest';

describe('GraphQL API', () => {

  let request;

  before (() => {
    request = supertest(`http://localhost:4000`);
  });

  it('hello query', (done) => {
    request
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
        done();
      });
  });
});
