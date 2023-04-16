// Include the libraries
#include <Adafruit_Sensor.h>
#include <DHT.h>

// Set DHT pin
#define DHTPIN 4

// Set DHT type
#define DHTTYPE DHT11     // DHT 11 
//#define DHTTYPE DHT21   // DHT 21 (AM2301)
//#define DHTTYPE DHT22   // DHT 22 (AM2302)

// Initialize DHT sensor
DHT dht = DHT(DHTPIN, DHTTYPE);

void setup() {
    // Begin serial communication at a baud rate of 9600
    Serial.begin(9600);

    // Setup sensor:
    dht.begin();
}

void loop() {
    // Wait a few seconds between measurements
    delay(4000);

    // Read the humidity in %:
    float h = dht.readHumidity();
    // Read the temperature as Celsius
    float t = dht.readTemperature();

    // Check if any reads failed and exit early (to try again)
    if (isnan(h) || isnan(t)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }
  
    Serial.print("Temperature: ");
    Serial.println(t);
    Serial.print("Humidity: ");
    Serial.println(h);
}