

 

inventoryItems = [];
cart = [];

async function fetchInventory() {
const response = await fetch('http://localhost:3000/inventory');
const data = await response.json();
inventoryItems = data;  
const inventoryGrid = document.getElementById('inventoryGrid');
inventoryGrid.innerHTML = ''; 

//inventory cards
data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
    <h3>${item.inventory_name}</h3>
    <p>Unit: ${item.unit}</p>
    <p>Price: $${item.price}</p>
    <p>Stock: ${item.stock}</p>
    <button onclick="addToCart('${item.inventory_name}')">Add to Cart</button>
    `;
    inventoryGrid.appendChild(card);
});
}

function addToCart(inventoryName) {
    const item = inventoryItems.find(item => item.inventory_name === inventoryName); // Use the fetched data
    if (item) {
       
        const existingItem = cart.find(cartItem => cartItem.inventory_name === inventoryName);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                inventory_name: item.inventory_name,
                recipe_name: item.recipe_name, 
                price: item.price,
                quantity: 1
            });
        }
        
        updateTotalPrice(); 
    }
}

function updateTotalPrice() {
  const totalPrice = cart.reduce((total, item) =>
    total + item.price * item.quantity,
  0);
  document.getElementById('totalPrice').textContent =
    `Total: $${totalPrice}`;
}

async function buyItems() {
    if (cart.length === 0) {
      return alert('nothing has been selected');
    }
    const line_items = cart.map(i => ({
      inventory_name: i.inventory_name,
      quantity: i.quantity
    }));
  

      const resp = await fetch('/purchase-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items })
      });
      data = await resp.json();
  
  
    coffeeShopBalance -= data.totalCost;
    updateBalanceUI();
  
  
    cart = [];
    updateTotalPrice();
  
    // update stock
    await fetchInventory()
  
    alert(`Purchased inventory for $${data.totalCost}`);
  }
  



document.addEventListener('DOMContentLoaded', () => {
updateBalanceUI(); 
});

fetchInventory();


