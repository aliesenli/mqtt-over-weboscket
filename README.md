# mqttemperature

### Simple IoT project - Pub/Sub to MQTT broker over Websocket and some charting 
<img src="https://github.com/aliesenli/mqttemperature/blob/main/doc/chart.png">

In this project I used a MQTT broker (`EMQX`). For getting Temperature and Humidity data, I used an Arduino with `DHT11` sensor. The data is read through Serialport and published to the MQTT broker running on a docker container. On the clientside the data is read over `Websocket` by subscribing to the MQTT Topic(s). 

<img src="https://github.com/aliesenli/mqttemperature/blob/main/doc/emqx-dashboard.png">

#### Prerequisites
- Linux Machine (Mapping serialports on docker containers works like a charm)
- Visual Studio Code (or similiar)
- Arduino IDE
- Node.js & NPM
- Docker and Docker Compose

#### Installation
Open Arduino IDE and Upload the .ino file to your Arduino UNO. Don't forget to adjust your serialport:

```typescript
const publisher = new SerialPortPublisher("/dev/ttyACM0", 9600, true);
publisher.setup();
```

Run the application using:

```yml
docker-compose up
```
Then visit `localhost:3000` in your browser (your Arduino has to be plugged in and running) \
EMQX Dashboard is available under: `localhost:18083` --> default login credentials: admin:public
