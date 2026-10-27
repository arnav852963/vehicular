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

# 7. Create a systemd service so SSL is restored automatically if AWS reboots the server
sudo tee /etc/systemd/system/eb-ssl-restore.service > /dev/null <<EOF
[Unit]
Description=Restore SSL on Elastic Beanstalk Reboot
After=nginx.service

[Service]
Type=oneshot
ExecStart=/var/app/current/.platform/hooks/postdeploy/01_get_certificate.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable eb-ssl-restore.service || true

