

async function loadAccounting() {
    const start = document.getElementById('startTimestamp').value;
    const end   = document.getElementById('endTimestamp').value;

    if (!start || !end) {
      return alert('select valid times.');
    }
    if (new Date(end) < new Date(start)) {
      return alert('select valid times.');
    }



    const res = await fetch(
        `/accounting-records?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    // if (!res.ok) throw new Error('Server error');
    records = await res.json();


    net = 0.00;
    
    if (records.length) {
      const first = parseFloat(records[0].account_balance);
      const last  = parseFloat(records[records.length - 1].account_balance);
      net = last - first;
    }
    document.getElementById('amount').textContent = net.toFixed(2);
    const container = document.getElementById('records');
    container.innerHTML = '';
    const table = document.createElement('table');
    table.innerHTML = `
      <thead><tr><th>Timestamp</th><th>Balance</th></tr></thead>
    `;
    const tbody = document.createElement('tbody');
    records.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(r.timestamp).toLocaleString()}</td>
        <td>$${parseFloat(r.account_balance).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }