'use strict';

const samples = require('./samples');
const {SubscribeAction} = require('../src/actions');
const {SubscriptionInfo, MailchimpPayload} = require('../src/objects');

describe('objects', () => {
  describe('MailchimpPayload', () => {
    const action = new SubscribeAction({}, {
      userId: 'alice',
      email: 'alice@wonderland.com',
      from: 'app',
      metadata: {
        country: 'Russia',
        yearofbirth: 2000,
        newsletter: true
      }
    });

    const payload = new MailchimpPayload(action);

    describe('new MailchimpPayload()', () => {
      it('correctly initialized from action', () => {
        expect(payload).to.eql({
          email_address: 'alice@wonderland.com',
          status: 'subscribed',
          merge_fields: {
            G_USERID: 'alice',
            G_VIA: 'app',
            G_COUNTRY: 'Russia',
            G_YOB: 2000
          }
        });
      });

      it('picks location from metadata when set explicitly', () => {
        const req = {
          userId: 'alice',
          email: 'alice@wonderland.com',
          from: 'app',
          metadata: {
            country: 'ru',
            latitude: 0,
            longitude: 0
          }
        };

        expect(new MailchimpPayload(req).location).to.eql({
          latitude: 0,
          longitude: 0
        });
      });

      it('derives location from country code', () => {
        const req = {
          userId: 'alice',
          email: 'alice@wonderland.com',
          from: 'app',
          metadata: {
            country: 'ru'
          }
        };

        expect(new MailchimpPayload(req).location).to.eql({
          latitude: 55.75,
          longitude: 37.600000
        });
      });

      describe('empty metadata is okay', () => {
        const req = {
          userId: 'alice',
          email: 'alice@wonderland.com',
          from: 'app'
        };

        const payloadLocal = new MailchimpPayload(req);

        it('location is not set', () => {
          expect(payloadLocal).to.not.have.property('location');
        });

        it('merge_fields.G_COUNTRY is not set', () => {
          expect(payloadLocal.merge_fields).to.not.have.property('G_COUNTRY');
        });

        it('merge_fields.G_YOB is not set', () => {
          expect(payloadLocal.merge_fields).to.not.have.property('G_YOB');
        });
      });
    });

    it('#toSubscriptionInfo() includes all the redis things', () => {
      const result = payload.toSubscriptionInfo(samples.mailchimp.addMemberReply);

      expect(result).to.be.instanceof(SubscriptionInfo);
      expect(result).to.eql({
        type: 'mailchimp',
        listId: '85b0235cb4',
        subscriptionId: '488604a52f35acb808c17fcd36f96881',
        G_VIA: 'app'
      });
    });

    it('#detectProblems() lists missing merge_fields', () => {
      const problems = payload.detectProblems({
        merge_fields: {
          G_USERID: 'not-alice'
        }
      });

      expect(problems).to.eql({
        hasProblems: true,
        missing: ['G_VIA', 'G_COUNTRY', 'G_YOB'],
        invalid: ['G_USERID']
      });
    });
  });
});
