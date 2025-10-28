# Base image
FROM node:22 AS base

# Backend setup
FROM base AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install, zod, express, bycript, jsonwebtoken, dotenv --save, @google/generative-ai, node-fetch, node-fetch@3
COPY backend/ ./

# Frontend setup
FROM base AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install, axios, react-router-dom, react-icons, @lottiefiles/react-lottie-player
COPY frontend/ ./

# Final stage (optional, if you need to combine or serve both)
FROM base AS final
WORKDIR /app
COPY --from=backend /app/backend ./backend
COPY --from=frontend /app/frontend ./frontend

