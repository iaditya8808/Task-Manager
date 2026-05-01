import datetime
from bson.objectid import ObjectId

class User:
    @staticmethod
    def to_dict(user_doc):
        if not user_doc:
            return None
        return {
            'id': str(user_doc['_id']),
            'username': user_doc.get('username'),
            'email': user_doc.get('email'),
            'role': user_doc.get('role'),
            'created_at': user_doc.get('created_at').isoformat() if isinstance(user_doc.get('created_at'), datetime.datetime) else user_doc.get('created_at')
        }
