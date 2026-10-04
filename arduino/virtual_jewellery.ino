/* ==========================================================================
   Virtual Jewellery Wearable System - Arduino Uno R3 Sketch
   
   Hardware: Arduino Uno R3
   Baud Rate: 9600
   Supported Displays: Serial Monitor / Optional 16x2 LCD Display (I2C or Parallel)
   ========================================================================== */

// --- Optional LCD Display Support ---
// Set USE_LCD_I2C to 1 if using an I2C 16x2 LCD display module (SDA=A4, SCL=A5)
#define USE_LCD_I2C 0 

#if USE_LCD_I2C
  #include <Wire.h>
  #include <LiquidCrystal_I2C.h>
  LiquidCrystal_I2C lcd(0x27, 16, 2); // Change address to 0x3F if needed
#endif

// Status Pin Definitions
const int LED_FACE_DETECTED = 13; // Built-in LED on pin 13
const int LED_SYSTEM_READY  = 12; // Optional LED on pin 12

String inputBuffer = "";
String currentStatus = "BOOTING...";
String selectedJewellery = "NONE";

void setup() {
  // Initialize USB Serial Communication at 9600 baud
  Serial.begin(9600);

  // Initialize digital pins
  pinMode(LED_FACE_DETECTED, OUTPUT);
  pinMode(LED_SYSTEM_READY, OUTPUT);

  digitalWrite(LED_FACE_DETECTED, LOW);
  digitalWrite(LED_SYSTEM_READY, HIGH);

  #if USE_LCD_I2C
    lcd.init();
    lcd.backlight();
    displayLCD("VIRTUAL JEWELLERY", "SYSTEM READY");
  #endif

  Serial.println("==========================================");
  Serial.println(" Virtual Jewellery Hardware Controller ");
  Serial.println(" Arduino Uno R3 Ready (9600 baud)      ");
  Serial.println("==========================================");
}

void loop() {
  // Listen for incoming serial commands from browser Web Serial API
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      inputBuffer.trim();
      if (inputBuffer.length() > 0) {
        handleCommand(inputBuffer);
      }
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }
}

/**
 * Parse and execute serial commands received from browser
 */
void handleCommand(String command) {
  command.toUpperCase();

  if (command == "READY") {
    currentStatus = "CONNECTED";
    digitalWrite(LED_SYSTEM_READY, HIGH);
    printStatus("SYSTEM CONNECTED", "Awaiting Face");

  } else if (command == "FACE_DETECTED") {
    currentStatus = "FACE DETECTED";
    digitalWrite(LED_FACE_DETECTED, HIGH);
    printStatus("FACE DETECTED", selectedJewellery);

  } else if (command == "NO_FACE") {
    currentStatus = "LOOKING...";
    digitalWrite(LED_FACE_DETECTED, LOW);
    printStatus("NO FACE DETECTED", selectedJewellery);

  } else if (command == "NECKLACE_SELECTED") {
    selectedJewellery = "NECKLACE";
    printStatus(currentStatus, "NECKLACE ACTIVE");

  } else if (command == "EARRINGS_SELECTED") {
    selectedJewellery = "EARRINGS";
    printStatus(currentStatus, "EARRINGS ACTIVE");

  } else if (command == "NOSE_RING_SELECTED" || command == "NOSERING_SELECTED") {
    selectedJewellery = "NOSE RING";
    printStatus(currentStatus, "NOSE RING ACTIVE");

  } else if (command == "BINDI_SELECTED") {
    selectedJewellery = "BINDI";
    printStatus(currentStatus, "BINDI ACTIVE");

  } else if (command == "TIKKA_SELECTED") {
    selectedJewellery = "TIKKA";
    printStatus(currentStatus, "TIKKA ACTIVE");

  } else if (command == "RESET") {
    selectedJewellery = "NONE";
    digitalWrite(LED_FACE_DETECTED, LOW);
    printStatus("SYSTEM RESET", "No Items");

  } else {
    Serial.print("ACK: ");
    Serial.println(command);
  }
}

/**
 * Output status report to Serial Monitor and LCD display
 */
void printStatus(String line1, String line2) {
  Serial.print("[Arduino Display] Line 1: ");
  Serial.print(line1);
  Serial.print(" | Line 2: ");
  Serial.println(line2);

  #if USE_LCD_I2C
    displayLCD(line1, line2);
  #endif
}

/**
 * Helper to write lines to 16x2 LCD display
 */
#if USE_LCD_I2C
void displayLCD(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}
#endif
