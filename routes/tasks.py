from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import models
from models.task import Task
from utils.auth import get_current_user, admin_required
from bson.objectid import ObjectId
import datetime

router = APIRouter()

class CreateTaskModel(BaseModel):
    title: str
    project_id: str
    description: Optional[str] = ""
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Todo"
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None

class UpdateTaskModel(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None

@router.get("/")
def get_tasks(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if project_id:
        try:
            project = models.db.projects.find_one({'_id': ObjectId(project_id)})
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid Project ID")
            
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if current_user.get('role') != 'Admin' and current_user['_id'] not in project.get('members', []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        tasks_cursor = models.db.tasks.find({'project_id': ObjectId(project_id)})
    else:
        if current_user.get('role') == 'Admin':
            tasks_cursor = models.db.tasks.find()
        else:
            # Members can only see their assigned tasks
            tasks_cursor = models.db.tasks.find({'assigned_to': current_user['_id']})
            
    return [Task.to_dict(t) for t in tasks_cursor]

@router.post("/", status_code=201)
def create_task(data: CreateTaskModel, current_user: dict = Depends(admin_required)):
    if not data.title or not data.project_id:
        raise HTTPException(status_code=400, detail="Title and Project ID are required")
        
    try:
        project_id = ObjectId(data.project_id)
        project = models.db.projects.find_one({'_id': project_id})
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid Project ID")
         
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
    
    due_date = None
    if data.due_date:
        try:
            due_date = datetime.datetime.fromisoformat(data.due_date)
        except ValueError:
            pass # Invalid format
            
    assigned_to = None
    if data.assigned_to:
        try:
            assigned_to = ObjectId(data.assigned_to)
            user = models.db.users.find_one({'_id': assigned_to})
            if not user or assigned_to not in project.get('members', []):
                raise HTTPException(status_code=400, detail="Invalid assignee")
        except Exception:
             raise HTTPException(status_code=400, detail="Invalid Assignee ID")
            
    task_doc = {
        'title': data.title,
        'description': data.description,
        'status': data.status,
        'priority': data.priority,
        'due_date': due_date,
        'project_id': project_id,
        'assigned_to': assigned_to,
        'created_at': datetime.datetime.utcnow()
    }
    
    result = models.db.tasks.insert_one(task_doc)
    task_doc['_id'] = result.inserted_id
    
    return Task.to_dict(task_doc)

@router.put("/{task_id}")
def update_task(task_id: str, data: UpdateTaskModel, current_user: dict = Depends(get_current_user)):
    try:
        task = models.db.tasks.find_one({'_id': ObjectId(task_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Task ID")
        
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    if current_user.get('role') != 'Admin' and str(task.get('assigned_to')) != str(current_user['_id']):
        raise HTTPException(status_code=403, detail="Access denied")
        
    update_fields = {}
        
    if current_user.get('role') == 'Admin':
        if data.title is not None: update_fields['title'] = data.title
        if data.description is not None: update_fields['description'] = data.description
        if data.priority is not None: update_fields['priority'] = data.priority
        if data.assigned_to is not None: 
            try:
                 update_fields['assigned_to'] = ObjectId(data.assigned_to)
            except: pass
        if data.due_date is not None:
             try:
                 update_fields['due_date'] = datetime.datetime.fromisoformat(data.due_date)
             except: pass
             
    # Both Admin and Assignee can update status
    if data.status is not None:
        update_fields['status'] = data.status
        
    if update_fields:
        models.db.tasks.update_one({'_id': ObjectId(task_id)}, {'$set': update_fields})
        # Fetch updated document
        task = models.db.tasks.find_one({'_id': ObjectId(task_id)})
        
    return Task.to_dict(task)
