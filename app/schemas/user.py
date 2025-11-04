from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, examples=["John Doe"])
    email: Optional[EmailStr] = Field(None, examples=["johndoe@example.com"])
