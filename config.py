import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # SECRET_KEY = os.environ.get('SECRET_KEY', 'default-super-secret-key-change-in-prod')
    
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://testuser:<db_password>@almlcluster.2sg5cqw.mongodb.net/taskmanager?appName=ALMLCluster')
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', '8c8c93526bc7930c7143191dbea82d3e5fda849dcaed00df27232b1ffb4b84538fec4778')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  
