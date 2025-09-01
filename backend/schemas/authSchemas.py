from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginInput(BaseModel):
    email: EmailStr
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: str  
    email: EmailStr
    exp: Optional[int] = None