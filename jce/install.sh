#!/bin/bash

echo "Installing packages"

cd contratados
npm install
sleep 5s

cd ..
cd fijos
npm install
sleep 5s

cd ..
cd periodo_probatorio
npm install
sleep 5s

cd ..
cd servicio_exterior
npm install
sleep 5s

echo "Press any key to continue"
read