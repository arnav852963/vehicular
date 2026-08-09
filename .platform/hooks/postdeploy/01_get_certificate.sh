#!/bin/bash

# 1. Install Certbot packages natively on Amazon Linux 2023
sudo dnf install -y certbot python3-certbot-nginx

# 2. Stop Nginx temporarily to allow Standalone verification on Port 80 (bypasses 404 HTTP->HTTPS redirect issues)
sudo systemctl stop nginx || true

# 3. Request the certificate using standalone mode
sudo certbot certonly --standalone --non-interactive --agree-tos --email arnavticku@gmail.com -d vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com || true

# 4. Start Nginx back up
sudo systemctl start nginx

# 5. Automatically configure Nginx to use the certificate
sudo certbot --nginx --non-interactive --agree-tos --email arnavticku@gmail.com -d vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com

# 6. Reload Nginx to securely apply the changes
sudo systemctl reload nginx

# 7. Create a cron job to automatically renew the certificate before it expires
echo "0 0,12 * * * root certbot renew --pre-hook \"systemctl stop nginx\" --post-hook \"systemctl start nginx\" --deploy-hook \"systemctl reload nginx\"" | sudo tee /etc/cron.d/certbot_renew
sudo chmod 644 /etc/cron.d/certbot_renew