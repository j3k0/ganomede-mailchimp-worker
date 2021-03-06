'use strict';

const bunyan = require('bunyan');
const pkg = require('./package.json');
const ServiceEnv = require('./src/ServiceEnv');
const {debugInspect} = require('./src/utils');

const parseLogLevel = (envValue) => {
  const defaultLevel = 'INFO';
  const desiredLevel = envValue ? String(envValue).toUpperCase() : defaultLevel;
  const levels = [
    'FATAL',
    'ERROR',
    'WARN',
    'INFO',
    'DEBUG',
    'TRACE'
  ];

  const hasMatch = levels.includes(desiredLevel);
  const level = hasMatch ? desiredLevel : defaultLevel;

  if (!hasMatch) {
    const available = `Please specify one of ${debugInspect(levels)}.`;
    const message = `Uknown log level "${desiredLevel}". ${available}`;
    throw new Error(message);
  }

  return bunyan[level];
};

const parseApiSecret = () => {
  const valid = process.env.hasOwnProperty('API_SECRET')
    && (typeof process.env.API_SECRET === 'string')
    && (process.env.API_SECRET.length > 0);

  if (!valid)
    throw new Error('API_SECRET must be non-empty string');

  return process.env.API_SECRET;
};

const nonempty = function (envName, defaultValue) {
  const val = process.env[envName];
  const has = process.env.hasOwnProperty(envName);
  const ok = has && (val.length > 0);

  if (has) {
    if (ok)
      return val;

    throw new Error(`Env var ${envName} must be non-empty string empty`);
  }

  if (arguments.length === 2)
    return defaultValue;

  throw new Error(`Env var ${envName} is missing`);
};

module.exports = {
  name: pkg.name,
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
  secret: parseApiSecret(),

  http: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.hasOwnProperty('PORT')
      ? parseInt(process.env.PORT, 10)
      : 8000,
    prefix: `/${pkg.api}`
  },

  newsletter: {
    name: nonempty('NEWSLETTER_NAME'),
    allowedFromValues: process.env.hasOwnProperty('NEWSLETTER_ALLOW_FROM')
      ? nonempty('NEWSLETTER_ALLOW_FROM').split(',').map(x => x.trim()).filter(x => x)
      : null
  },

  mailchimp: {
    listId: nonempty('MAILCHIMP_LIST_ID'),
    clientId: nonempty('MAILCHIMP_CLIENT_ID', `${pkg.name}/${pkg.version}`),
    apiKey: nonempty('MAILCHIMP_API_KEY'),
    dataCenter: nonempty('MAILCHIMP_DATA_CENTER')
  },

  usermeta: Object.assign(
    {pathnamePrefix: nonempty('USERMETA_PREFIX', '/usermeta/v1')},
    ServiceEnv.config('USERMETA', 8000)
  ),

  events: Object.assign(
    {
      clientId: nonempty('EVENTS_CLIENT_ID'),
      channel: nonempty('EVENTS_CHANNEL', 'users/v1'),
      pathnamePrefix: nonempty('EVENTS_PREFIX', '/events/v1')
    },
    ServiceEnv.config('EVENTS', 8000)
  ),

  statsd: {
    hostname: nonempty('STATSD_HOST', false),
    port: nonempty('STATSD_PORT', false),
    prefix: nonempty('STATSD_PREFIX', 'mailchimp.registrations.')
  }
};

if (!module.parent)
  console.log(debugInspect(module.exports)); // eslint-disable-line no-console
