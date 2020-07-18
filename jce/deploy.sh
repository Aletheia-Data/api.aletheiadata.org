#!/bin/bash

echo "Setting up Cloud Infrastructure"

cd candidatos
serverless deploy --stage dev
sleep 5s

cd ..
cd colegios
serverless deploy --stage dev
sleep 5s

cd ..
cd elecciones
serverless deploy --stage dev
sleep 5s

cd ..
cd estado
serverless deploy --stage dev
sleep 5s

cd ..
cd exterior
serverless deploy --stage dev
sleep 5s

cd ..
cd partidos
serverless deploy --stage dev
sleep 5s

echo "Press any key to continue"
read