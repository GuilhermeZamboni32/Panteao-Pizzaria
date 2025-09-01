from pydantic import BaseModel, EmailStr
from typing import Optional

class PizzaBase(BaseModel):
    nome: str
    ingredientes: str
    preco: float
    id: str
    imagem_url: Optional[str] = None
    data_pedido: Optional[str] = None
    cliente_id: Optional[str] = None