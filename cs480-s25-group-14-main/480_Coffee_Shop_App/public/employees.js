  
 selectedEmployee = null;
  

function showAddForm() {
    document.getElementById('addFormModal').style.display = 'block';
}
  

function showRemoveForm() {
    document.getElementById('removeFormModal').style.display = 'block';
}
  

function showEditForm() {
    document.getElementById('editFormModal').style.display = 'block';
}


function closeModal(modalId) {
    var modal = document.getElementById(modalId);
modal.style.display = "none";
}


function openModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.style.display = "block";
}


function showEmployeeListModalForEdit() {
    loadEmployees();
    openModal('employeeListModalForEdit');
}
  

function showEmployeeListModalForRemove() {
  loadEmployeesRemoval();
  openModal('removeEmployeeListModal')
}
  

function showRemoveConfirmation() {
  if (!selectedEmployee) {
    alert('Please select an employee to remove');
    return;
  }

  document.getElementById('employeeNameToRemove').textContent = selectedEmployee.name;

  closeModal('removeEmployeeListModal');
  openModal('removeConfirmationModal');
}



function removeEmployee() {
  if (!selectedEmployee) {
    alert('No employee selected for removal');
    return;
  }
  
  fetch(`http://localhost:3000/employee/${selectedEmployee.ssn}`, {
    method: 'DELETE',  
  })
    .then(response => {
      if (response.ok) {
        alert('Employee removed successfully!');
     
        loadEmployeesRemoval();
      } else {
        alert('Failed to remove employee');
      }
    })
    .catch(error => {
      console.error('err:', error);
    });
  
  
  closeModal('removeConfirmationModal');
}
  
  
function selectEmployeeForRemove(employee) {
  
  console.log('Selected Employee for Removal:', employee);  
  
  selectedEmployee = employee;  

  showRemoveConfirmation();
}
  

document.getElementById('roleSelect').addEventListener('change', function() {
    const role = this.value;  
    const percentOwnedField = document.getElementById('percentOwnedField');
  
    if (role === 'manager' || role === 'hybrid') {
      percentOwnedField.style.display = 'block';
    } else {
      percentOwnedField.style.display = 'none';
    }
});


function submitAddForm(event) {
  event.preventDefault();  

  const name = event.target.name.value;
  const email = event.target.email.value;
  const ssn = event.target.ssn.value;
  const salary = parseFloat(event.target.salary.value);
  const password = event.target.password.value;
  const schedule = event.target.schedule.value;
  const role = event.target.role.value;
  const percentOwned = role === 'Manager' || role === 'Hybrid' ? event.target.percentOwned.value : null;

  if (!['barista', 'manager', 'hybrid'].includes(role)) {
    alert('Invalid role selected!');
    return;
  }

  fetch('http://localhost:3000/employee', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, ssn, salary, password, schedule, role, percentOwned }),  
  })
    .then(response => response.json())  
    .then(data => {
      console.log('Employee Added:', data);

      return fetch('http://localhost:3000/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ssn, email, password, role })  
      });
    })
    .then(loginResponse => loginResponse.json())
    .then(loginData => {
      console.log('User login added:', loginData);  

      openModal('successModal1'); 
      event.target.reset();
      closeModal('addFormModal');
    })
    .catch(error => {
      console.error(':', error);  
    });
}
  
  

  function loadEmployees() {
    fetch('http://localhost:3000/employee')
    .then(response => response.json())
    .then(data => {
      const employeeList = document.getElementById('employeeListUlForEdit');
      employeeList.innerHTML = ''; 
  
      data.forEach(employee => {
        let displayText = `${employee.name} (${employee.role})`;
  
        if(employee.role != 'barista'){
          if (employee.percent_own !== null) {
            displayText += ` - Ownership: ${employee.percent_own}%`;
        }
      }
  
        const square = document.createElement('div');
        square.className = 'employee-square';
        square.innerHTML = `<p>${displayText}</p>`;
        
        square.onclick = () => selectEmployeeForEdit(employee);
        employeeList.appendChild(square);
      });
    })
    .catch(error => {
      console.error('Error loading employees:', error);
    });
  
  }
  
  
  
  
  function selectEmployeeForEdit(employee) {
  
    selectedEmployee = employee;
  
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeeEmail').value = employee.email;
    document.getElementById('employeeSalary').value = employee.salary;  
    document.getElementById('employeeSSN').value = employee.ssn; 
    document.getElementById('employeeSchedule').value = employee.schedule;
    document.getElementById('employeePassword').value = employee.password;
  
    const roleSelect = document.getElementById('roleSelect2'); 
    roleSelect.value = employee.role;
  
    const percentOwnedField = document.getElementById('percentOwnedField2');
    const percentOwnedInput = document.querySelector('#percentOwnedField2 input[name="percentOwned"]');
  
    if (employee.role === 'manager' || employee.role === 'hybrid') {
      percentOwnedField.style.display = 'block';
      percentOwnedInput.value = employee.percentOwned || ''; 
    } else {
      percentOwnedField.style.display = 'none';
      percentOwnedInput.value = ''; 
    }
  
    openModal('editFormModal');
  }



function showEmployeeListModalForRemove() {
  loadEmployeesRemoval();  
  openModal('removeEmployeeListModal');  
}
  

