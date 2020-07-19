#!/bin/bash

echo "Demolishing your awesome stacks..."

cd candidatos
serverless remove --stage dev
sleep 5s

cd ..
cd colegios
serverless remove --stage dev
sleep 5s

cd ..
cd exterior
serverless remove --stage dev
sleep 5s

cd ..
cd partidos
serverless remove --stage dev
sleep 5s

cd ..
cd estado
serverless remove --stage dev
sleep 5s

cd ..
cd elecciones
serverless remove --stage dev
sleep 5s

echo "Demolishing complete :)"
read