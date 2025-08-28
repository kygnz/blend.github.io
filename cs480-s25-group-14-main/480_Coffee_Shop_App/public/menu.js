total_price = 0;

// event listener to get the menu items from the database
document.addEventListener('DOMContentLoaded', setMenuLayout);



// sets the grid layout of all menu items
async function setMenuLayout(){
    grid = document.getElementById('menu_layout');

    const response = await fetch('/menu'); 
    const menu_items = await response.json();

    menu_items.forEach(item => {
        price = parseFloat(item.price);
        div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <img src="${item.i_url}" alt="${item.recipe_name}">
            <p>${item.recipe_name} - $${price}</p>
            <button onclick="addItem('${item.recipe_name}', ${price})">Add</button>
        `;
      grid.appendChild(div);
    });
}



// // when the button is clicked, an item is added to the cart
function addItem(name, price) {
    const list = document.getElementById('item-list');
    const item = document.createElement('li');
    item.textContent = `${name} - $${price}`;
  
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = function () {
      list.removeChild(item);
      total_price -= price;
      document.getElementById('total').textContent = `Total: $${total_price}`;
    };
  
    item.appendChild(removeBtn);
    list.appendChild(item);
  
    total_price += price;
    document.getElementById('total').textContent = `Total: $${total_price}`;
}



function goToPayment() { 
    document.querySelector('.main').style.display = 'none';
    document.querySelector('.selected-items').style.display = 'none';
    document.getElementById('payment-screen').style.display = 'block';
    
    const timestamp = document.getElementById('Timestamp').value;
    document.getElementById('final-total').textContent = `Total to Pay: $${total_price }`; 
}






function confirmPayment() { 
    const method = document.getElementById('payment-method').value; 
    const totalAmount = parseFloat(total_price.toFixed(2)); 
    const timestamp = document.getElementById('Timestamp').value;
    const lineItems = [];  
    const selectedItems = document.querySelectorAll('#item-list li'); 
    selectedItems.forEach(item => {
      const [name, price] = item.textContent.split(' - $'); 
      lineItems.push({ drink: name, quantity: 1, price: parseFloat(price) });  
    });
    
    const orderData = {
      payment_method: method,
      total_amount: totalAmount, 
      timestamp: timestamp,
      line_items: lineItems 
    };
    
    console.log("Sending order data:", orderData); 
    
    fetch('/create-order', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData) 
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        coffeeShopBalance += data.total_amount;
        
        updateBalanceUI();
        
        alert(`Payment of $${totalAmount} confirmed via ${method}. Thank you!`);
        const params = new URLSearchParams(location.search);
        const role = params.get('role');
        window.location.href = `orders.html?role=${role}`;  
      } else {
        alert('There was an error processing your payment.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was an error processing your payment.');
    });
}

// function confirmPayment(){
//     const method = document.getElementById('payment-method').value; 
//     const totalAmount = parseFloat(total_price.toFixed(2)); 
//     const timestamp = document.getElementById('Timestamp').value;
//     const lineItems = [];  
//     const selectedItems = document.querySelectorAll('#item-list li'); 
//     selectedItems.forEach(item => {
//       const [name, price] = item.textContent.split(' - $'); 
//       lineItems.push({ drink: name, quantity: 1, price: parseFloat(price) });  
//     });
    
//     const orderData = {
//       payment_method: method,
//       total_amount: totalAmount, 
//       timestamp: timestamp,
//       line_items: lineItems 
//     };


//     fetch('/create_order', {
//         method: 'POST', 
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(orderData) 
//     })
//     .then(response => response.json())
//     .then(result => {
//     if (result.success) {
//         coffeeShopBalance += result.total_amount;
//         updateBalanceUI();
//         alert(`Payment of $${totalAmount} confirmed via ${method}. Thank you!`);
//         const params = new URLSearchParams(location.search);
//         const role = params.get('role');
//         window.location.href = `orders.html?role=${role}`; 
//     } else {
//         alert('Error: payment cant be processed; Try again');
//     }})


   
//     // if(!result.success){
//     //     alert('Error: payment cant be processed; Try again');
//     // }

//     // coffeeShopBalance += result.total_amount;
//     // updateBalanceUI();
//     // alert(`Payment of $${totalAmount} confirmed via ${method}. Thank you!`);
//     // const params = new URLSearchParams(location.search);
//     // const role = params.get('role');
//     // window.location.href = `orders.html?role=${role}`; 

// }







