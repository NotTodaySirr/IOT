import psycopg2
import psycopg2.extras
from ai.chatbot.chatbot_config import DB_URI

def _convert_row_floats(row):
    if not row: return None
    for key, value in row.items():
        if hasattr(value, 'combine'): # DateTime object
            row[key] = str(value)
        elif value is not None and not isinstance(value, str):
            try:
                row[key] = float(value)
            except (ValueError, TypeError):
                pass
    return row

def get_latest_sensor_data():
    """
    Fetches the latest reading in raw GMT+0 (UTC).
    """
    connect = None
    try:
        connect = psycopg2.connect(DB_URI)
        cursor = connect.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
            SELECT 
                temperature, 
                humidity, 
                co_level, 
                recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS timestamp
            FROM sensor_data 
            ORDER BY timestamp DESC 
            LIMIT 1;
        """
        
        cursor.execute(query)
        return _convert_row_floats(cursor.fetchone()) or {"error": "No data found"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if connect:
            connect.close()
            
def get_daily_average(date_str):
    """
    Calculates average for a specific day using raw GMT+0 timestamps.
    The 'date_str' passed here must already be converted to GMT+0 by the AI.
    """
    print(f"\n[DB TOOL] 'get_daily_average' triggered with date: '{date_str}'")
    connect = None
    try:
        connect = psycopg2.connect(DB_URI)
        cursor = connect.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # REMOVED: AT TIME ZONE conversion
        # ADDED: Comma before COUNT(*)
        query = """
            SELECT 
                AVG(temperature) AS avg_temperature,
                AVG(humidity) AS avg_humidity,
                AVG(co_level) AS avg_co_level,
                COUNT(*) AS data_points
            FROM sensor_data
            WHERE (recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = %s;
        """
        
        cursor.execute(query, (date_str,))
        result = _convert_row_floats(cursor.fetchone())
        # Check if result is None or empty (if no data found for that date)
        if not result or result.get('avg_temperature') is None:
             return {"error": f"No data found for date {date_str}"}
             
        result['date_queried'] = date_str
        return result
    except Exception as e:
        print(f"[DB TOOL] ❌ CRITICAL ERROR: {str(e)}")
        return {"error": str(e)}
    finally:
        if connect:
            connect.close()
            
def get_date_range_average(start_date_str, end_date_str):
    """
    Calculates average for a date range using raw GMT+0 timestamps.
    The dates passed here must already be converted to GMT+0 by the AI.
    """
    connect = None
    try:
        connect = psycopg2.connect(DB_URI)
        cursor = connect.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # REMOVED: AT TIME ZONE conversion
        query = """
            SELECT 
                AVG(temperature) AS avg_temperature,
                AVG(humidity) AS avg_humidity,
                AVG(co_level) AS avg_co_level,
                COUNT(*) AS data_points
            FROM sensor_data
            WHERE (recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= %s
            AND   (recorded_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= %s;
        """
        
        cursor.execute(query, (start_date_str, end_date_str))
        result = _convert_row_floats(cursor.fetchone())
        
        if not result or result.get('avg_temperature') is None:
             return {"error": f"No data found for range {start_date_str} to {end_date_str}"}

        result['range'] = f"{start_date_str} to {end_date_str}"
        return result
    except Exception as e:
        return {"error": str(e)}
    finally:
        if connect:
            connect.close()