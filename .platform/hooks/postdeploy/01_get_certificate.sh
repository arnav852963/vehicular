#!/bin/bash

# 1. Install Certbot packages natively on Amazon Linux 2023
sudo dnf install -y certbot python3-certbot-nginx

# 2. Stop Nginx temporarily so standalone authenticator can use Port 80 without 404/redirect issues
sudo systemctl stop nginx || true

# 3. Obtain certificate via standalone authenticator and configure Nginx installer
sudo certbot --authenticator standalone --installer nginx --non-interactive --agree-tos --email arnavticku@gmail.com -d vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com || true

# 4. Start Nginx back up with SSL configured
sudo systemctl start nginx

# 5. Reload Nginx to securely apply the changes
sudo systemctl reload nginx

# 6. Create a cron job to automatically renew the certificate before it expires
echo "0 0,12 * * * root certbot renew --pre-hook \"systemctl stop nginx\" --post-hook \"systemctl start nginx\" --deploy-hook \"systemctl reload nginx\"" | sudo tee /etc/cron.d/certbot_renew
sudo chmod 644 /etc/cron.d/certbot_renew