from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import models
from models.project import Project
from utils.auth import get_current_user, admin_required
from bson.objectid import ObjectId
import datetime

router = APIRouter()

class ProjectModel(BaseModel):
    name: str
    description: Optional[str] = ""

class AddMemberModel(BaseModel):
    user_id: str

@router.get("/")
def get_projects(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') == 'Admin':
        projects_cursor = models.db.projects.find()
    else:
        projects_cursor = models.db.projects.find({'members': current_user['_id']})
        
    return [Project.to_dict(p, models.db.users) for p in projects_cursor]

@router.get("/{project_id}")
def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    try:
        project = models.db.projects.find_one({'_id': ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Project ID")
        
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.get('role') != 'Admin' and current_user['_id'] not in project.get('members', []):
        raise HTTPException(status_code=403, detail="Access denied")
        
    return Project.to_dict(project, models.db.users)

@router.post("/", status_code=201)
def create_project(data: ProjectModel, current_user: dict = Depends(admin_required)):
    if not data.name:
        raise HTTPException(status_code=400, detail="Project name is required")
        
    project_doc = {
        'name': data.name,
        'description': data.description,
        'created_by': current_user['_id'],
        'members': [current_user['_id']],
        'created_at': datetime.datetime.utcnow()
    }
    
    result = models.db.projects.insert_one(project_doc)
    project_doc['_id'] = result.inserted_id
    
    return Project.to_dict(project_doc, models.db.users)

@router.post("/{project_id}/members")
def add_member(project_id: str, data: AddMemberModel, current_user: dict = Depends(admin_required)):
    try:
        project = models.db.projects.find_one({'_id': ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Project ID")
        
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
         
    try:
        user_id = ObjectId(data.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
    
    user = models.db.users.find_one({'_id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_id not in project.get('members', []):
        models.db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$push': {'members': user_id}}
        )
        
    return {"msg": "Member added successfully"}
