'use strict';

const curtain = require('curtain-down');
const {Client} = require('ganomede-events');
const SubscribesUsers = require('./SubscribesUsers');
const UsermetaClient = require('./apis/UsermetaClient');
const MailchimpClient = require('./apis/MailchimpClient');
const logger = require('./logger');
const config = require('../config');

class Worker {
  constructor ({subscriber, events, channel}) {
    this.subscriber = subscriber;
    this.events = events;
    this.channel = channel;
    this.stopped = true;
    this.onEvent = this.onEvent.bind(this);
    this.onError = this.onError.bind(this);
    this.onCycle = this.onCycle.bind(this);
  }

  onEvent (event, channel) {
    // Since we may stop after all events are emitted, there will be no ACK.
    // So to not reprocess this event on next launch, skip them.
    if (this.stopped)
      return;

    this.subscriber.process(event, (error) => {
      if (error)
        logger.error({channel, error}, `Failed to process Event(${event.id})`);
    });
  }

  onError (error, channel) {
    logger.error({channel, error}, 'Events channel error');
  }

  onCycle (cursors, channel) {
    if (this.stopped && (channel === this.channel)) {
      this.events.removeListener(this.channel, this.onEvent);
      this.events.removeListener('error', this.onError);
      this.events.removeListener('cycle', this.onCycle);
      logger.info('Worker stopped.');
    }
  }

  start () {
    if (!this.stopped)
      return;

    this.stopped = false;
    this.events.on(this.channel, this.onEvent);
    this.events.on('error', this.onError);
    this.events.on('cycle', this.onCycle);
  }

  stop () {
    this.stopped = true;
    logger.info('Working stopping after next cycle…');
  }
}

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

  const worker = new Worker({
    subscriber,
    events,
    channel: config.events.channel
  });

  worker.start();
  curtain.once(() => worker.stop());
};

module.exports = work;

if (!module.parent)
  work();
