# ganomede-mailchimp-worker

MailChimp microservice.

Relations
---------

The mailchimp module will:

 * Listen for registrations and changes related events from ganomede-users.
 * Register the users' emails in mailchimp

Configuration
-------------

 * `API_SECRET` — non-empty string
 * `LOG_LEVEL` — [log level](https://github.com/trentm/node-bunyan#levels), defaults to `INFO`


 * Newsletter config:
   - `NEWSLETTER_NAME` non-empty string with internal name of newsletter (used in usermeta to track user's subscription status)
   - `NEWSLETTER_ALLOW_FROM` optional comma-seprated list; if specified, worker will only subscribe users from those apps

 * Mailchimp config
   - `MAILCHIMP_LIST_ID` non-empty string with [Mailchimp List ID](http://kb.mailchimp.com/lists/manage-contacts/find-your-list-id)
   - `MAILCHIMP_CLIENT_ID` optional non-empty string, defaults to `${pkg.name}/${pkg.version}`; used as [a username for Mailchimp API](http://developer.mailchimp.com/documentation/mailchimp/guides/get-started-with-mailchimp-api-3/#authentication) and user agent header to help you filter through [logs](https://admin.mailchimp.com/account/api/)
   - `MAILCHIMP_API_KEY` non-empty string; [Mailchimp API Key](http://kb.mailchimp.com/integrations/api-integrations/about-api-keys)
   - `MAILCHIMP_DATA_CENTER` non-empty string; [Mailchimp Data Center](http://developer.mailchimp.com/documentation/mailchimp/guides/get-started-with-mailchimp-api-3/#resources)

 * ganomede-events instance
   - `EVENTS_PORT_8080_TCP_[ADDR|PORT|PROTOCOL]` - IP|Port|Protocol to the events service
   - `EVENTS_CLIENT_ID` non-empty string to [identify this worker](https://github.com/j3k0/ -anomede-events#new-clientclientid-options)
   - `EVENTS_CHANNEL` non-empty string, defaults to `"users/v1"`, channel to listen for  -vents on
   - `EVENTS_PREFIX` api prefix, defaults to `"events/v1"`

 * ganomede-usermeta instance (trakc subscription status)
   - `USERMETA_PORT_8080_TCP_[ADDR|PORT|PROTOCOL]` - IP|Port|Protocol to the usermeta service
   - `USERMETA_PREFIX` api prefix, defaults to `"usermeta/v1"`

 * HTTP status server
   - `HOST` non-empty string, defaults to `"0.0.0.0"`
   - `PORT` non-empty string, defaults to `8000`

API
---

[ganomede-users](https://github.com/j3k0/ganomede-users) will emit the given events to [ganomede-events](https://github.com/j3k0/ganomede-events): [see here for the full specification](https://github.com/j3k0/ganomede-users/blob/feature/events/doc/events.md)

Newsletter registration status will be stored as a `usermeta` in the **internal** metadata `newsletters`, with value `"<NEWSLETTER_NAME>"` (retrieve from environment variables). The `newsletters` metadata is a comma separated list of newsletter names.

The module will also provide a monitoring API similar to other module of ganomede:

### GET /mailchimp-worker/about

### GET /mailchimp-worker/ping/:stuff

Pending design question
---

 * If possible, add the originator of the event ("from" field) as a source for the mailchimp registration.

