from flask import Blueprint

auth_bp = Blueprint('auth', __name__)
projects_bp = Blueprint('projects', __name__)
tasks_bp = Blueprint('tasks', __name__)

from . import auth
from . import projects
from . import tasks
