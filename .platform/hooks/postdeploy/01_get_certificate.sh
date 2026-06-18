#!/bin/bash

# 1. Install Certbot packages natively on Amazon Linux 2023
sudo dnf install -y certbot python3-certbot-nginx

# 2. Run certbot to request the certificate and let it automatically modify Nginx configuration natively
sudo certbot --nginx --non-interactive --agree-tos --email arnavticku@gmail.com -d vehicular-app-env.eba-tchumtwm.ap-southeast-2.elasticbeanstalk.com

# 3. Reload Nginx to securely apply the changes
sudo systemctl reload nginx