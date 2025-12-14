import psycopg2
import psycopg2.extras
from ai.chatbot.chatbot_config import DB_URI

def get_lastest_sensor_data():
    """
    Connects to Supabase and fetches the latest temperature, humidity, 
    and CO readings from the sensor_data table.
    """
    
    connect = None
    try:
        connect = psycopg2.connect(DB_URI)
        cursor = connect.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        query = """
        SELECT temperature, humidity, co_level
        FROM sensor_data
        ORDER BY recorded_at DESC
        LIMIT 1;
        """
        
        cursor.execute(query)
        row = cursor.fetchone()
        
        if row:
            for key, value in row.items():
                if hasattr(value, 'combine'):
                    row[key] = str(value)
                elif value is not None and not isinstance(value, str):
                    try:
                        row[key] = float(value)
                    except (ValueError, TypeError):
                        pass
            
            return row
            
        else:
            return ("error", "No data found in the database.")
        
    except Exception as e:
        return ("error", str(e))
    
    finally:
        if connect:
            connect.close()
            