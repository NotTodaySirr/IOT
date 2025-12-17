/**
 * @file LCD_I2C_Wire1.h
 * @brief Custom LCD class for I2C communication using Wire1 bus.
 * 
 * The standard LiquidCrystal_I2C library only works with the default Wire bus.
 * This custom implementation allows using a second LCD on the Wire1 (I2C Bus 1).
 * 
 * Compatible with standard HD44780 LCD controllers with PCF8574 I2C backpack.
 */

#ifndef LCD_I2C_WIRE1_H
#define LCD_I2C_WIRE1_H

#include <Arduino.h>
#include <Wire.h>

/**
 * @class LCD_I2C_Wire1
 * @brief A class to control I2C LCD displays on Wire1 bus.
 * 
 * This class provides methods to initialize and control an LCD display
 * connected via I2C on the Wire1 bus (secondary I2C). It implements
 * the standard 4-bit communication protocol used by HD44780 controllers.
 */
class LCD_I2C_Wire1 {
private:
    uint8_t _addr;          // I2C address of the LCD (typically 0x27 or 0x3F)
    uint8_t _cols;          // Number of columns (e.g., 16 or 20)
    uint8_t _rows;          // Number of rows (e.g., 2 or 4)
    uint8_t _backlightval;  // Backlight state (0x08 = on, 0x00 = off)
    
    /**
     * @brief Write data to the I2C expander (PCF8574).
     * 
     * Sends a byte to the I2C expander chip, which controls the LCD pins.
     * The backlight bit is OR'd with the data.
     * 
     * @param data The byte to send to the expander
     */
    void expanderWrite(uint8_t data) {
        Wire1.beginTransmission(_addr);
        Wire1.write((int)(data) | _backlightval);
        Wire1.endTransmission();
    }
    
    /**
     * @brief Pulse the Enable pin to latch data into the LCD.
     * 
     * The LCD reads data on the falling edge of the Enable pin.
     * This function creates the necessary pulse timing.
     * 
     * @param data The current data byte with control bits
     */
    void pulseEnable(uint8_t data) {
        expanderWrite(data | 0x04);   // Enable HIGH (bit 2)
        delayMicroseconds(1);         // Hold time
        expanderWrite(data & ~0x04);  // Enable LOW
        delayMicroseconds(50);        // Command execution time
    }
    
    /**
     * @brief Write 4 bits to the LCD in 4-bit mode.
     * 
     * In 4-bit mode, data is sent as two 4-bit nibbles.
     * This function sends one nibble and pulses Enable.
     * 
     * @param value The 4-bit value to write (upper nibble of the byte)
     */
    void write4bits(uint8_t value) {
        expanderWrite(value);
        pulseEnable(value);
    }
    
    /**
     * @brief Send a byte to the LCD as two 4-bit nibbles.
     * 
     * Splits the byte into upper and lower nibbles and sends
     * them sequentially. The mode determines if it's a command
     * or data write.
     * 
     * @param value The byte to send
     * @param mode 0x00 for command, 0x01 for data (RS pin state)
     */
    void send(uint8_t value, uint8_t mode) {
        uint8_t highnib = value & 0xF0;           // Upper 4 bits
        uint8_t lownib = (value << 4) & 0xF0;     // Lower 4 bits shifted up
        write4bits((highnib) | mode);
        write4bits((lownib) | mode);
    }
    
    /**
     * @brief Send a command to the LCD.
     * 
     * Commands control LCD functions like clear, cursor position, etc.
     * RS pin is LOW for commands.
     * 
     * @param value The command byte to send
     */
    void command(uint8_t value) {
        send(value, 0);  // RS = 0 for command
    }

public:
    /**
     * @brief Constructor for LCD_I2C_Wire1.
     * 
     * @param addr I2C address of the LCD (usually 0x27 or 0x3F)
     * @param cols Number of columns (16 or 20)
     * @param rows Number of rows (2 or 4)
     */
    LCD_I2C_Wire1(uint8_t addr, uint8_t cols, uint8_t rows) {
        _addr = addr;
        _cols = cols;
        _rows = rows;
        _backlightval = 0x08;  // Backlight ON by default
    }
    
    /**
     * @brief Initialize the LCD display.
     * 
     * Performs the initialization sequence required by HD44780:
     * 1. Wait for power stabilization
     * 2. Set 4-bit mode (requires special sequence)
     * 3. Configure display settings
     * 4. Clear display and set entry mode
     * 
     * Must be called after Wire1.begin() in setup().
     */
    void init() {
        delay(50);  // Wait for LCD power-up
        expanderWrite(_backlightval);
        delay(1000);
        
        // --- 4-bit initialization sequence (per HD44780 datasheet) ---
        // These specific values and timings are required by the LCD controller
        write4bits(0x30);           // Function set (8-bit mode)
        delayMicroseconds(4500);
        write4bits(0x30);           // Repeat
        delayMicroseconds(4500);
        write4bits(0x30);           // Repeat
        delayMicroseconds(150);
        write4bits(0x20);           // Set to 4-bit mode
        
        // --- Configure LCD settings ---
        command(0x28);  // Function set: 4-bit, 2 lines, 5x8 font
        command(0x0C);  // Display ON, cursor OFF, blink OFF
        command(0x01);  // Clear display
        delayMicroseconds(2000);
        command(0x06);  // Entry mode: increment cursor, no shift
    }
    
    /**
     * @brief Turn on the LCD backlight.
     */
    void backlight() {
        _backlightval = 0x08;
        expanderWrite(0);
    }
    
    /**
     * @brief Turn off the LCD backlight.
     */
    void noBacklight() {
        _backlightval = 0x00;
        expanderWrite(0);
    }
    
    /**
     * @brief Clear the LCD display and return cursor to home.
     */
    void clear() {
        command(0x01);
        delayMicroseconds(2000);  // Clear command takes ~1.52ms
    }
    
    /**
     * @brief Set the cursor position.
     * 
     * @param col Column position (0-based, 0 to cols-1)
     * @param row Row position (0-based, 0 to rows-1)
     */
    void setCursor(uint8_t col, uint8_t row) {
        // Row offsets for standard LCD memory layout
        int row_offsets[] = { 0x00, 0x40, 0x14, 0x54 };
        command(0x80 | (col + row_offsets[row]));
    }
    
    /**
     * @brief Print a null-terminated string to the LCD.
     * 
     * @param str The string to print
     */
    void print(const char* str) {
        while (*str) {
            send(*str++, 0x01);  // RS = 1 for data
        }
    }
    
    /**
     * @brief Print a floating-point number with specified decimals.
     * 
     * @param val The float value to print
     * @param decimals Number of decimal places
     */
    void print(float val, int decimals) {
        char buf[16];
        dtostrf(val, 1, decimals, buf);
        print(buf);
    }
    
    /**
     * @brief Print an integer value.
     * 
     * @param val The integer to print
     */
    void print(int val) {
        char buf[16];
        itoa(val, buf, 10);
        print(buf);
    }
    
    /**
     * @brief Print formatted text (like printf).
     * 
     * @param format Printf-style format string
     * @param ... Variable arguments matching format specifiers
     */
    void printf(const char* format, ...) {
        char buf[32];
        va_list args;
        va_start(args, format);
        vsnprintf(buf, sizeof(buf), format, args);
        va_end(args);
        print(buf);
    }
};

#endif // LCD_I2C_WIRE1_H
