'use strict';

const curtain = require('curtain-down');
const {Client} = require('ganomede-events');
const SubscribesUsers = require('./SubscribesUsers');
const UsermetaClient = require('./apis/UsermetaClient');
const MailchimpClient = require('./apis/MailchimpClient');
const logger = require('./logger');
const config = require('../config');

const work = () => {
  logger.info(config, 'Running with config');

  const subscriber = new SubscribesUsers({
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
    pathname: `${config.events.pathnamePrefix}/events`
  });

  const processEvent = (event, channel) => {
    subscriber.process(event, (error) => {
      if (error)
        logger.error({channel, error}, `Failed to process Event(${event.id})`);

      if (stopProcessing)
        events.removeListener(config.events.channel, processEvent);
    });
  };

  // We need this var instead of directly unsubscribing,
  // because if we remove listener directly we risk ignoring
  // events already in progress.
  let stopProcessing = false;
  curtain.on(() => stopProcessing = true);
  events.on(config.events.channel, processEvent);

  events.on('error', (error, channel) => {
    logger.error({channel, error}, 'Events channel error');
  });
};

module.exports = work;

if (!module.parent)
  work();
