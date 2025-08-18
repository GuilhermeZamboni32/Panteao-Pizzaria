from pymongo.mongo_client import MongoClient
from pymongo.server_pyapi import ServerApi

uri = "mongodb+srv://vitordanielli3113:7FBnO71tz8YsKEqp@cluster0.vbgzj9r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)