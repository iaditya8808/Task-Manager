import datetime
from bson.objectid import ObjectId

class Project:
    @staticmethod
    def to_dict(project_doc, users_collection=None):
        if not project_doc:
            return None
            
        # Resolve members if users_collection is provided
        members = []
        if users_collection is not None and 'members' in project_doc:
            for member_id in project_doc['members']:
                user = users_collection.find_one({'_id': member_id})
                if user:
                    members.append({
                        'id': str(user['_id']),
                        'username': user.get('username'),
                        'role': user.get('role')
                    })

        return {
            'id': str(project_doc['_id']),
            'name': project_doc.get('name'),
            'description': project_doc.get('description'),
            'created_by': str(project_doc.get('created_by')),
            'created_at': project_doc.get('created_at').isoformat() if isinstance(project_doc.get('created_at'), datetime.datetime) else project_doc.get('created_at'),
            'members': members
        }
