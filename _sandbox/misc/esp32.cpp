#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <EmonLib.h>
#include <map>
#include <time.h>

// Production settings
// #define PRODUCTION

#ifdef PRODUCTION
const char *serverHost = "api.oee.cpec.com";
const int serverPort = 443;
#else
const char *serverHost = "192.231.64.53";
const int serverPort = 8080;
#endif

const char *ssid = "Coewave";
const char *password = "IndustryFeeder";
const int LED_PIN = 2;
const int CURRENT_PIN = 34;
const float CURRENT_CAL = 100.0;

std::map<String, int> staticIps = {
    {"AC:15:18:D7:AB:10", 200},
    {"AC:15:18:D5:3A:EC", 201},
    {"AC:15:18:D8:65:A8", 202},
    {"AC:15:18:D7:52:D0", 203},
    {"88:13:BF:62:51:A0", 204},
    {"AC:15:18:D6:BB:48", 205},
    {"CC:7B:5C:FB:EE:44", 206},
    {"AC:15:18:D7:E2:40", 207},
    {"AC:15:18:D7:5A:5C", 208},
    {"AC:15:18:D5:BF:CC", 209}};

IPAddress gateway(10, 231, 200, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);
IPAddress deviceIP;

WebSocketsClient webSocket;
EnergyMonitor emon;
String macAddress;
JsonDocument reading;

const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

void setupStaticIP()
{
  macAddress = WiFi.macAddress();
  Serial.println("MAC: " + macAddress);

  if (staticIps.find(macAddress) != staticIps.end())
  {
    deviceIP = IPAddress(10, 231, 200, staticIps[macAddress]);
    if (!WiFi.config(deviceIP, gateway, subnet, dns))
    {
      Serial.println("Static IP failed!");
    }
    Serial.println("IP: " + deviceIP.toString());
  }
}

void connectToWiFi()
{
  if (WiFi.status() == WL_CONNECTED)
    return;

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(100);
  }

  digitalWrite(LED_PIN, HIGH);
  Serial.println("Connected! IP: " + WiFi.localIP().toString());
}

void connectWebSocket()
{
#ifdef PRODUCTION
  webSocket.beginSSL(serverHost, serverPort,
                     ("/socket.io/devices/?EIO=4&transport=websocket&mac=" + macAddress + "&ip=" + deviceIP.toString()).c_str());
#else
  webSocket.begin(serverHost, serverPort,
                  ("/socket.io/devices/?EIO=4&transport=websocket&mac=" + macAddress + "&ip=" + deviceIP.toString()).c_str());
#endif
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
  case WStype_CONNECTED:
    digitalWrite(LED_PIN, HIGH);
    webSocket.sendTXT("40/devices,");
    break;

  case WStype_DISCONNECTED:
    digitalWrite(LED_PIN, LOW);
    connectWebSocket();
    break;

  case WStype_TEXT:
    if (strcmp((char *)payload, "2") == 0)
    {
      webSocket.sendTXT("3");
    }
    break;

  case WStype_ERROR:
    webSocket.disconnect();
    connectWebSocket();
    break;
  }
}

void setupTime()
{
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  Serial.println("Waiting for NTP time sync...");
  while (time(nullptr) < 1000000000)
  {
    delay(100);
  }
  Serial.println("Time synchronized!");
}

void setup()
{
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  emon.current(CURRENT_PIN, CURRENT_CAL);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.setSleep(false);

  setupStaticIP();
  connectToWiFi();
  setupTime();

  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(500);
  connectWebSocket();
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    connectToWiFi();
  }

  webSocket.loop();

  static unsigned long lastMessage = 0;
  if (millis() - lastMessage >= 1000)
  {
    double current = emon.calcIrms(1480);

    time_t now = time(nullptr);
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);

    char formatted_time[40];
    snprintf(formatted_time, sizeof(formatted_time), "%s.%03d -0400",
             timestamp, (int)(millis() % 1000));

    reading.clear();
    reading["macAddress"] = macAddress;
    reading["reading"]["value"] = current;
    reading["reading"]["timestamp"] = formatted_time;

    String readingString;
    serializeJson(reading, readingString);
    webSocket.sendTXT("42/devices,[\"reading\"," + readingString + "]");

    lastMessage = millis();
  }
}