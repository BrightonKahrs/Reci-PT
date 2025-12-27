from pydantic import BaseModel, ConfigDict
from typing import List, Literal


class UserSetting(BaseModel):
    """Represents user settings for dietary preferences"""
    model_config = ConfigDict(extra='forbid')
    dietary_preference: str
    order_of_importance: Literal["Required", "Preferred"]
    generated_by: Literal["user", "ai"]
    

class UserSettings(BaseModel):
    """Represents a list of user settings"""
    model_config = ConfigDict(extra='forbid')
    user_settings: List[UserSetting]