import { IPublishPacket, MqttClient, connect as mqttConnect } from "mqtt";
import * as ApexCharts from "apexcharts";
import { temperatureSettings } from "./settings/temperature";
import { humiditySettings } from "./settings/humidity";

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
    const data: ISensorData[] = [];

    this.mqttClient.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        data.push({
          type: JSON.parse(packet.payload.toString("utf-8")).type,
          timestamp: JSON.parse(packet.payload.toString("utf-8")).timestamp,
          value: Math.floor(JSON.parse(packet.payload.toString("utf-8")).value),
        });

        this.chart.updateSeries([
          {
            data: data.map((item) => ({
              x: item.timestamp,
              y: item.value,
            })),
          },
        ]);
      }
    );
  }

  renderChart(): void {
    this.chart.render();
  }
}

class HumidityMqttConnection extends MqttConnection {
  handleTopicSubscriptions(): void {
    this.mqttClient.subscribe("sensor/humidity");
  }
}

class TemperatureMqttConnection extends MqttConnection {
  handleTopicSubscriptions(): void {
    this.mqttClient.subscribe("sensor/temperature");
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
  new ApexCharts(
    document.querySelector("#temperatureChart"),
    temperatureSettings
  )
);

const connection: MqttConnection[] = [];
connection.push(humidityConnection);
connection.push(temperatureConnection);

connection.forEach((conn) => {
  conn.renderChart();
  conn.handleTopicSubscriptions();
  conn.handleSensorData();
});
