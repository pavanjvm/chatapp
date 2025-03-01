#!/bin/bash
echo "Unzipping server.zip..."
cd /app
unzip -o server.zip
rm -f server.zip  # Remove zip after extracting
chmod +x /scripts/*.sh  # Ensure scripts are executable
echo "Unzip complete."
