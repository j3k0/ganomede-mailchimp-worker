'use strict';

const {createAction, SubscribeAction} = require('../src/actions');

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

    it('processes CREATE events by subscribing to mailchimp', (done) => {
      const event = {
        type: 'CREATE',
        from: 'some-app',
        data: {
          userId: 'bob',
          aliases: {email: 'bob@example.com'},
          metadata: {}
        }
      };

      const refMailchimpReply = {ref: true};

      // first it will ask mailchimp to subscribe user
      td.when(mailchimpClient.subscribe('deadbeef', td.matchers.isA(SubscribeAction), td.callback))
        .thenCallback(null, refMailchimpReply);

      // then it will save result into usermeta
      td.when(usermetaClient.write('bob', 'newsletters$test', '{"ref":true}', td.callback))
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
      const event = {id: 42, type: 'bad action returns null'};
      const {reason: expectedReason} = createAction(event);

      subject.process(event, (err, nullIfEventWasIgnored) => {
        expect(err).to.be.null;
        expect(nullIfEventWasIgnored).to.be.null;
        td.assert(mailchimpClient.subscribe).callCount(0);
        td.assert(usermetaClient.write).callCount(0);
        td.verify(logger.info(td.matchers.isA(Object), `Event(id=42) resulted in IgnoreAction: ${expectedReason}`));
        done();
      });
    });
  });
});
