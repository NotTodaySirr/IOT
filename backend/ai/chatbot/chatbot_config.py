import os

GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY", "AIzaSyD3r38uuLOsPF-xLOTCsuH4t9BFLRmIQyk")

DB_URI = os.environ.get("DB_URL", 'postgresql://postgres.yksqglbwzjsaijqqekjn:IOThehe123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres')