from fastapi import APIRouter, HTTPException, Depends
from schemas.userSchemas import UserBase, UserUpdate
from services import userServices
from services.authServices import get_current_user

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", dependencies=[Depends(get_current_user)])
def listar_usuarios():
    return userServices.get_all_users()

@router.get("/me")
def perfil_me(current_user=Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", dependencies=[Depends(get_current_user)])
def buscar_usuario(user_id: str):
    user = userServices.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.post("/")
def criar_usuario(user: UserBase):
    try:
        return userServices.create_user(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}", dependencies=[Depends(get_current_user)])
def atualizar_usuario(user_id: str, user: UserUpdate):
    updated_user = userServices.update_user(user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado ou sem alterações")
    return updated_user

@router.delete("/{user_id}", dependencies=[Depends(get_current_user)])
def deletar_usuario(user_id: str):
    success = userServices.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário deletado com sucesso"}