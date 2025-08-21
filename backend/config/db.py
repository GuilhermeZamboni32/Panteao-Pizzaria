from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

import os
load_dotenv()

uri = os.getenv('MONGODB_URI')
# Cria uma instância do cliente MongoDB
client = MongoClient(uri, server_api=ServerApi('1'))
# Verifica a conexão com o banco de dados
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)