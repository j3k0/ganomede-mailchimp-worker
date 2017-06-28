'use strict';

const url = require('url');
const {SubscribeAction} = require('../../src/actions');
const {SubscriptionInfo, MailchimpPayload} = require('../../src/objects');
const MailchimpClient = require('../../src/apis/MailchimpClient');

describe('MailchimpClient', () => {
  const client = new MailchimpClient({
    clientId: 'ganomede-mailchimp-worker',
    dataCenter: 'us01',
    apiKey: 'secret'
  });

  describe('new MailchimpClient()', () => {
    it('correctly sets up base url', () => {
      expect(client.pathPrefix).to.eql('/3.0');
      expect(client.api.url).to.eql(url.parse('https://us01.api.mailchimp.com'));
    });

    it('sets up auth header', () => {
      expect(client.api.headers).to.have.property('authorization');
      expect(client.api.headers.authorization).to.match(/^Basic /);
    });
  });

  describe('#subscribe()', () => {
    it('uses SubscribeAction to subscribe user to listId', (done) => {
      const req = new SubscribeAction({}, {
        userId: 'bob',
        email: 'bob@example.com',
        from: 'some-app',
        metadata: {}
      });

      td.replace(client.api, 'post', td.function());

      td.when(client.api.post('/3.0/lists/deadbeef/members', td.matchers.isA(MailchimpPayload), td.callback))
        .thenCallback(null, {}, {}, {
          id: 'sub-id',
          list_id: 'deadbeef',
          merge_fields: {G_VIA: 'some-app'}
        });

      client.subscribe('deadbeef', req, (err, info) => {
        expect(err).to.be.null;
        expect(info).to.be.instanceof(SubscriptionInfo);
        expect(info).to.eql({
          type: 'mailchimp',
          listId: 'deadbeef',
          subscriptionId: 'sub-id',
          G_VIA: 'some-app'
        });
        done();
      });
    });
  });
});
