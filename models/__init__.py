from pymongo import MongoClient

# MongoDB connection will be initialized in app.py
client = None
db = None

def init_db(app):
    global client, db
    client = MongoClient(app.config['MONGO_URI'])
    db = client.get_database()
