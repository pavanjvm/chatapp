#!/bin/bash
echo "Unzipping server.zip..."
cd ..
unzip -o server.zip
rm -f server.zip  # Remove zip after extracting # Ensure scripts are executable
echo "Unzip complete."
