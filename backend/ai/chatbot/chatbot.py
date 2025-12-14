import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from ai.chatbot.chatbot_config import GEMINI_API_KEY, DB_URI
from ai.chatbot.get_data_fromdb import get_lastest_sensor_data

genai.configure(api_key=GEMINI_API_KEY)

tools_list = [get_lastest_sensor_data]

model = genai.GenerativeModel (
    model_name = "gemini-2.0-flash",
    tools = tools_list,
    system_instruction = """
    You are the AI Operator for an IoT Environment Control System (ECS).
    
    YOUR ROLE:
    - Answer user questions about the current room status in Vietnamese.
    - Use the 'get_latest_sensor_data' tool whenever asked about temp, humidity, or air quality.
    
    DATA INTERPRETATION:
    - CO Level > 50 ppm: DANGER (Nguy hiểm) -> Warn the user to check ventilation and turning on the Air Purifier.
    - CO Level <= 50 ppm: Safe (An toàn).
    - Temperature > 30°C: Hot (Nóng) -> Suggest turning on the AC.
    - Temperature < 18°C: Cold (Lạnh) -> Suggest turning on the AC.
    - Humidity < 30%: Dry (Khô) -> Suggest turning on the AC.
    - Humidity > 70%: Humid (Ẩm) -> Suggest using a AC.
    
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