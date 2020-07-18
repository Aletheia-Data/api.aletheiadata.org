#!/bin/bash

echo "Setting up Cloud Infrastructure"

cd contratados
serverless deploy --stage dev
sleep 5s

cd ..
cd fijos
serverless deploy --stage dev
sleep 5s

cd ..
cd periodo_probatorio
serverless deploy --stage dev
sleep 5s

cd ..
cd servicio_exterior
serverless deploy --stage dev
sleep 5s

echo "Press any key to continue"
read