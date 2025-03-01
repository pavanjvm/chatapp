#!/bin/bash

echo "Stopping server..."
pkill -f node
if [ $? -ne 0 ]; then
  echo "Error stopping server!" >&2 # Redirect to stderr
  exit 1 # Indicate failure
fi
echo "Server stopped successfully."
exit 0 #Indicate success
