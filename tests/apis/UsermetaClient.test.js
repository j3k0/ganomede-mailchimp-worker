'use strict';

const UsermetaClient = require('../../src/apis/UsermetaClient');

describe('UsermetaClient', () => {
  it('#read()', (done) => {
    const client = new UsermetaClient({
      protocol: 'https',
      hostname: 'localhost',
      port: 443,
      pathnamePrefix: '/usermeta/v1',
      secret: 'secret'
    });

    td.replace(client.api, 'get', td.function());

    td.when(client.api.get('/usermeta/v1/auth/secret.bob/key1%2Ckey2', td.callback))
      .thenCallback(null, {}, {}, {userId: {metaName: 'json string'}});

    client.read('bob', ['key1', 'key2'], (err, res) => {
      expect(err).to.be.null;
      expect(res).to.eql({userId: {metaName: 'json string'}});
      done();
    });
  });

  it('#write()', (done) => {
    const client = new UsermetaClient({
      protocol: 'https',
      hostname: 'localhost',
      port: 443,
      pathnamePrefix: '/usermeta/v1',
      secret: 'secret'
    });

    td.replace(client.api, 'post', td.function());

    td.when(client.api.post('/usermeta/v1/auth/secret.bob/some', {value: 'thing'}, td.callback))
      .thenCallback(null, {}, {}, {ok: true});

    client.write('bob', 'some', 'thing', (err, res) => {
      expect(err).to.be.null;
      expect(res).to.eql({ok: true});
      done();
    });
  });
});
