// Define the base API URL (Flask typically runs on port 5000)
const API_BASE_URL = 'http://127.0.0.1:5000';
let jwtToken = null;  // This will store the JWT after a successful login

// Initialize event listeners when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  // Listen for login submissions.
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  // Listen for logout button click.
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  // Listen for employee form submissions.
  document.getElementById('employee-form').addEventListener('submit', handleFormSubmit);
  // Cancel edit resets the form.
  document.getElementById('cancel-edit').addEventListener('click', resetForm);
});

// Handle the login process.
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Login failed");
    }
    return response.json();
  })
  .then(data => {
    jwtToken = data.token; // Assumes the Flask backend returns { "token": "..." }
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('employee-section').style.display = 'block';
    fetchEmployees(); // Fetch the employee list after login
  })
  .catch(error => {
    document.getElementById('login-error').innerText = "Invalid username or password.";
    console.error('Login error:', error);
  });
}

// Log out the user by clearing the token and toggling the UI.
function handleLogout() {
  jwtToken = null;
  document.getElementById('employee-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('login-form').reset();
  document.getElementById('login-error').innerText = "";
}

// Fetch all employees from the Flask API.
function fetchEmployees() {
  fetch(`${API_BASE_URL}/employees`, {
    headers: {
      'Authorization': 'Bearer ' + jwtToken
    }
  })
  .then(response => response.json())
  .then(data => populateTable(data))
  .catch(error => console.error('Error fetching employees:', error));
}

// Populate the employee table with data.
function populateTable(employees) {
  const tbody = document.getElementById('employee-table').querySelector('tbody');
  tbody.innerHTML = ''; // Clear any existing rows

  employees.forEach(employee => {
    const row = tbody.insertRow();
    row.insertCell().innerText = employee.id;
    row.insertCell().innerText = employee.first_name;
    row.insertCell().innerText = employee.last_name;
    row.insertCell().innerText = employee.department;
    row.insertCell().innerText = employee.salary;

    // Create an actions cell with Edit and Delete buttons.
    const actionsCell = row.insertCell();

    // Edit button to populate the form for editing.
    const editButton = document.createElement('button');
    editButton.innerText = 'Edit';
    editButton.onclick = () => populateFormForEdit(employee);
    actionsCell.appendChild(editButton);

    // Delete button to remove the employee.
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.onclick = () => deleteEmployee(employee.id);
    actionsCell.appendChild(deleteButton);
  });
}

// Handle form submission for both creating and updating employees.
function handleFormSubmit(event) {
  event.preventDefault();
  const employeeId = document.getElementById('employee-id').value;
  const firstName = document.getElementById('first_name').value;
  const lastName = document.getElementById('last_name').value;
  const department = document.getElementById('department').value;
  let salary = document.getElementById('salary').value;

  // If salary is empty, generate a random salary between 30000 and 100000.
  if (!salary) {
    salary = generateRandomSalary();
  }

  const employeeData = {
    first_name: firstName,
    last_name: lastName,
    department: department,
    salary: Number(salary)
  };

  if (employeeId) {
    // Update existing employee using PUT.
    fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + jwtToken
      },
      body: JSON.stringify(employeeData)
    })
    .then(() => {
      resetForm();
      fetchEmployees();
    })
    .catch(error => console.error('Error updating employee:', error));
  } else {
    // Create new employee using POST.
    fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + jwtToken
      },
      body: JSON.stringify(employeeData)
    })
    .then(() => {
      resetForm();
      fetchEmployees();
    })
    .catch(error => console.error('Error creating employee:', error));
  }
}

// Populate the form with employee data for editing.
function populateFormForEdit(employee) {
  document.getElementById('employee-id').value = employee.id;
  document.getElementById('first_name').value = employee.first_name;
  document.getElementById('last_name').value = employee.last_name;
  document.getElementById('department').value = employee.department;
  document.getElementById('salary').value = employee.salary;
  document.getElementById('cancel-edit').style.display = 'inline';
}

// Reset the employee form to its initial state.
function resetForm() {
  document.getElementById('employee-id').value = '';
  document.getElementById('employee-form').reset();
  document.getElementById('cancel-edit').style.display = 'none';
}

// Delete an employee by sending a DELETE request.
function deleteEmployee(id) {
  fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + jwtToken
    }
  })
  .then(() => fetchEmployees())
  .catch(error => console.error('Error deleting employee:', error));
}

// Generate a random salary between 30000 and 100000.
function generateRandomSalary() {
  return Math.floor(Math.random() * (100000 - 30000 + 1)) + 30000;
}
