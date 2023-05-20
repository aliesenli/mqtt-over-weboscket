import { IPublishPacket, MqttClient, connect as mqttConnect } from "mqtt";
import * as ApexCharts from "apexcharts";
import { chartSettings } from "./settings/chartSettings";
import { BehaviorSubject, combineLatest } from "rxjs";

const availableTopics: ITopicData[] = [
  { device: "DHT11", topic: "sensor/temperature" },
  { device: "DHT11", topic: "sensor/humidity" },
];

const humidityObservable = new BehaviorSubject<ISensorData[]>([
  {
    type: "Humidity",
    value: 55,
    timestamp: Math.floor(new Date().getTime() / 1000.0) - 10,
  },
  {
    type: "Humidity",
    value: 60,
    timestamp: Math.floor(new Date().getTime() / 1000.0) - 5,
  },
]);

const temperatureObservable = new BehaviorSubject<ISensorData[]>([
  {
    type: "Temperature",
    value: 25,
    timestamp: Math.floor(new Date().getTime() / 1000.0) - 10,
  },
  {
    type: "Temperature",
    value: 27,
    timestamp: Math.floor(new Date().getTime() / 1000.0) - 5,
  },
]);

interface ITopicData {
  device: string;
  topic: string;
}

interface ISensorData {
  type: string;
  value: number;
  timestamp: number;
}

interface IMqttConnectionHandler {
  subscribeAllTopics(topics: ITopicData[]): void;
  handleSensorData(): void;
  renderChart(): void;
}

abstract class MqttConnection implements IMqttConnectionHandler {
  public name: string;
  public createdAt: string;
  public mqttClient: MqttClient;
  public chart: ApexCharts;

  constructor(connectionName: string, websocketUrl: string, chart: ApexCharts) {
    this.name = connectionName;
    this.createdAt = new Date().toUTCString();
    this.mqttClient = mqttConnect(websocketUrl);
    this.chart = chart;
  }

  public subscribeAllTopics(topics: ITopicData[]): void {
    topics.forEach((data) => {
      this.mqttClient.subscribe(data.topic);
    });
  }

  public handleSensorData(): void {
    this.mqttClient.on(
      "message",
      (topic: string, _message: Buffer, packet: IPublishPacket) => {
        console.log(`${topic} ${packet.payload}`);

        switch (topic) {
          case "sensor/temperature":
            const temperatureData: ISensorData = {
              type: JSON.parse(packet.payload.toString("utf-8")).type,
              timestamp: JSON.parse(packet.payload.toString("utf-8")).timestamp,
              value: Math.floor(
                JSON.parse(packet.payload.toString("utf-8")).value
              ),
            };

            temperatureObservable.next(
              temperatureObservable.value.concat(temperatureData)
            );
            break;

          case "sensor/humidity":
            const humidityData: ISensorData = {
              type: JSON.parse(packet.payload.toString("utf-8")).type,
              timestamp: JSON.parse(packet.payload.toString("utf-8")).timestamp,
              value: Math.floor(
                JSON.parse(packet.payload.toString("utf-8")).value
              ),
            };

            humidityObservable.next(
              humidityObservable.value.concat(humidityData)
            );
            break;
        }
      }
    );
  }

  renderChart(): void {
    this.chart.render();
  }
}

class CustomMqttConnection extends MqttConnection {
  subscribeTemperatureTopic(): void {
    this.mqttClient.subscribe("sensor/temperature");
  }

  unsubscribeTemperatureTopic(): void {
    this.mqttClient.unsubscribe("sensor/temperature");
  }

  subscribeHumiditiyTopic(): void {
    this.mqttClient.subscribe("sensor/humidity");
  }

  unsubscribeHumiditiyTopic(): void {
    this.mqttClient.unsubscribe("sensor/humidity");
  }
}

const customConnection = new CustomMqttConnection(
  "My custom sensor data over websocket",
  "ws://localhost:8083/mqtt",
  new ApexCharts(document.querySelector("#sensorChart"), chartSettings)
);

const connections: MqttConnection[] = [];
connections.push(customConnection);

connections.forEach((connection) => {
  connection.subscribeAllTopics(availableTopics);
  connection.handleSensorData();
  connection.renderChart();

  combineLatest([temperatureObservable, humidityObservable]).subscribe(
    ([temperatureData, humidityData]) => {
      // Trim the arrays to a maximum length
      const maxLength = 10;
      const trimmedTemperatureData = temperatureData.slice(-maxLength);
      const trimmedHumidityData = humidityData.slice(-maxLength);

      connection.chart.updateSeries([
        {
          data: trimmedTemperatureData.map((item) => ({
            x: item.timestamp,
            y: item.value,
          })),
        },
        {
          data: trimmedHumidityData.map((item) => ({
            x: item.timestamp,
            y: item.value,
          })),
        },
      ]);
    }
  );
});

const temperatureSubBox = document.getElementById("temperatureSubscription");
temperatureSubBox?.addEventListener("change", (e: Event) => {
  const event = e.target as HTMLInputElement;
  if (event.checked) {
    customConnection.subscribeTemperatureTopic();
  } else {
    customConnection.unsubscribeTemperatureTopic();
  }
});

const humiditySubBox = document.getElementById("humiditySubscription");
humiditySubBox?.addEventListener("change", (e: Event) => {
  const event = e.target as HTMLInputElement;
  if (event.checked) {
    customConnection.subscribeHumiditiyTopic();
  } else {
    customConnection.unsubscribeHumiditiyTopic();
  }
});
