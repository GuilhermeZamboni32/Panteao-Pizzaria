from fastapi import FastAPI
from backend.routes import authRoutes
from routes import userRoutes

app = FastAPI(title="API Pizzaria com Usuários")

app.include_router(authRoutes.router)
app.include_router(userRoutes.router)