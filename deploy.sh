#!/bin/bash

cd gateway
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

echo "Press any key to continue"
read