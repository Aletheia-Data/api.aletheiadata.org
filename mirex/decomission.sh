#!/bin/bash

echo "Demolishing your awesome stacks..."

cd contratados
serverless remove
sleep 5s

cd ..
cd fijos
serverless remove
sleep 5s

cd ..
cd periodo_probatorio
serverless remove
sleep 5s

cd ..
cd servicio_exterior
serverless remove
sleep 5s

echo "Demolishing complete :)"
read