'use strict';

const SubscribesUsers = require('../src/SubscribesUsers');

describe('SubscribesUsers', () => {
  describe('#process()', () => {
    let usermetaClient;
    let mailchimpClient;
    let subject;

    beforeEach(() => {
      usermetaClient = td.object(['write']);
      mailchimpClient = td.object(['subscribe']);
      subject = new SubscribesUsers({
        newsletterName: 'test',
        mailchimpListId: 'deadbeef',
        usermetaClient,
        mailchimpClient
      });
    });

    it('ties everything together', (done) => {
      const event = {
        type: 'CREATE',
        from: 'some-app',
        data: {
          userId: 'bob',
          aliases: {email: 'bob@example.com'},
          metadata: {}
        }
      };

      td.when(mailchimpClient.subscribe('deadbeef', td.matchers.isA(Object), td.callback))
        .thenCallback(null, 'stuff');

      td.when(usermetaClient.write('bob', 'newsletters$test', td.matchers.isA(String), td.callback))
        .thenCallback(null, {});

      subject.process(event, (err) => {
        expect(err).to.be.null;
        // Since <null> will fall through, check that everything was called.
        td.assert(mailchimpClient.subscribe).callCount(1);
        td.assert(usermetaClient.write).callCount(1);
        done();
      });
    });

    it('null falls through', (done) => {
      subject.process({type: 'returns null'}, (err) => {
        expect(err).to.be.null;
        td.assert(mailchimpClient.subscribe).callCount(0);
        td.assert(usermetaClient.write).callCount(0);
        done();
      });
    });
  });
});
