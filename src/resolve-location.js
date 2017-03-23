'use strict';

const lodash = require('lodash');
const capitals = require('./country-capitals.json');

const locations = (() => {
  const locations = new Map();

  capitals.forEach(entry => {
    const code = entry.CountryCode;
    if (code.length !== 2)
      return;

    const key = code.toUpperCase();
    const latitude = parseFloat(entry.CapitalLatitude);
    const longitude = parseFloat(entry.CapitalLongitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude))
      throw new Error(`Wierd location data, got NaN values for code ${code}`);

    if (locations.has(key))
      throw new Error(`Wierd location data, code ${code} is included multiple times`);

    locations.set(key, {latitude, longitude});
  });

  return locations;
})();

const hasCoordinate = (metadata, key) => {
  return metadata.hasOwnProperty(key) && Number.isFinite(metadata[key]);
};

const hasExplicitCoordinates = (metadata) => {
  return hasCoordinate(metadata, 'latitude') && hasCoordinate(metadata, 'longitude');
};

const hasCountry = (code) => {
  return locations.has(String(code).toUpperCase());
};

const getCountry = (code) => {
  return locations.get(String(code).toUpperCase());
};

const resolve = (metadata = {}) => {
  if (hasExplicitCoordinates(metadata))
    return lodash.pick(metadata, 'latitude', 'longitude');

  return hasCountry(metadata.country)
    ? getCountry(metadata.country)
    : null;
};

module.exports = resolve;
