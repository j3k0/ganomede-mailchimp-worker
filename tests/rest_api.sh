#!/bin/bash

API_SECRET=${API_SECRET:-doesnt_matter}

BASE_URL="${BASE_URL:-http://localhost:8000}"
PREFIX="${BASE_URL}/mailchimp-worker/v1"

USERMETA_URL="${EVENTS_URL:-http://localhost:8004}"
USERMETA_PREFIX="${USERMETA_URL}/usermeta/v1"

EVENTS_URL="${EVENTS_URL:-http://localhost:8003}"
EVENTS_PREFIX="${EVENTS_URL}/events/v1"

. `dirname $0`/rest_api_helper.sh

# Testing basics: ping and about
it 'responds to /ping'
    curl $PREFIX/ping/ruok
    outputIncludes ruok

it 'responds to /about'
    curl $PREFIX/about
    outputIncludes '"type": "mailchimp-worker"'

it 'attempts to register users'
    # Post a CREATE event
    curl $EVENTS_PREFIX/events -d '{
      "clientId": "mailchimp-worker/v1",
      "channel": "users/v1",
      "secret": "doesnt_matter",
      "from": "gameone",
      "type": "CREATE",
      "data": {
        "userId": "testuser",
        "aliases": {
          "email": "test@fovea.cc"
        },
        "metadata": {
          "newsletter": true,
          "country": "lb",
          "yearofbirth": "2015"
        }
      }
    }'
    printOutput
    # this should fail (coz no valid mailchimp config)
