import datetime

class Task:
    @staticmethod
    def to_dict(task_doc):
        if not task_doc:
            return None
            
        due_date = task_doc.get('due_date')
        if isinstance(due_date, datetime.datetime):
            due_date = due_date.isoformat()
            
        created_at = task_doc.get('created_at')
        if isinstance(created_at, datetime.datetime):
            created_at = created_at.isoformat()

        return {
            'id': str(task_doc['_id']),
            'title': task_doc.get('title'),
            'description': task_doc.get('description'),
            'status': task_doc.get('status'),
            'priority': task_doc.get('priority'),
            'due_date': due_date,
            'project_id': str(task_doc.get('project_id')) if task_doc.get('project_id') else None,
            'assigned_to': str(task_doc.get('assigned_to')) if task_doc.get('assigned_to') else None,
            'created_at': created_at
        }
