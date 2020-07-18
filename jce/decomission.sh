#!/bin/bash

echo "Demolishing your awesome stacks..."

cd candidatos
serverless remove
sleep 5s

cd ..
cd colegios
serverless remove
sleep 5s

cd ..
cd exterior
serverless remove
sleep 5s

cd ..
cd partidos
serverless remove
sleep 5s

cd ..
cd estado
serverless remove
sleep 5s

cd ..
cd elecciones
serverless remove
sleep 5s

cd ..
cd gateway
serverless remove

echo "Demolishing complete :)"
read