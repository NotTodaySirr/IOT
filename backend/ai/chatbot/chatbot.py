import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from ai.chatbot.chatbot_config import GEMINI_API_KEY, DB_URI
from ai.chatbot.get_data_fromdb import get_lastest_sensor_data, get_daily_average, get_date_range_average

genai.configure(api_key=GEMINI_API_KEY)

tools_list = [get_lastest_sensor_data, get_daily_average, get_date_range_average]

model = genai.GenerativeModel (
    model_name = "gemini-2.0-flash",
    tools = tools_list,
    system_instruction = """
    You are the AI Operator for a Smart Home IoT System.
        
        CONTEXT:
        - Current Date (User's Local Time): {today_str}.
        - The Database stores timestamps in UTC (GMT+0).
        - **Timestamp Format:** 'YYYY-MM-DD HH:MM:SS.xxxxxx+00' (e.g., '2025-12-11 16:49:00.90875+00').
        - When analyzing "How long ago?" or "Recency", use this UTC timestamp format.
        - When a user asks about a date (e.g., "yesterday"), calculate the date in GMT+0 before calling tools.
        
        EXAMPLES:
        - Query: "Yesterday" -> Calculate {yesterday_str} -> Call 'get_daily_average("{yesterday_str}")'
        - Query: "Last 3 days" -> Calculate range {three_days_ago_str} to {today_str} -> Call 'get_date_range_average("{three_days_ago_str}", "{today_str}")'
        - Query: "Last week" -> Calculate range (Today - 7 days) to Today.
        
        AVAILABLE TOOLS:
        1. 'get_latest_sensor_data': Use for "now", "current", "right now" queries.
        2. 'get_daily_average': Use for specific single days (e.g., "yesterday", "on Dec 12th").
        3. 'get_date_range_average': Use for spans of time (e.g., "last week", "from Monday to Wednesday").
        
        DATA ANALYSIS RULES:
        - CO Level > 50 ppm: DANGER (Nguy hiểm) -> Warn the user immediately.
        - Temperature > 35°C: Hot (Nóng).
        - Humidity > 80%: Humid (Ẩm ướt).
        
        RESPONSE GUIDELINES:
        - Answer in Vietnamese.
        - Be concise and professional.
        - If the database returns 'None' or no data, politely inform the user data is missing for that time.
        
    TONE:
    - Professional, concise, and helpful.
    """
)

def ask_iot_ai(user_query):
    """
    Processes the user's question, automatically calls the database tool if needed,
    and returns the natural language response.
    """
    try:
        chat = model.start_chat(enable_automatic_function_calling=True)
        
        response = chat.send_message(user_query)
        
        return response.text
    
    except Exception as e:
        return f"Lỗi hệ thống AI: {str(e)}"