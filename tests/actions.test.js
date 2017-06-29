'use strict';

const {createAction, SubscribeAction, UpdateEmailAction, IgnoreAction} = require('../src/actions');

describe('actions', () => {
  describe('createAction()', () => {
    it('creates SubscribeAction from valid CREATE events', () => {
      const event = {
        type: 'CREATE',
        from: 'service',
        data: {
          userId: 'bob',
          aliases: {email: 'bob@example.com'}
        }
      };

      const action = createAction(event);

      expect(action).to.be.instanceof(SubscribeAction);
      expect(action).to.eql({
        event,
        reason: 'Received `CREATE` event from `service` with user `bob <bob@example.com>`',
        userId: 'bob',
        email: 'bob@example.com',
        from: 'service',
        metadata: {}
      });
    });

    it('creates UpdateEmailAction from valid CHANGE events', () => {
      const event = {
        type: 'CHANGE',
        from: 'service',
        data: {
          userId: 'bob',
          aliases: {email: 'bob@new-hip-server.com'},
          metadata: {letsPutSomethingHere: 'okay'}
        }
      };

      const action = createAction(event);

      expect(action).to.be.instanceof(UpdateEmailAction);
      expect(action).to.eql({
        event,
        reason: 'Received `CHANGE` event from `service` with user `bob <bob@new-hip-server.com>`',
        userId: 'bob',
        email: 'bob@new-hip-server.com',
        from: 'service',
        metadata: {letsPutSomethingHere: 'okay'}
      });
    });

    it('ignores uknown types', () => {
      const action = createAction({type: 'wierd'});
      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.type` value of `\'wierd\'`');
    });

    it('ignores invalid from values', () => {
      const action = createAction({type: 'CREATE'});
      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.from` value of `undefined`');
    });

    it('supports non-whitelisting from values', () => {
      const action = createAction({
        type: 'CREATE',
        from: 'non-whitelisted'
      }, {allowedFromValues: ['x', 'y']});

      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.from` value of `\'non-whitelisted\'`');
    });

    it('ignores invalid userId', () => {
      const action = createAction({type: 'CREATE', from: 'service'});
      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.data.userId` value of `undefined`');
    });

    it('ignores invalid emails', () => {
      const action = createAction({type: 'CREATE', from: 'service', data: {userId: 'bob'}});
      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.data.aliases.email` value of `undefined`');
    });

    it('ignores events when metadata.newsletter is set to false', () => {
      const action = createAction({
        type: 'CREATE',
        from: 'service',
        data: {
          userId: 'bob',
          aliases: {email: 'bob@example.com'},
          metadata: {newsletter: false}
        }
      });

      expect(action).to.be.instanceof(IgnoreAction);
      expect(action.reason).to.equal('Ignoring `event.data.metadata.newsletter` value of `false`');
    });
  });
});
