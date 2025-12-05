from pydantic import BaseModel, Field
from typing import List, Optional, Union

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class SensorDataSchema(BaseModel):
    id: int
    user_id: Optional[str] = None
    recorded_at: str
    temperature: float
    humidity: float
    co_level: int

class HistoryResponse(BaseModel):
    success: bool
    count: int
    data: List[SensorDataSchema]

class CurrentReadingResponse(BaseModel):
    success: bool
    data: SensorDataSchema

class ControlResponse(BaseModel):
    success: bool
    message: str
    device: str
    action: str

class ErrorResponse(BaseModel):
    error: str

class AIResponse(BaseModel):
    status: str
    message: str
    prediction: Optional[Union[dict, str, int, float]] = None
