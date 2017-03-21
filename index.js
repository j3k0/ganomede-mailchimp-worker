'use strict';

const serve = require('./src/serve');
const work = require('./src/worker');
const logger = require('./src/logger');
const config = require('./config');

const main = () => {

  // Use New Relic if LICENSE_KEY has been specified.
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    if (!process.env.NEW_RELIC_APP_NAME) {
      const pk = require('./package.json');
      process.env.NEW_RELIC_APP_NAME = pk.api;
    }
    require('newrelic');
  }

  logger.info(config, 'parsed config');
  serve();
  work();
};

if (!module.parent)
  main();
