# Nexus Tasks - Team Task Management Application

Nexus Tasks is a full-stack, role-based project and task management system designed for seamless collaboration. It provides an intuitive, glassmorphism-styled web interface backed by a high-performance, asynchronous REST API.

##  Features

- **Role-Based Access Control (RBAC):**
  - **Admins** can create projects, assign users to projects, and create tasks.
  - **Members** can view their assigned projects and update the status of their tasks.
- **Authentication:** Secure user registration and login with JWT-based sessions.
- **Project Management:** Create new projects and manage team member access.
- **Task Tracking:** Create, assign, and update tasks with priorities, statuses, and due dates.
- **Responsive UI:** Modern, dynamic frontend built with pure HTML/CSS/JS without heavy frameworks.

##  Technology Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database:** [MongoDB](https://www.mongodb.com/) (via PyMongo)
- **Authentication:** PyJWT & bcrypt
- **Server:** Uvicorn (ASGI)
- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphism design), Vanilla JS (ES6+)

##  Local Development Setup

### 1. Prerequisites
- Python 3.9+
- A MongoDB cluster (e.g., MongoDB Atlas)

### 2. Installation
Clone the repository and install the dependencies in a virtual environment:

```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:

```env
# Your MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/taskmanager?appName=ClusterName

# JWT Configuration
JWT_SECRET_KEY=your-secure-random-secret-key
```

### 4. Running the Application
Start the development server using Uvicorn:

```bash
uvicorn app:app --reload --port 8000
```

Open your browser and navigate to: `http://127.0.0.1:8000`

##  Deployment to Railway

This project is fully configured for easy deployment on [Railway.app](https://railway.app/).

1. Push your code to a GitHub repository.
2. Log into Railway and click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Go to the project's **Variables** tab in Railway and add your `MONGO_URI` and `JWT_SECRET_KEY`.
5. Railway will automatically detect the `Procfile` and deploy the application using Gunicorn/Uvicorn!

##  Project Structure

```
.
├── app.py                 # FastAPI Application Entry Point
├── config.py              # Configuration & Environment loading
├── models/                # Database configuration & Data models
├── routes/                # FastAPI Routers (Auth, Projects, Tasks)
├── utils/                 # Security utilities & Dependencies
├── static/                # Frontend CSS & JS assets
├── templates/             # Frontend HTML
├── requirements.txt       # Python dependencies
├── Procfile               # Railway Deployment configuration
└── runtime.txt            # Python version specification
```
