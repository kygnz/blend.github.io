document.addEventListener('DOMContentLoaded', setSidebar());

function setSidebar(){
    role = new URLSearchParams(location.search).get('role');

    const sidebar_options = document.getElementById('sidebar_options');
    if(role === 'manager'){
        sidebar_link = `
            <a href="accounting.html?role=${role}">Accounting</a>
            <a href="employees.html?role=${role}">Employees</a>
            <a href="inventory.html?role=${role}">Inventory</a>
             <a href="schedule.html?role=${role}">Schedule + Roster</a>
        `;
    }
    else if (role === 'barista') {
        sidebar_link = `
            <a href="menu.html?role=${role}">Menu</a>
            <a href="orders.html?role=${role}">Orders</a>
            
        `;
    } 
    else if (role === 'hybrid') {
        sidebar_link = `
            <a href="menu.html?role=${role}">Menu</a>
            <a href="orders.html?role=${role}">Orders</a>
            <a href="accounting.html?role=${role}">Accounting</a>
            <a href="employees.html?role=${role}">Employees</a>
            <a href="inventory.html?role=${role}">Inventory</a>
             <a href="schedule.html?role=${role}">Schedule + Roster</a>
        `;
    } 
    else {
        window.location.href = 'login.html';
        return;
    }
    sidebar_options.innerHTML = sidebar_link;
}