'use strict';

const serve = require('./src/serve');
const work = require('./src/worker');
const logger = require('./src/logger');
const config = require('./config');

const main = () => {
  logger.info(config, 'parsed config');
  serve();
  work();
};

if (!module.parent)
  main();
