#!/bin/bash
echo "Configuring Nginx..."

# Remove default Nginx config (if any)
sudo rm -f /etc/nginx/sites-enabled/default

# Create an Nginx configuration for the frontend
sudo cat <<EOL > /etc/nginx/sites-available/frontend
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    error_page 404 /index.html;
}
EOL

# Enable the new configuration
sudo ln -sf /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend

# Check if the configuration is valid
sudo nginx -t

# Restart Nginx to apply changes
sudo systemctl restart nginx

echo "Nginx configured successfully!"
