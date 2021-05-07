import { expect } from 'chai';
import request, { SuperTest, Test } from 'supertest';
import { startServer } from '../server-config';

describe('Apollo Server API', () => {
  let requestServer: SuperTest<Test>;

  before(async () => {
    await startServer();
    requestServer = request(`http://localhost:4000`);
  });

  it('should be possible to call hello query', async (): Promise<void> => {
    const res: request.Response = await requestServer
      .post('/graphql')
      .send({ query: '{ hello }' })
      .expect(200);
    expect(res.body.data.hello).to.equal('Hello world!');
  });
});
