'use strict';

const urlEscape = require('url-escape-tag');
const BaseClient = require('./BaseClient');

class UsermetaClient extends BaseClient {
  constructor ({protocol, hostname, port, pathnamePrefix, secret}) {
    super(`${protocol}://${hostname}:${port}${pathnamePrefix}`);
    this.secret = secret;
  }

  read (userId, metaNames, callback) {
    const token = `${this.secret}.${userId}`;
    const keys = Array.isArray(metaNames) ? metaNames : [metaNames];
    const path = urlEscape`/auth/${token}/${keys.join(',')}`;

    this.apiCall('get', path, callback);
  }

  write (userId, metaName, value, callback) {
    const token = `${this.secret}.${userId}`;
    const path = urlEscape`/auth/${token}/${metaName}`;

    this.apiCall('post', path, {value}, callback);
  }
}

module.exports = UsermetaClient;
