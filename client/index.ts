import { IPublishPacket, MqttClient, connect as mqttConnect } from "mqtt";
import * as ApexCharts from "apexcharts";
import { temperatureSettings } from "./settings/temperature";
import { humiditySettings } from "./settings/humidity";

interface IMqttConnectionHandler {
  handleTopicSubscriptions(): void;
  handleSensorData(): void;
}

abstract class MqttConnection {
  name: string;
  createdAt: string;
  client: MqttClient;
  chart: ApexCharts;

  constructor(connectionName: string, websocketUrl: string, chart: ApexCharts) {
    this.name = connectionName;
    this.createdAt = new Date().toUTCString();
    this.client = mqttConnect(websocketUrl);
    this.chart = chart;
  }

  renderChart() {
    this.chart.render();
  }
}

class HumidityMqttConnection extends MqttConnection 
  implements IMqttConnectionHandler
{
  handleTopicSubscriptions(): void {
    this.client.subscribe("sensor/humidity");
  }

  handleSensorData(): void {
    const humidityData: any = [];

    this.client.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        humidityData.push([
          JSON.parse(packet.payload.toString("utf-8")).timestamp,
          Math.floor(JSON.parse(packet.payload.toString("utf-8")).value),
        ]);

        this.chart.updateSeries([{ data: humidityData}])
      }
    );
  }
}

class TemperatureMqttConnection
  extends MqttConnection
  implements IMqttConnectionHandler
{
  handleTopicSubscriptions(): void {
    this.client.subscribe("sensor/temperature");
  }

  handleSensorData(): void {
    const temperatureData: any = [];

    this.client.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        temperatureData.push([
          JSON.parse(packet.payload.toString("utf-8")).timestamp,
          Math.floor(JSON.parse(packet.payload.toString("utf-8")).value),
        ]);

        this.chart.updateSeries([{ data: temperatureData}])
      } 
    );
  }
}

const humidityConnection = new HumidityMqttConnection(
  "My Humidity Data over Websocket",
  "ws://localhost:8083/mqtt",
  new ApexCharts(document.querySelector("#humidityChart"), humiditySettings)
);

const temperatureConnection = new TemperatureMqttConnection(
  "My Temperature Data over Websocket",
  "ws://localhost:8083/mqtt",
  new ApexCharts(document.querySelector("#temperatureChart"), temperatureSettings)
);

humidityConnection.renderChart();
temperatureConnection.renderChart();

const nodes: IMqttConnectionHandler[] = [];
nodes.push(humidityConnection);
nodes.push(temperatureConnection);

nodes.forEach((connection) => {
  connection.handleTopicSubscriptions();
  connection.handleSensorData();
});
