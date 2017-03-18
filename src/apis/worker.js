'use strict';

const {Client} = require('ganomede-events');
const SubscribesUsers = require('./SubscribesUsers');
const UsermetaClient = require('./apis/UsermetaClient');
const MailchimpClient = require('./apis/MailchimpClient');
const config = require('../config');

const work = () => {
  // TODO
  // fix linter
  const subscriber = new SubscribesUsers({ // eslint-disable-line no-unused-vars
    usermetaClient: new UsermetaClient({
      protocol: config.usermeta.protocol,
      hostname: config.usermeta.host,
      port: config.usermeta.port,
      pathnamePrefix: config.usermeta.pathnamePrefix,
      secret: config.secret
    }),

    newsletterName: config.newsletter.name,
    allowedFromValues: config.newsletter.allowedFromValues,

    mailchimpListId: config.mailchimp.listId,
    mailchimpClient: new MailchimpClient({
      clientId: config.mailchimp.clientId,
      apiKey: config.mailchimp.apiKey,
      dataCenter: config.mailchimp.dataCenter
    })
  });

  const events = new Client(config.events.clientId, {
    secret: config.secret,
    protocol: config.events.protocol,
    hostname: config.events.host,
    port: config.events.port,
    pathname: config.events.pathnamePrefix
  });

  events.on(config.events.channel, (event, channel) => {
    throw new Error('NotImplemented');
  });

  events.on('error', (error, channel) => {
    throw new Error('NotImplemented');
  });
};

if (!module.parent)
  work();
