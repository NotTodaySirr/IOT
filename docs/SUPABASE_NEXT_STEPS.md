# Supabase Next Steps: Backend & Database Integration

This document outlines the next steps required to complete the Supabase authentication integration on the backend and configure the database properly.

## Backend Integration

### 1. Install Supabase Python Client
```bash
cd backend
pip install supabase
```

Add to `requirements.txt`:
```
supabase==2.0.0
```

### 2. Configure Environment Variables
Add to `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> [!WARNING]
> Use the **Service Role Key** (not the anon key) for backend operations. This key has elevated privileges and should NEVER be exposed to the frontend.

### 3. Create Auth Middleware
Create `backend/middleware/auth.py`:

```python
from functools import wraps
from flask import request, jsonify
from supabase import create_client
import os

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify the JWT token
            user = supabase.auth.get_user(token)
            request.user = user  # Attach user to request
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid or expired token'}), 401
    
    return decorated_function
```

### 4. Protect API Routes
Update `backend/api/routes.py` to use the middleware:

```python
from middleware.auth import require_auth

@app.route('/api/sensor-data', methods=['GET'])
@require_auth
def get_sensor_data():
    # Access authenticated user via request.user
    user_id = request.user.id
    # ... rest of your logic
```

### 5. Send Auth Token from Frontend
Update frontend API calls to include the auth token:

```javascript
const { data: { session } } = await supabase.auth.getSession();

fetch('http://localhost:5000/api/sensor-data', {
    headers: {
        'Authorization': `Bearer ${session.access_token}`
    }
});
```

## Database Configuration

### Option 1: Use Supabase Auth Users Table
Supabase automatically creates an `auth.users` table. You can reference it in your schema:

```sql
-- Link sensor_data to Supabase auth users
ALTER TABLE sensor_data 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX idx_sensor_data_user_id ON sensor_data(user_id);
```

### Option 2: Keep Custom Users Table
If you want to maintain your own `users` table, you can sync it with Supabase auth:

```sql
-- Add a reference to Supabase auth
ALTER TABLE users 
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id);
```

## Row Level Security (RLS)

Enable RLS to ensure users can only access their own data:

```sql
-- Enable RLS on sensor_data
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sensor data
CREATE POLICY "Users can view own sensor data" 
ON sensor_data FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own sensor data
CREATE POLICY "Users can insert own sensor data" 
ON sensor_data FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

## Testing

1. **Frontend**: Log in via the Login page and check browser DevTools > Application > Local Storage for the session token.
2. **Backend**: Send a request to a protected route with the token in the `Authorization` header.
3. **Database**: Verify RLS policies by attempting to query data from different user accounts.

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
