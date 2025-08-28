document.addEventListener('DOMContentLoaded', fetchOrders);

async function fetchOrders(){

    const response = await fetch('/orders');
    if (!response.ok) throw new Error('Network error fetching orders');
    const orders = await response.json();

    const ordersContainer = document.getElementById('order_cards');
    const params = new URLSearchParams(location.search);
    const role = params.get('role');

    for (let order of orders) {
        const detailsRes = await fetch(
            `/order-details?order_id=${order.order_id}`
        );
        if (detailsRes.ok){
            const details = await detailsRes.json();

            const items = details.items || details.line_items || [];

            // Build the card
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');

            orderCard.dataset.orderId = order.order_id;
            const orderTitle = document.createElement('h2');
            orderTitle.textContent = `Order #${order.order_id}`;

            const paymentMethod = document.createElement('p');
            paymentMethod.textContent = `Payment Method: ${order.payment_method}`;
            
            const itemList = document.createElement('ul');
            const heading = document.createElement('strong');
            heading.textContent = 'Items:';
            
            itemList.appendChild(heading);

            items.forEach(item => {
                const drinkItem = document.createElement('li');
                drinkItem.textContent = `${item.quantity} x ${item.drink}`;
                itemList.appendChild(drinkItem);
            });

            orderCard.append(orderTitle, paymentMethod, itemList);

            orderCard.addEventListener('click', () => {
                window.location.href = `recipe.html?order_id=${order.order_id}&role=${role}`;
            });

            ordersContainer.appendChild(orderCard);
        }
    }
        
    
};
  
    