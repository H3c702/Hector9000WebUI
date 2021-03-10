## **Hector9000WEBUI**

### Usage:

This frontend is tested and optimized only on a 800x480 Chromium browser. There could occur problems in other browsers / screen sizes.

To get the full experience add a `Data70.ttf` containing the Data70 font to the font directory

    JS location: js/hector9000.js

#### For Testing without MQTT-Server:

Set JS-Variable:

```javascript
var testing = true;
```

#### For Production/Testing with MQTT-Server:
```javascript
var testing = false;
var host = %HOSTNAME%;
var port = %PORTNUMBER%;
```
Make sure your MQTT-Server has Websocket support and set the 
port to the websocket port of your MQTT-Server.

To add Websocket support to the standart mosquitto MQTT-Server add:

    listener %PORTNUMBER%
    protocol websockets

to your mosquitto config file and then restart your MQTT-Server.