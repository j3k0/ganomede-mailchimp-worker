'use strict';

describe('StatsdClient', () => {
  let logger;
  let loggerChild;
  let StatsdClient;

  beforeEach(() => {
    logger = td.replace('../../src/logger', td.object(['child']));
    loggerChild = td.object(['warn']);

    td.when(logger.child({module: 'statsd'}))
      .thenReturn(loggerChild);

    StatsdClient = require('../../src/apis/StatsdClient');
  });

  describe('new StatsdClient()', () => {
    it('creates mock client on missing config and warns about it', () => {
      expect(new StatsdClient().mock).to.be.true;
      td.verify(loggerChild.warn({
        hostname: undefined,
        port: undefined,
        prefix: undefined
      }, 'StatsdClient missing some config options'));
    });
  });
});
