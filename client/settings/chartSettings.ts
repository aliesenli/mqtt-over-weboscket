export const chartSettings = {
  series: [
    {
      name: "Humidity",
      data: [0],
    },
    {
      name: "Temperature",
      data: [0]
    }
  ],
  chart: {
    height: 350,
    type: "area",
  },
  dataLabels: {
    enabled: true,
  },
  stroke: {
    curve: "smooth",
  },

  markers: {
    size: 4,
  },
  xaxis: {
    type: "datetime",
    categories: [],
    range: 30,
    labels: {
      rotateAlways: true,
      rotate: -30,
      offsetX: 15,
      offsetY: 10,
      formatter: function (value: any) {
        return new Date(value * 1000).toLocaleTimeString();
      },
    },
    axisBorder: {
      color: "#78909C",
    },
    axisTicks: {
      color: "#78909C",
    },
  },
  tooltip: {
    x: {
      format: "dd/MM/yy HH:mm",
    },
  },
};
