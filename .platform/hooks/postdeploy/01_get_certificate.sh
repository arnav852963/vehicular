#!/bin/bash

DOMAIN="vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com"
EMAIL="arnavticku@gmail.com"

# 1. Install Certbot package
sudo dnf install -y certbot

# 2. Stop Nginx temporarily so standalone mode can bind to Port 80 without 404/redirect issues
sudo systemctl stop nginx || true

# 3. Obtain SSL certificate via standalone mode
sudo certbot certonly --standalone --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN"

# 4. Write custom Nginx HTTPS configuration directly to conf.d
sudo tee /etc/nginx/conf.d/https_custom.conf > /dev/null <<EOF
server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# 5. Start Nginx with new HTTPS configuration
sudo systemctl start nginx

# 6. Reload Nginx to securely apply changes
sudo systemctl reload nginx

# 7. Create a cron job to automatically renew the certificate before it expires
echo "0 0,12 * * * root certbot renew --pre-hook \"systemctl stop nginx\" --post-hook \"systemctl start nginx\" --deploy-hook \"systemctl reload nginx\"" | sudo tee /etc/cron.d/certbot_renew
sudo chmod 644 /etc/cron.d/certbot_renew