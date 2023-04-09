const express = require("express");
const app = express();
const http = require("http").createServer(app);
const moment = require("moment");
const mqtt = require("mqtt");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

app.use(express.static("client"));
app.use(express.static("dist"));

const webserverPort = 3000;
const mqttBrokerUrl = "mqtt://myemqxbroker:1883";
const mqttClient = mqtt.connect(mqttBrokerUrl);

interface ISensorData {
  type: string;
  value: number | string;
  timestamp: number;
}

interface ISerialPortPublisher {
  serialPath: string;
  baudrate: number;
  parserEnabled: boolean;
}

// Lookup Record for emitting sensor data
const sensorTypes: Record<string, (data: string) => ISensorData> = {
  Temperature: (data: string) => ({
    type: "Temperature",
    value: parseFloat(data.replace("Temperature: ", "")),
    timestamp: moment().unix(),
  }),
  Humidity: (data: string) => ({
    type: "Humidity",
    value: parseFloat(data.replace("Humidity: ", "")),
    timestamp: moment().unix(),
  }),
};

class SerialPortPublisher implements ISerialPortPublisher {
  serialPath: string;
  baudrate: number;
  parserEnabled: boolean;

  constructor(path: string, baudrate: number, parserEnabled: boolean) {
    this.serialPath = path;
    this.baudrate = baudrate;
    this.parserEnabled = parserEnabled;
  }

  setup(): void {
    let serialClient = new SerialPort({
      path: this.serialPath,
      baudRate: this.baudrate,
    });

    if (this.parserEnabled) {
      serialClient = serialClient.pipe(
        new ReadlineParser({ delimiter: "\r\n" })
      );
    }

    serialClient.on("data", (data: string) => {
      emitSensorData(data);
    });
  }
}

// Emit data through MQTT
function emitSensorData(data: string) {
  for (const sensorType in sensorTypes) {
    if (data.includes(sensorType)) {
      const sensorData = sensorTypes[sensorType](data);
      const topicName = `sensor/${sensorData.type.toLowerCase()}`;
      mqttClient.publish(topicName, Buffer.from(JSON.stringify(sensorData)));
      console.log(
        `Message published to topic: ${topicName} ${sensorData.value}`
      );
      break;
    }
  }
}

const publisher = new SerialPortPublisher("/dev/ttyACM0", 9600, true);
publisher.setup();

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

http.listen(webserverPort, () => {
  console.log(`Listening on localhost:${webserverPort}`);
});
