from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    endereco: str
    numero_cartao: str
    validade_cartao: str   
    cvv: str              

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    endereco: Optional[str] = None
    numero_cartao: Optional[str] = None
    validade_cartao: Optional[str] = None   
    cvv: Optional[str] = None