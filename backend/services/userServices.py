from bson import ObjectId
from passlib.hash import bcrypt
from config.db import db
from schemas.userSchemas import UserBase, UserUpdate

user_collection = db["usuarios"]

def user_public_serializer(user) -> dict:
    return {
        "id": str(user["_id"]),
        "nome": user["nome"],
        "email": user["email"],
        "endereco": user["endereco"],
        "numero_cartao": user["numero_cartao"],
        "validade_cartao": user["validade_cartao"],
        "cvv": user["cvv"],
    }

def _get_user_doc_by_id(user_id: str):
    return user_collection.find_one({"_id": ObjectId(user_id)})

def _get_user_doc_by_email(email: str):
    return user_collection.find_one({"email": email})

def get_all_users():
    users = user_collection.find()
    return [user_public_serializer(u) for u in users]

def get_user_by_id(user_id: str):
    user = _get_user_doc_by_id(user_id)
    return user_public_serializer(user) if user else None

def get_user_doc_by_email(email: str):
    return _get_user_doc_by_email(email)

def create_user(user: UserBase):
    if _get_user_doc_by_email(user.email):
        raise ValueError("Email já cadastrado")
    hashed_password = bcrypt.hash(user.senha)
    new_user = dict(user)
    new_user["senha"] = hashed_password
    result = user_collection.insert_one(new_user)
    return get_user_by_id(str(result.inserted_id))

def update_user(user_id: str, user: UserUpdate):
    update_data = {k: v for k, v in user.dict().items() if v is not None}
    if "senha" in update_data:
        update_data["senha"] = bcrypt.hash(update_data["senha"])
    if not update_data:
        return None
    user_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return get_user_by_id(user_id)

def delete_user(user_id: str):
    result = user_collection.delete_one({"_id": ObjectId(user_id)})
    return result.deleted_count > 0

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.verify(plain, hashed)