from flask import Flask, request, jsonify, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import uuid
import random

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Replace with a secure secret key in production.
jwt = JWTManager(app)

# Dummy user store (for demonstration purposes)
USERS = {
    "testuser": "password123"
}

# In-memory list to simulate a database for employees
employees = [
    {
        "id": "1",
        "first_name": "John",
        "last_name": "Doe",
        "department": "HR",
        "salary": 50000
    },
    {
        "id": "2",
        "first_name": "Jane",
        "last_name": "Smith",
        "department": "Finance",
        "salary": 60000
    }
]

# ---------------------------
# Home Route for Rendering index.html
# ---------------------------
@app.route('/')
def home():
    return render_template('index.html')

# ---------------------------
# Authentication Endpoints
# ---------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if username in USERS and USERS[username] == password:
        # Generate an access token valid for the user
        access_token = create_access_token(identity=username)
        return jsonify(token=access_token), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

# ---------------------------
# Employee CRUD Endpoints (Protected)
# ---------------------------
@app.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    return jsonify(employees), 200

@app.route('/employees/<string:employee_id>', methods=['GET'])
@jwt_required()
def get_employee(employee_id):
    employee = next((emp for emp in employees if emp["id"] == employee_id), None)
    if employee:
        return jsonify(employee), 200
    else:
        return jsonify({"error": "Employee not found"}), 404

@app.route('/employees', methods=['POST'])
@jwt_required()
def create_employee():
    data = request.get_json()
    # Generate a unique short ID for the new employee
    new_id = str(uuid.uuid4())[:4]
    # Generate a random salary if not provided or if empty
    if "salary" not in data or data["salary"] == "":
        data["salary"] = random.randint(30000, 100000)
    new_employee = {
        "id": new_id,
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "department": data.get("department", ""),
        "salary": data.get("salary", 0)
    }
    employees.append(new_employee)
    return jsonify(new_employee), 201

@app.route('/employees/<string:employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    data = request.get_json()
    employee = next((emp for emp in employees if emp["id"] == employee_id), None)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    employee["first_name"] = data.get("first_name", employee["first_name"])
    employee["last_name"] = data.get("last_name", employee["last_name"])
    employee["department"] = data.get("department", employee["department"])
    if "salary" in data:
        if data["salary"] == "":
            employee["salary"] = random.randint(30000, 100000)
        else:
            employee["salary"] = data["salary"]

    return jsonify(employee), 200

@app.route('/employees/<string:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    global employees
    employees = [emp for emp in employees if emp["id"] != employee_id]
    return jsonify({"message": f"Employee {employee_id} deleted"}), 200

if __name__ == '__main__':
    app.run(debug=True)
