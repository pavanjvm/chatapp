#!/bin/bash

echo "Starting server..."
pwd
cd app
npm install
npm install -g pm2

echo "Starting server with PM2..."
pm2 start index.js --name my-app
pm2 save
pm2 startup
