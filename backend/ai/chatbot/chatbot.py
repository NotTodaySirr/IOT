import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from ai.chatbot.chatbot_config import GEMINI_API_KEY, DB_URI
from ai.chatbot.get_data_fromdb import get_latest_sensor_data, get_daily_average, get_date_range_average
from datetime import datetime, timedelta

genai.configure(api_key=GEMINI_API_KEY)

tools_list = [get_latest_sensor_data, get_daily_average, get_date_range_average]

def ask_iot_ai(user_query):
    """
    Processes the user's question and logs tool usage.
    """
    try:
        # 1. Calculate Dynamic Dates (Crucial for "Yesterday"/"Last week")
        today = datetime.now()
        today_str = today.strftime("%Y-%m-%d")
        yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        three_days_ago_str = (today - timedelta(days=3)).strftime("%Y-%m-%d")

        # 2. Dynamic System Instruction
        # We merged the "sensor" rule into Tool #1 for clarity.
        sys_instruction = f"""
        You are the AI Operator for a Smart Home IoT System.
        
        CONTEXT:
        - Current Date (Vietnam Time): {today_str}
        - The Database tools handle timezone conversion automatically.
        
        YOUR RESPONSIBILITY:
        1. Identify if the user needs data.
        2. OUTPUT THE FUNCTION CALL ONLY. Do not speak first.
        
        --- SPECIFIC SCENARIOS ---
        
        SCENARIO 1: SAFETY ANALYSIS
        - User asks: "Có an toàn để ngủ không?", "Không khí thế nào?", "Có nguy hiểm không" ...
        - Action: Call `get_latest_sensor_data()`.
        - Analysis Rule:
             * IF CO_Level > 50 ppm: RESPONSE MUST START WITH "CẢNH BÁO: NGUY HIỂM!". Advise opening windows immediately.
             * IF CO_Level <= 50 ppm: Respond "Không khí an toàn. Bạn có thể ngủ ngon."
        
        SCENARIO 2: HISTORY / TRENDS
        - User asks: "Hôm qua...", "Tuần trước..."
        - Action: Calculate date relative to {today_str} and call `get_daily_average` or `get_date_range_average`.
        
        SCENARIO 3: GENERAL QUESTIONS
        - User asks general questions about temperature, humidity, or CO levels.
        - Action: Use the appropriate tool to fetch data.
        
        SCENARIO 4: OUT OF SCOPE
        - User asks non-IoT questions.
        - Action: Politely decline and state you only handle Smart Home IoT queries.
        
        EXAMPLES:
        - User: "Giờ ngủ được không?"
          Action: Call `get_latest_sensor_data()`
        
        - User: "Nhiệt độ hôm qua?"
          Action: Call `get_daily_average("{yesterday_str}")`
        
        RESPONSE RULES:
        - Answer in Vietnamese.
        - Be concise.
        - If data is missing, apologize politely.
        """

        # 3. Initialize Model (Must be inside function to get fresh dates)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash", # Or gemini-1.5-flash
            tools=tools_list,
            system_instruction=sys_instruction
        )
        
        # 4. Start Chat
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(user_query)
        
        # --- 5. ADDED LOGGING: Check if tools were called ---
        # We iterate through the chat history to find function calls
        print(f"\n--- DEBUG LOG: '{user_query}' ---")
        tool_called = False
        for part in chat.history:
            for content in part.parts:
                if content.function_call:
                    tool_called = True
                    fname = content.function_call.name
                    # Convert MapComposite to standard Dict for readability
                    fargs = dict(content.function_call.args)
                    print(f"🔧 AI CALLED TOOL: {fname}")
                    print(f"   ARGS: {fargs}")
                
                if content.function_response:
                    print(f"🔙 TOOL RETURNED: {content.function_response.response}")

        if not tool_called:
            print("ℹ️  NO TOOL CALLED (Pure text response)")
        print("------------------------------------------\n")
        
        return response.text
    
    except Exception as e:
        print(f"❌ AI ERROR: {e}")
        return f"Lỗi hệ thống AI: {str(e)}"