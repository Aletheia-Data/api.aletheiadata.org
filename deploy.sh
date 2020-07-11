#!/bin/bash

cd candidatos
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd colegios
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd exterior
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd partidos
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd estado
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd elecciones
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

cd ..
cd gateway
serverless --org enzovezzaro --app opendatadr
serverless deploy
sleep 5s

echo "Press any key to continue"
read