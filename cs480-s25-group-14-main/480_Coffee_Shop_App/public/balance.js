
let coffeeShopBalance = 0; 

// when page loads view updates
document.addEventListener('DOMContentLoaded', fetchBalance);

async function fetchBalance() {

    const response = await fetch('/get-balance');
    const data = await response.json(); 
    
    // Ensure balance is parsed as a float (number)
    if (data.balance !== undefined) {
      coffeeShopBalance = parseFloat(data.balance);  
      updateBalanceUI();  
    }
}

// update UI
function updateBalanceUI() {
  const balanceElement = document.getElementById('balanceDisplay');
  balanceElement.textContent = `Coffee Shop Balance: $${coffeeShopBalance}`;
}