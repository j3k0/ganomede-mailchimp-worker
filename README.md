# ganomede-mailchimp-worker

MailChimp microservice.

Relations
---------

The mailchimp module will:

 * Listen for registrations and changes related events from ganomede-users.
 * Register the users' emails in mailchimp

Configuration
-------------

 * `NEWSLETTER_NAME` - Name of the newsletter handled by this worker (free string)
 * `EVENTS_PORT_8080_TCP_[ADDR|PORT|PROTOCOL]` - IP|Port|Protocol to the events service
 * `USERMETA_PORT_8080_TCP_[ADDR|PORT|PROTOCOL]` - IP|Port|Protocol to the usermeta service
 * `LOG_LEVEL` — [log level](https://github.com/trentm/node-bunyan#levels), defaults to `INFO`
 * `MAILCHIMP_...` (mailchimp credentials, to be defined)

API
---

[ganomede-users](https://github.com/j3k0/ganomede-users) will emit the given events to [ganomede-events](https://github.com/j3k0/ganomede-events): [see here for the full specification](https://github.com/j3k0/ganomede-users/blob/feature/events/doc/events.md)

Newsletter registration status will be stored as a `usermeta` in the **internal** metadata `newsletters`, with value `"<NEWSLETTER_NAME>"` (retrieve from environment variables). The `newsletters` metadata is a comma separated list of newsletter names.

The module will also provide a monitoring API similar to other module of ganomede:

### GET /mailchimp-worker/about

### GET /mailchimp-worker/ping/:stuff
