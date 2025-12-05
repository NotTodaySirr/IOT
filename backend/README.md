# ECS Backend - Environment Control System

Backend server for the Environment Control System (ECS) IoT project. Built with Flask, PostgreSQL (SQLAlchemy ORM), and MQTT for real-time sensor monitoring and device control.

## 📁 Project Structure

```
backend/
├── app.py                      # Main application entry point
├── config.py                   # Configuration and environment variables
├── requirements.txt            # Python dependencies
├── schema.sql                  # Database schema
├── .env.example               # Environment variables template
│
├── api/                        # REST API routes
│   ├── __init__.py            # Blueprint initialization
│   └── routes.py              # API endpoints
│
└── models/                     # Database models
    ├── __init__.py            # Package exports
    ├── database.py            # SQLAlchemy setup
    ├── sensor_data.py         # SensorData model
    └── user.py                # User model
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up PostgreSQL Database

**Option A: Local PostgreSQL (Development)**

Install PostgreSQL and create a database:

```bash
# On Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb ecs_db

# Run schema
psql -U postgres -d ecs_db -f schema.sql
```

**Option B: Docker (Recommended)**

```bash
# Start PostgreSQL in Docker
docker run --name ecs-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecs_db \
  -p 5432:5432 \
  -d postgres:15
  
# Run schema (after container is running)
docker exec -i ecs-postgres psql -U postgres -d ecs_db < schema.sql
```

**Option C: Supabase (Cloud)**

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `schema.sql`
3. Get your connection string from Project Settings → Database

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your database connection:

```env
# For local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecs_db

# For Supabase (get from Project Settings → Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 4. Run the Server

```bash
python app.py
```

The server will:
- ✓ Connect to PostgreSQL
- ✓ Create tables automatically (if they don't exist)
- ✓ Connect to MQTT broker
- ✓ Start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

### Get Current Sensor Readings
```http
GET /api/current
```

### Get Historical Data
```http
GET /api/history?limit=100
```

### Control Devices
```http
POST /api/control
Content-Type: application/json

{
  "device": "fan",
  "action": "on"
}
```

## 🗄️ Database Schema

### sensor_data Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key (auto-increment) |
| `timestamp` | TIMESTAMP | Auto-generated timestamp |
| `temperature` | FLOAT | Temperature in °C |
| `humidity` | FLOAT | Humidity percentage |
| `co_level` | FLOAT | CO level (ppm) |
| `is_hazardous` | BOOLEAN | True if CO > 50 ppm |

### users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `username` | VARCHAR(50) | Unique username |
| `password_hash` | VARCHAR(255) | Hashed password |

## 🔌 MQTT Integration

The backend automatically connects to the MQTT broker and:

- **Subscribes** to `ecs/upload` - Receives sensor data from ESP32
- **Publishes** to `ecs/control` - Sends control commands to ESP32

### Expected Sensor Data Format

```json
{
  "temperature": 24.5,
  "humidity": 60.0,
  "co_level": 12.5
}
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | postgresql://postgres:postgres@localhost:5432/ecs_db | PostgreSQL connection string |
| `FLASK_PORT` | 5000 | Server port |
| `MQTT_BROKER` | broker.hivemq.com | MQTT broker address |

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Get current readings
curl http://localhost:5000/api/current

# Get history
curl http://localhost:5000/api/history?limit=10

# Control a device
curl -X POST http://localhost:5000/api/control \
  -H "Content-Type: application/json" \
  -d '{"device": "fan", "action": "on"}'
```

## 🔧 Development Workflow

```
1. Develop locally with PostgreSQL (Docker)
2. Test with local MQTT broker
3. Deploy to production (Supabase + Cloud MQTT)
4. Just change DATABASE_URL - no code changes needed!
```

## 📝 Key Features

✅ **Portable**: Works with any PostgreSQL database  
✅ **Local Development**: No internet required  
✅ **Auto-Migration**: Tables created automatically on startup  
✅ **Clean ORM**: SQLAlchemy models with proper session management  
✅ **Easy Deployment**: Change DATABASE_URL to switch environments  

## 🛠️ Troubleshooting

**Q: "Failed to initialize database" error**  
A: Check your DATABASE_URL is correct and PostgreSQL is running.

**Q: Tables not created**  
A: Run `schema.sql` manually or restart the app - tables are auto-created.

**Q: How do I migrate to Supabase?**  
A: Just change DATABASE_URL to your Supabase connection string!
