#!/bin/bash

# Create systemd user service directory if it doesn't exist
mkdir -p ~/.config/systemd/user/

# Create the service file
cat > ~/.config/systemd/user/Hector9000WebUI.service << EOL
[Unit]
Description=Chromium Kiosk Mode
After=graphical.target

[Service]
Type=simple
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/\${USER}/.Xauthority
ExecStart=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-translate --no-first-run --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null \${PWD}/Main.html
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOL

# Reload systemd user daemon
systemctl --user daemon-reload

# Enable the service
systemctl --user enable Hector9000WebUI.service

echo "Installation abgeschlossen. Der Browser wird nun nach jedem Login automatisch gestartet."
echo "Sie können den Service manuell starten mit: systemctl --user start Hector9000WebUI.service"
echo "Oder stoppen mit: systemctl --user stop Hector9000WebUI.service" 