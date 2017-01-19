# ganomede-mailchimp-worker

MailChimp microservice.

Relations
---------

The mailchimp module will:

 * Listen for registrations and changes related events from ganomede-users.
 * Register the users' emails in mailchimp

Configuration
-------------

 * `EVENTS_PORT_8080_TCP_ADDR` - IP of the events service
 * `EVENTS_PORT_8080_TCP_PORT` - Port of the events service
 * `BUNYAN_LEVEL` — [log level](https://github.com/trentm/node-bunyan#levels), defaults to `INFO`.

API
---

[ganomede-users](https://github.com/j3k0/ganomede-users) will emit the given events to [ganomede-events](https://github.com/j3k0/ganomede-events): [see here for the full specification](https://github.com/j3k0/ganomede-users/blob/feature/events/doc/events.md)

The module will also provide a monitoring API similar to other module of ganomede:

### GET /mailchimp-worker/about

### GET /mailchimp-worker/ping/:stuff

