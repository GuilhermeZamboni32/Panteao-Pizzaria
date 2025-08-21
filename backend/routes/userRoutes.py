from pymongo import MongoClient

class AtlasClient ():
  def __init__(self, uri):
    self.client = MongoClient(uri)
    self.db = self.client['']