#!/bin/bash

echo "Demolishing your awesome stacks..."

serverless remove --stage dev
sleep 5s

echo "Demolishing complete :)"
read