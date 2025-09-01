from datetime import datetime, timezone
from datetime import timedelta as _timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from config.auth import JWT_SECRET, JWT_ALGORITHM, get_access_token_expires
from schemas.authSchemas import TokenData
from services import userServices

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(sub: str, email: str):
    expire: _timedelta = get_access_token_expires()
    to_encode = {
        "sub": sub,
        "email": email,
        "iat": int(datetime.now(tz=timezone.utc).timestamp()),
        "exp": int((datetime.now(tz=timezone.utc) + expire).timestamp()),
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenData(sub=payload.get("sub"), email=payload.get("email"), exp=payload.get("exp"))
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    data = decode_token(token)
    user_doc = userServices._get_user_doc_by_id(data.sub)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return {
        "id": str(user_doc["_id"]),
        "email": user_doc["email"],
        "nome": user_doc["nome"],
    }