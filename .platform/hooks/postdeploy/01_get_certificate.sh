#!/bin/bash

DOMAIN="vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com"
EMAIL="arnavticku@gmail.com"

# 1. Install Certbot packages natively on Amazon Linux 2023
sudo dnf install -y certbot python3-certbot-nginx cronie

# 2. Stop Nginx temporarily so standalone authenticator can use Port 80 without 404/redirect issues
sudo systemctl stop nginx || true

# 3. Obtain certificate via standalone authenticator and configure Nginx installer
sudo certbot --authenticator standalone --installer nginx --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN" || sudo certbot renew || true

# 4. Start Nginx back up with SSL configured
sudo systemctl start nginx

# 5. Reload Nginx to securely apply the changes
sudo systemctl reload nginx

# 6. Configure Certbot renewal hooks so background renewals automatically handle Nginx
sudo mkdir -p /etc/letsencrypt/renewal-hooks/pre
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post

echo '#!/bin/bash' | sudo tee /etc/letsencrypt/renewal-hooks/pre/01_stop_nginx.sh
echo 'systemctl stop nginx' | sudo tee -a /etc/letsencrypt/renewal-hooks/pre/01_stop_nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/01_stop_nginx.sh

echo '#!/bin/bash' | sudo tee /etc/letsencrypt/renewal-hooks/post/01_start_nginx.sh
echo 'systemctl start nginx' | sudo tee -a /etc/letsencrypt/renewal-hooks/post/01_start_nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/01_start_nginx.sh

# 7. Enable AL2023 systemd timer and cron daemon for automatic renewal
sudo systemctl enable --now certbot-renew.timer || true
sudo systemctl enable --now crond || true

echo "0 0,12 * * * root certbot renew" | sudo tee /etc/cron.d/certbot_renew
sudo chmod 644 /etc/cron.d/certbot_renew