import { IPublishPacket, MqttClient, connect as mqttConnect } from "mqtt";
import * as ApexCharts from "apexcharts";
import { chartSettings } from "./settings/chartSettings";

interface IMqttConnectionHandler {
  handleTopicSubscriptions(): void;
  handleSensorData(): void;
  renderChart(): void;
}

interface ISensorData {
  type: number;
  value: number;
  timestamp: number;
}

abstract class MqttConnection implements IMqttConnectionHandler {
  name: string;
  createdAt: string;
  mqttClient: MqttClient;
  chart: ApexCharts;

  constructor(connectionName: string, websocketUrl: string, chart: ApexCharts) {
    this.name = connectionName;
    this.createdAt = new Date().toUTCString();
    this.mqttClient = mqttConnect(websocketUrl);
    this.chart = chart;
  }

  abstract handleTopicSubscriptions(): void;

  public handleSensorData(): void {
    const sensorData: ISensorData[][] = [[], []];

    this.mqttClient.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        switch (topic) {
          case 'sensor/temperature':
            sensorData[0].push({
              type: JSON.parse(packet.payload.toString("utf-8")).type,
              timestamp: JSON.parse(packet.payload.toString("utf-8")).timestamp,
              value: Math.floor(JSON.parse(packet.payload.toString("utf-8")).value)
            })

            break;

          case 'sensor/humidity':
            sensorData[1].push({
              type: JSON.parse(packet.payload.toString("utf-8")).type,
              timestamp: JSON.parse(packet.payload.toString("utf-8")).timestamp,
              value: Math.floor(JSON.parse(packet.payload.toString("utf-8")).value)
            })

            break;
        }

        this.chart.updateSeries([
          {
            data: sensorData[0].map((item) => ({
              x: item.timestamp,
              y: item.value
            }))
          },
          {
            data: sensorData[1].map((item) => ({
              x: item.timestamp,
              y: item.value
            }))
          }
        ]);
      }
    );
  }

  renderChart(): void {
    this.chart.render();
  }
}

class CustomMqttConnection extends MqttConnection {
  handleTopicSubscriptions(): void {
    this.mqttClient.subscribe("sensor/humidity");
    this.mqttClient.subscribe("sensor/temperature");
  }
}

const customConnection = new CustomMqttConnection(
  "My custom sensor data over websocket",
  "ws://localhost:8083/mqtt",
  new ApexCharts(document.querySelector("#sensorChart"), chartSettings)
);

const connection: MqttConnection[] = [];
connection.push(customConnection);

connection.forEach((conn) => {
  conn.renderChart();
  conn.handleTopicSubscriptions();
  conn.handleSensorData();
});
