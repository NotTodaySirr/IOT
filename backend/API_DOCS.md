# Backend API Documentation

**Base URL**: `http://localhost:5000` (default)

## 1. Real-Time Streaming
**Endpoint**: `GET /stream`
- **Description**: Opens a persistent connection for Server-Sent Events (SSE). Pushes data immediately upon arrival.
- **Input**: None
- **Response**: Stream of text events.
  ```text
  data: {"temperature": 24.5, "humidity": 60.2, "co_level": 5, "timestamp": "2023-10-27T10:00:01"}
  
  data: {"temperature": 24.5, "humidity": 60.1, ...}
  ```

## 2. Historical Data
**Endpoint**: `GET /history`
- **Description**: Fetches past sensor data. Supports both **Pagination** (for Tables) and **Range Limits** (for Charts).

### Mode A: Pagination (For Tables)
- **Input (Query Params)**:
  - `page` (int): The page number (e.g., `1`).
  - `per_page` (int): Rows per page (default `20`).
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 105,
        "temperature": 24.5,
        "humidity": 60.0,
        "co_level": 8,
        "recorded_at": "2023-10-27T10:00:00"
      },
      ...
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 1450,
      "pages": 73
    }
  }
  ```

### Mode B: Range/Limit (For Charts)
- **Input (Query Params)**:
  - `limit` (int): Max records to return (default `100`).
  - `start` (string): Start timestamp (ISO format).
  - `end` (string): End timestamp (ISO format).
- **Response**:
  ```json
  {
    "success": true,
    "count": 100,
    "data": [ ... ]
  }
  ```

## 3. Current Reading
**Endpoint**: `GET /current`
- **Description**: Gets the single most recent reading. Prefers in-memory cache for speed.
- **Input**: None
- **Response**:
  ```json
  {
    "success": true,
    "source": "memory",  // or "database"
    "data": {
      "temperature": 24.5,
      "humidity": 60.0,
      "co_level": 8,
      "is_hazardous": false,
      "timestamp": "..."
    }
  }
  ```

## 4. Device Control
**Endpoint**: `POST /control`
- **Description**: Sends a command to the ESP32 via MQTT.
- **Input (JSON Body)**:
  ```json
  {
    "device": "fan",     // Options: "fan", "heater", "purifier"
    "action": "on"       // Options: "on", "off"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Command sent: FAN_ON",
    "device": "fan",
    "action": "on"
  }
  ```

## 5. System Health
**Endpoint**: `GET /health`
- **Input**: None
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "ECS Backend API",
    "version": "1.0.0"
  }
  ```
