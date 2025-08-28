
document.addEventListener('DOMContentLoaded', fetchSchedule);

async function fetchSchedule() {
  const infoTable = document.getElementById('info_table');
  const scheduleTable = document.getElementById('schedule_table');

  const eresult = await fetch('/employee');
  const employee = await eresult.json();

  const bresult = await fetch('/barista');
  const barista  = await bresult.json();

  // barista schedule table
  infoTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>SSN</th>
          <th>Name</th>
          <th>Role</th>
          <th>Salary</th>
        </tr>
      </thead>
      <tbody>
        ${employee.map(e => `
          <tr>
            <td>${e.ssn}</td>
            <td>${e.name}</td>
            <td>${e.role}</td>
            <td>$${parseFloat(e.salary)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // barista schedule tble
  scheduleTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Barista</th>
          <th>Day</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>
      <tbody>
        ${
          barista.length ? barista.map(s => {
                // find matching employee name by SSN
                const emp = employee.find(e => String(e.ssn) === String(s.ssn));
                const name = emp ? emp.name : `SSN ${s.ssn}`;
                const start = s.start_time.slice(0,5);
                const end = s.end_time.slice(0,5);
                return `
                  <tr>
                    <td>${name}</td>
                    <td>${s.day}</td>
                    <td>${start}</td>
                    <td>${end}</td>
                  </tr>
                `;
              }).join(''): `<tr><td colspan="4">No barista shifts found.</td></tr>`
        }
      </tbody>
    </table>
  `;
}