function loadEmployeesRemoval() {
  fetch('http://localhost:3000/employee')
    .then(response => response.json())  
    .then(data => {
      const employeeList = document.getElementById('employeeListUlForRemove');
      employeeList.innerHTML = '';  

      data.forEach(employee => {
        const listItem = document.createElement('li');
        listItem.textContent = employee.name;  
        listItem.onclick = () => selectEmployeeForRemove(employee);
        employeeList.appendChild(listItem);
      });
    })
    .catch(error => {
      console.error('error:', error);  
    });
}
  
  
function selectEmployeeForRemove(employee) {
  const confirmation = confirm(`Are you sure you want to remove ${employee.name}?`);

  if (confirmation) {
    fetch(`http://localhost:3000/employee/${employee.ssn}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (response.ok) {
        const employeeList = document.getElementById('employeeListUlForRemove');
        const listItem = Array.from(employeeList.children).find(item => item.textContent === employee.name);
        if (listItem) {
          employeeList.removeChild(listItem);
        }
        alert(`${employee.name} has been removed.`);
      } else {
        alert('Failed to remove the employee.');
      }
    })
    .catch(error => {
      console.error('error', error);  
      
    });
  }
}
  
 

function showRemoveConfirmation() {
  if (!selectedEmployee) {
    alert('Please select an employee to remove');
    return;
  }
  document.getElementById('employeeNameToRemove').textContent = selectedEmployee.name;
  closeModal('removeEmployeeListModal');
  openModal('removeConfirmationModal');
}
  


function removeEmployeeRemoval() {
  if (!selectedEmployee) {
    alert('No employee selected for removal');
    return;
  }
  
  fetch(`http://localhost:3000/employee/${selectedEmployee.ssn}`, {
    method: 'DELETE',  
  })
    .then(response => {
      if (response.ok) {
        alert('Employee removed successfully!');
        loadEmployeesRemoval(); 
      } else {
        alert('Failed to remove employee');
      }
    })
    .catch(error => {
      console.error('Error removing employee:', error);
      alert('Error removing employee');
    });

  closeModal('removeConfirmationModal');
}
  


function submitEditForm(event) {
  event.preventDefault();  
  
  const name = event.target.name.value;
  const email = event.target.email.value;
  const salary = parseFloat(event.target.salary.value);  
  const ssn = selectedEmployee.ssn;  
  const schedule = event.target.schedule.value;
  const password = event.target.password.value;
  const role = event.target.role.value;  
  
  
  const percentOwned = (role === 'manager' || role === 'hybrid') ? event.target.percentOwned.value : null;
  
  if (isNaN(salary)) {
    alert('Please enter a valid salary');
    return;
  }
  
  
  fetch(`http://localhost:3000/employee/${ssn}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      name, 
      email, 
      salary, 
      ssn, 
      schedule, 
      password, 
      role, 
      percentOwned 
    }),
  })
    .then(response => response.json())  
    .then(data => {
      console.log('Employee Updated:', data);  

      const employeeList = document.getElementById('employeeListUlForEdit');
      const listItem = Array.from(employeeList.children).find(item => item.textContent === selectedEmployee.name);
      if (listItem) {
        listItem.textContent = data.name;
      }
  
      closeModal('editFormModal');
      closeModal('employeeListModalForEdit');
      closeModal('successModal'); 

      showSuccessMessage('Employee details updated successfully!');
    })
    .catch(error => {
      console.error('error', error);
     
    });
}
  
function showSuccessMessage(message) {
  const successModal = document.getElementById('successModal');  
  const successMessage = document.getElementById('successMessage');  
  
  successMessage.textContent = message;  
  successModal.style.display = 'block';  
  closeModal('editFormModal');
  
  setTimeout(() => {
    closeModal('successModal');  
  }, 3000);  
  }
  document.getElementById('roleSelect2').addEventListener('change', function() {
  const role = this.value; 
  const percentOwnedField2 = document.getElementById('percentOwnedField2');
  const percentOwnedInput2 = document.querySelector('#percentOwnedField2 input[name="percentOwned"]');
  
  if (role === 'manager' || role === 'hybrid') {
    percentOwnedField2.style.display = 'block';
    if (!percentOwnedInput2.value) {
      percentOwnedInput2.value = '0'; 
  }
  } else {
    percentOwnedField2.style.display = 'none';
  }
});



function openEditModal(employeeId) {
  fetch(`http://localhost:3000/employee/${employeeId}`)
    .then(response => response.json()) 
    .then(employee => {
      document.getElementById('employeeName').value = employee.name;
      document.getElementById('employeeEmail').value = employee.email;
      document.getElementById('employeeSalary').value = employee.salary;
      document.getElementById('employeeSSN').value = employee.ssn;
      document.getElementById('employeeSchedule').value = employee.schedule;
      document.getElementById('employeePassword').value = employee.password;

      const roleSelect = document.getElementById('roleSelect');
      roleSelect.value = employee.role;
  
      const percentOwnedField = document.getElementById('percentOwnedField');
      if (employee.role === 'Barista') {
        percentOwnedField.style.display = 'none';  
      } else {
        percentOwnedField.style.display = 'block';  
        document.getElementById('percentOwned').value = employee.percent_own || '';  
      }
  

      openModal('editFormModal');
    })
    .catch(error => {
      console.error('err', error);
      alert('couldnt load employee data for editing');
    });
}
  