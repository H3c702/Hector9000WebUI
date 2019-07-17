## **Hector9000WEBUI**

#### Usage:

**For Testing without MQTT-Server:**

Set JS-Variables:  
```javascript
testingmain = true;
testingdrinks = true;
```

* Setting the `testingmain` variable disables the mqtt connection
completely and only uses locally stored testing data 

* Setting the `testingdrinks` variable only disables the mqtt usage for
getting the drinks ingredients and uses locally stored data

**For Production/Testing with MQTT-Server:**
```javascript
testingmain = false;
testingdrinks = false;
host = %HOSTNAME%;
port = %PORTNUMBER%;
```
Make sure your MQTT-Server has Websocket support and set the 
port to the websocket port of your MQTT-Server