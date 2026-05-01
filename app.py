from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import Config
import models

from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.tasks import router as tasks_router

app = FastAPI(title="Nexus Tasks API")

# Setup configuration
app.config = {
    'MONGO_URI': Config.MONGO_URI
}

# Initialize MongoDB
models.init_db(app)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])

# Serve frontend
@app.get("/{path:path}")
def serve_frontend(path: str):
    return FileResponse("templates/index.html")
