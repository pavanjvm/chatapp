#!/bin/bash

echo "Installing dependencies..."
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
