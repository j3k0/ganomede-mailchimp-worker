'use strict';

const {SubscriptionRequest} = require('../src/objects');

describe('SubscribesUsers', () => {
  describe('#process()', () => {
    let SubscribesUsers;
    let logger;
    let usermetaClient;
    let mailchimpClient;
    let subject;

    beforeEach(() => {
      logger = td.replace('../src/logger', td.object(['info']));
      SubscribesUsers = require('../src/SubscribesUsers');
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

      subject.process(event, (err, nullIfEventWasIgnored) => {
        expect(err).to.be.null;
        expect(nullIfEventWasIgnored).to.be.undefined;
        // Since <null> will fall through, check that everything was called.
        td.assert(mailchimpClient.subscribe).callCount(1);
        td.assert(usermetaClient.write).callCount(1);
        done();
      });
    });

    it('null falls through and ignored event is logged', (done) => {
      subject.process({id: 42, type: 'returns null'}, (err, nullIfEventWasIgnored) => {
        expect(err).to.be.null;
        expect(nullIfEventWasIgnored).to.be.null;
        td.assert(mailchimpClient.subscribe).callCount(0);
        td.assert(usermetaClient.write).callCount(0);
        td.verify(logger.info(td.matchers.isA(SubscriptionRequest.IgnoredEventError), 'Event(id=42) ignored'));
        done();
      });
    });
  });
});
