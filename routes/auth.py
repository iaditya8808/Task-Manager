from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import models
from models.user import User
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from bson.objectid import ObjectId
import datetime

router = APIRouter()

class RegisterModel(BaseModel):
    username: str
    email: str
    password: str
    role: str = "Member"

class LoginModel(BaseModel):
    username: str
    password: str

@router.post("/register", status_code=201)
def register(data: RegisterModel):
    if models.db.users.find_one({'username': data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
        
    if models.db.users.find_one({'email': data.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
        
    user_doc = {
        'username': data.username,
        'email': data.email,
        'password_hash': get_password_hash(data.password),
        'role': data.role,
        'created_at': datetime.datetime.utcnow()
    }
    
    models.db.users.insert_one(user_doc)
    return {"msg": "User created successfully"}

@router.post("/login")
def login(data: LoginModel):
    user = models.db.users.find_one({'username': data.username})
    if user and verify_password(data.password, user['password_hash']):
        access_token = create_access_token(data={"sub": str(user['_id'])})
        return {"access_token": access_token, "user": User.to_dict(user)}
        
    raise HTTPException(status_code=401, detail="Invalid username or password")

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": User.to_dict(current_user)}

@router.get("/users")
def get_users(current_user: dict = Depends(get_current_user)):
    users_cursor = models.db.users.find()
    return [User.to_dict(u) for u in users_cursor]
