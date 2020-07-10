#!/bin/bash

cd candidatos
serverless deploy
sleep 5s

cd ..
cd colegios
serverless deploy
sleep 5s

cd ..
cd exterior
serverless deploy
sleep 5s

cd ..
cd partidos
serverless deploy
sleep 5s

cd ..
cd gateway
serverless deploy
sleep 5s

echo "Press any key to continue"
read