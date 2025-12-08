import random
from datetime import datetime, timedelta
import sys
import os
from sqlalchemy import text

# Ensure backend directory is in python path to load app/models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import get_db, SensorData


def get_user_id():
    """
    Prompts user to enter their Supabase user ID (UUID).
    You can find this in Supabase Dashboard > Authentication > Users
    """
    print("\n--- User ID Required ---")
    print("Find your User ID in Supabase Dashboard > Authentication > Users")
    print("(It looks like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)")
    print("")
    
    user_id = input("Enter User ID (or press Enter for anonymous data): ").strip()
    
    if user_id:
        print(f"✓ Will seed data for user: {user_id}")
        return user_id
    else:
        print("⚠️  No user ID provided. Data will be anonymous (user_id=None)")
        return None

def reset_database(db):
    """
    Clears all data from the sensor_data table and resets the ID counter.
    This effectively "factory resets" the history.
    """
    print("WARNING: Clearing all existing sensor data...")
    try:
        # TRUNCATE is faster than DELETE and reclaims space immediately
        # RESTART IDENTITY resets the auto-increment primary key to 1
        db.execute(text("TRUNCATE TABLE sensor_data RESTART IDENTITY;"))
        db.commit()
        print("✓ Database successfully cleared.")
    except Exception as e:
        print(f"✗ Failed to clear database: {e}")
        db.rollback()
        sys.exit(1)



def generate_historical_data(days=2):
    """
    Generates mock historical sensor data for the past 'days'.
    
    Pattern:
    - Creates entries every 20 minutes (72 readings/day)
    - Simulates Day (Warm/Dry) vs Night (Cool/Humid) cycles
    - Injects specific "Archive Events" for testing (e.g. Danger spike 5 hours ago)
    """
    # 1. GET USER ID
    target_user_id = get_user_id()
    
    print(f"--- Seeding History Data ({days} days) for User ID: {target_user_id} ---")
    
    app = create_app()
    
    with app.app_context():
        db = get_db()
        
        # 2. CLEAN SLATE
        reset_database(db)
        
        # 3. GENERATE NEW DATA
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        current_time = start_time
        
        record_count = 0
        records_to_insert = []
        
        # Data generation settings
        interval_minutes = 20 # Logs every 20 mins
        
        print(f"Generating realistic patterns from {start_time.strftime('%Y-%m-%d %H:%M')} to Now...")
        
        while current_time <= end_time:
            # Determine time of day (0-23)
            hour = current_time.hour
            is_daytime = 6 <= hour <= 18
            
            # --- WEATHER PATTERN MATH ---
            # Temperature follows a curve: Peak at 14:00, Low at 04:00
            # Simple simulation using base + random variance
            if is_daytime:
                base_temp = 26.0 + (hour - 6) * 0.5 # Warming up
                base_humid = 60.0 - (hour - 6) * 1.5 # Drying out
            else:
                base_temp = 22.0 # Cooler night
                base_humid = 75.0 # Humid night
                
            # Add randomness (Jitter)
            temp = round(base_temp + random.uniform(-1.5, 2.5), 2)
            humidity = round(base_humid + random.uniform(-5.0, 5.0), 2)
            
            # Base CO is healthy (0-10 PPM)
            co_level = random.randint(2, 12)
            
            # --- INJECT SCENARIOS FOR TESTING ---
            
            # Scenario 1: Brief Danger Spike 3 hours ago
            time_diff = (end_time - current_time).total_seconds() / 3600
            if 2.8 <= time_diff <= 3.2: 
                co_level = random.randint(60, 90) # DANGER ZONE
                print(f"  > Injecting DANGER event at {current_time.strftime('%H:%M')}")
                
            # Scenario 2: Warning Level 12 hours ago
            elif 11.5 <= time_diff <= 12.5:
                temp += 10 # Hot spike
                print(f"  > Injecting HEAT WARNING event at {current_time.strftime('%H:%M')}")
            
            # Create Object
            record = SensorData(
                temperature=temp,
                humidity=humidity,
                co_level=co_level,
                recorded_at=current_time,
                user_id=target_user_id
            )
            records_to_insert.append(record)
            
            current_time += timedelta(minutes=interval_minutes)
            record_count += 1

        # Bulk save is faster
        try:
            db.add_all(records_to_insert)
            db.commit()
            print(f"✓ Successfully seeded {record_count} new records.")
            print("--- Ready for Archives Testing ---")
        except Exception as e:
            print(f"✗ Error saving records: {e}")
            db.rollback()
        finally:
            db.close()

if __name__ == "__main__":
    # Can pass number of days as arg, e.g., "python seed_history.py 7"
    days_to_seed = 2
    if len(sys.argv) > 1:
        try:
            days_to_seed = int(sys.argv[1])
        except ValueError:
            pass
            
    generate_historical_data(days_to_seed)
