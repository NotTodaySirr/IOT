#include <Wire.h>

#define I2C_SDA 8   // Same as your main.cpp
#define I2C_SCL 9   // Same as your main.cpp

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL);
  
  Serial.println("\n\nI2C Scanner");
  Serial.println("Scanning...");
  
  byte count = 0;
  
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println("  !");
      count++;
    }
    else if (error == 4) {
      Serial.print("Unknown error at address 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  
  if (count == 0)
    Serial.println("No I2C devices found\n");
  else
    Serial.println("Scan complete\n");
}

void loop() {
  // Run scan once every 5 seconds
  delay(5000);
  setup();
}
