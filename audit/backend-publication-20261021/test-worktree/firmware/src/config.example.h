#pragma once
// Copy to aerosense_config.h. Never publish your populated file.
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define AP_PASSWORD "change-this-password"
#define API_KEY "replace-with-32-random-characters"
#define CLOUD_URL "" // e.g. https://your-server.example; empty disables upload
#define CLOUD_DEVICE_KEY "replace-device-key"
#define CLOUD_CA_PEM "" // PEM root certificate, mandatory for HTTPS
#define ALLOW_LAN_HTTP false // explicitly true ONLY for private LAN development
#define BOARD_VALIDATED false // set only after checking schematic, power, ADC timing and LED waveforms
