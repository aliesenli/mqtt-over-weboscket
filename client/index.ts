import { IPublishPacket, MqttClient, connect as mqttConnect } from "mqtt";
import * as ApexCharts from "apexcharts";
import { chartSettings } from "./settings/chartsettings";

var chart = new ApexCharts(
  document.querySelector("#temperatureChart"),
  chartSettings
);

chart.render();

interface IMqttConnection {
  name: string;
  createdAt: string;
  client: MqttClient;
}

abstract class MqttConnection implements IMqttConnection {
  name: string;
  createdAt: string;
  client: MqttClient;

  constructor(connectionName: string, websocketUrl: string) {
    this.name = connectionName;
    this.createdAt = new Date().toUTCString();
    this.client = mqttConnect(websocketUrl);
  }
}

class SensorMqttConnection extends MqttConnection {
  handleTopicSubscriptions(): void {
    this.client.subscribe("sensor/temperature");
    this.client.subscribe("sensor/humidity");
  }

  handleSensorData(): void {
    const humidityData: any = [];
    const temperatureData: any = [];

    this.client.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        if (topic === "sensor/humidity") {
          humidityData.push([
            JSON.parse(packet.payload.toString("utf-8")).timestamp,
            Math.floor(JSON.parse(packet.payload.toString("utf-8")).value),
          ]);
        }

        if (topic === "sensor/temperature") {
          temperatureData.push([
            JSON.parse(packet.payload.toString("utf-8")).timestamp,
            Math.floor(JSON.parse(packet.payload.toString("utf-8")).value),
          ]);
        }

        chart.updateSeries([{ data: humidityData }, { data: temperatureData }]);
      }
    );
  }
}

const mqttConnection = new SensorMqttConnection(
  "My very first connection",
  "ws://localhost:8083/mqtt"
);

mqttConnection.handleTopicSubscriptions();
mqttConnection.handleSensorData();
