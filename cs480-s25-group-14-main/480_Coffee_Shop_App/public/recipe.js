

document.addEventListener('DOMContentLoaded', fetchRecipeCards);

async function fetchRecipeCards(){

    const recipeCardsContainer = document.getElementById('recipe_cards');
    const backButton = document.getElementById('back-to-orders');
    backButton.style.display = 'none';

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const role = urlParams.get('role');
   

    const resp = await fetch(`/order-details?order_id=${orderId}`);
    orderDetails = await resp.json();

    const items = orderDetails.line_items || orderDetails.items || [];
    
    items.forEach(async item => {
        let steps = [];
    
        const prepRes = await fetch(
            `/preparation-steps?recipe_name=${encodeURIComponent(item.drink)}`
        );
        if (prepRes.ok) {
            steps = await prepRes.json();
        }
       

        // one card per line item
        for (let i = 0; i < item.quantity; i++) {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.dataset.drink = item.drink;

            const drinkName = document.createElement('h2');
            drinkName.textContent = item.drink;
            const quantity = document.createElement('p');
            quantity.textContent = `Quantity: ${item.quantity}`;

            // build prep steps
            const stepList = document.createElement('ol');
            stepList.classList.add('prep-steps');
            steps.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step.description_name;
                stepList.appendChild(li);
            });

            const sendButton = document.createElement('button');
            sendButton.textContent = 'Send: Drink Ready';
            sendButton.addEventListener('click', () => {
                recipeCard.remove();
                if (recipeCardsContainer.querySelectorAll('.recipe-card').length === 0) {
                    backButton.style.display = 'block';
                    fetch('/complete-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: orderDetails.order_id })
                }).then(() => {
                    backButton.style.display = 'block';
                });
                }
            });

            recipeCard.append(drinkName, quantity, stepList, sendButton);
            recipeCardsContainer.appendChild(recipeCard);
        }
    });



    backButton.addEventListener('click', () => {
        window.location.href = `orders.html?role=${role}`;
      });

}






