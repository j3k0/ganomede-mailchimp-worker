'use strict';

const utils = require('../src/utils');

describe('utils', () => {
  it('.hasOwnProperty()', () => {
    const obj = Object.create(null);
    obj.x = false;

    expect(utils.hasOwnProperty(obj, 'x')).to.be.true;
    expect(utils.hasOwnProperty(obj, 'y')).to.be.false;
  });
});
