#!/bin/bash

BASE_URL="${BASE_URL:-http://localhost:8000}"
PREFIX="${BASE_URL}/mailchimp-worker/v1"
API_SECRET=${API_SECRET:-doesnt_matter}

. `dirname $0`/rest_api_helper.sh

# Testing basics: ping and about
it 'responds to /ping'
    curl $PREFIX/ping/ruok
    outputIncludes ruok

it 'responds to /about'
    curl $PREFIX/about
    outputIncludes '"type": "mailchimp-worker"'
