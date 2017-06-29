'use strict';

const util = require('util');
const lodash = require('lodash');

class Action {
  constructor (event, ...messageArgs) {
    this.event = event;
    this.reason = util.format(...messageArgs);
  }
}

class IgnoreAction extends Action {
  constructor (event, badField, badValue) {
    super(event, 'Ignoring `event.%s` value of `%s`', badField, util.inspect(badValue));
  }
}

class SubscribeAction extends Action {
  constructor (event, {userId, email, from: fromValue, metadata}) {
    super(event, 'Received `%s` event from `%s` with user `%s <%s>`', event.type, fromValue, userId, email);
    this.userId = userId;
    this.email = email;
    this.from = fromValue;
    this.metadata = metadata;
  }
}

class UpdateEmailAction extends SubscribeAction {}

const createAction = (event = {}, {allowedFromValues = null} = {}) => {
  switch (event.type) {
    case 'CREATE':
    case 'CHANGE': {
      const fromValue = lodash.get(event, 'from');
      const userId = lodash.get(event, 'data.userId');
      const email = lodash.get(event, 'data.aliases.email');
      const newsletter = lodash.get(event, 'data.metadata.newsletter', true);

      if (!fromValue || (allowedFromValues && !allowedFromValues.includes(event.from)))
        return new IgnoreAction(event, 'from', fromValue);

      if (!userId)
        return new IgnoreAction(event, 'data.userId', userId);

      if (!email)
        return new IgnoreAction(event, 'data.aliases.email', email);

      if (!newsletter)
        return new IgnoreAction(event, 'data.metadata.newsletter', newsletter);

      const ctor = event.type === 'CREATE'
        ? SubscribeAction
        : UpdateEmailAction;

      return new ctor(event, {
        userId,
        email,
        from: fromValue,
        metadata: lodash.get(event, 'data.metadata', {})
      });
    }

    default:
      return new IgnoreAction(event, 'type', event.type);
  }
};

module.exports = {
  createAction,
  IgnoreAction,
  SubscribeAction,
  UpdateEmailAction
};
