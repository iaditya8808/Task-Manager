from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from bson.objectid import ObjectId
import models

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = models.db.users.find_one({'_id': ObjectId(current_user_id)})
            if not user or user.get('role') != 'Admin':
                return jsonify({"msg": "Admins only!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
