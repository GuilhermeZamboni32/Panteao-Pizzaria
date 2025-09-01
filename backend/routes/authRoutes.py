from fastapi import APIRouter, HTTPException, status
from schemas.authSchemas import LoginInput, Token
from services import userServices
from services.authServices import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(payload: LoginInput):
    user_doc = userServices.get_user_doc_by_email(payload.email)
    if not user_doc or not userServices.verify_password(payload.senha, user_doc["senha"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    token = create_access_token(str(user_doc["_id"]), user_doc["email"])
    return {"access_token": token, "token_type": "bearer"}