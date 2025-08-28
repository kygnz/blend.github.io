// postgres connection pool 
const {Pool} = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coffeedb',
    password: 'password',
    port: 5432,
  })

// Create express server
const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
app.use(express.urlencoded({extended: true}));
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));
  

// opening page of application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// redirects user after login based on role
app.post('/login_redirect', async (req, res) => {
    const email = req.body.email;

    const result = await pool.query(
        `SELECT role
        FROM user_login
        WHERE email=$1`,
    [email])

        if(result.rows.length === 1){  
            const role = result.rows[0].role;

            if (role === 'barista') {
                return res.redirect(`/barista.html?role=${encodeURIComponent(role)}`);
            } else if (role === 'manager') {
                return res.redirect(`/manager.html?role=${encodeURIComponent(role)}`);
            } else if (role === 'hybrid') {
                return res.redirect(`/hybrid.html?role=${encodeURIComponent(role)}`);
            } else{
                return res.redirect('/login.html');
            }
        }
        else {
            return res.redirect('/login.html');
        }

});


// get the menu options from the database
app.get('/menu', async (req, res) => {
    result = await pool.query('SELECT * FROM menu');
    res.json(result.rows);
});



async function updateInventoryAfterOrder(client, drink, quantity) {
 
      const ingredientRes = await client.query(
        'SELECT inventory_name, quantity, unit FROM ingredient WHERE recipe_name = $1',
        [drink]
      );
      for (let ingredient of ingredientRes.rows) {
        const { inventory_name, quantity: ingredientQty, unit: ingredientUnit } = ingredient;
        const totalIngredientQty = ingredientQty * quantity;
        
        const inventoryRes = await client.query(
          'SELECT unit, stock FROM inventory_item WHERE inventory_name = $1',
          [inventory_name]
        );

        const inventoryUnit = inventoryRes.rows[0].unit;
        const currentStock = inventoryRes.rows[0].stock;
  
        const adjustedQtyFloat = convertUnits(totalIngredientQty, ingredientUnit, inventoryUnit);
        const adjustedQty = Math.round(adjustedQtyFloat);
        const newStock = currentStock - adjustedQty;
  
        await client.query(
          'UPDATE inventory_item SET stock = $1 WHERE inventory_name = $2',
          [newStock, inventory_name]
        );
      }
   
  }
  
  
  
  app.post('/create-order', async (req, res) => {
    const { payment_method, timestamp, line_items } = req.body;
    const client = await pool.connect();
     
      const result = await client.query(
        'INSERT INTO orders (payment_method, time_stamp) VALUES ($1, $2) RETURNING order_id',
        [payment_method, timestamp]
      );
      const newOrderId = result.rows[0].order_id;
  
      let totalAmount = 0;
  
      // Insert into line_items table 
      for (let item of line_items) {
        await client.query(
          'INSERT INTO line_items (order_id, drink, quantity) VALUES ($1, $2, $3)',
          [newOrderId, item.drink, item.quantity]
        );
  
        await updateInventoryAfterOrder(client, item.drink, item.quantity);
  
        const price = parseFloat(item.price);  
        totalAmount += price * item.quantity;
      }
  
      totalAmount = parseFloat(totalAmount);
  
      await client.query(
        'UPDATE orders SET total_amount = $1 WHERE order_id = $2',
        [totalAmount, newOrderId]  
      );
  
      // Update the coffee shop balance
      const currentBalanceResult = await client.query('SELECT account_balance FROM Accounting ORDER BY timestamp DESC LIMIT 1');
      const balanceStr = currentBalanceResult.rows[0]?.account_balance;
      const currentBalance = balanceStr !== undefined? parseFloat(balanceStr) : 0;
  
  
        const newBalance = currentBalance + totalAmount;
  
      // Insert into Accounting - balance
      await client.query(
        'INSERT INTO Accounting (timestamp, account_balance) VALUES ($1, $2)',
        [new Date(), newBalance]
      );
  
    
      res.json({
        success: true,
        order_id: newOrderId,
        total_amount: totalAmount,
        timestamp: timestamp,
        line_items: line_items
      });
    
  });
  
  
  
  async function getDrinkPrice(drinkName) {
    // Fetch price from the menu
    const result = await pool.query('SELECT price FROM menu WHERE recipe_name = $1', [drinkName]);
  
    if (result.rows.length > 0) {
      const price = parseFloat(result.rows[0].price);
      return price;
    } else {
      throw new Error(`Price error`);
    }
  }


// Fetch the current account balance
app.get('/get-balance', async (req, res) => {
    
    const result = await pool.query('SELECT account_balance FROM Accounting ORDER BY timestamp DESC LIMIT 1');
    if (result.rows.length > 0) {
    res.json({ balance: result.rows[0].account_balance });
    } else {
    res.status(404).json({error: 'no balance'});
    }
   
  });
  

// function for unit conversion
function convertUnits(amount, from, to) {

    if (from === to) {
      return amount;
    }
  
    if (from === 'oz' && to === 'ml') {
      return amount * 29.5735;
    }
  
    if (from === 'ml' && to === 'oz') {
      return amount * (1 / 29.5735);
    }
  
    if (from === 'oz' && to === 'g') {
      return amount * 28.3495;
    }
  
    if (from === 'g' && to === 'oz') {
      return amount *  (1 / 28.3495);
    }
  
  }


// Mark order as completed
app.post('/complete-order', async (req, res) => {

    await pool.query(`
    UPDATE orders
        SET completed = TRUE
        WHERE order_id = $1
    `, [req.body.order_id]);
    res.json({ success: true });

});


// Only fetch open orders
app.get('/orders', async (req, res) => {
   
    const result = await pool.query(`
    SELECT *
        FROM orders
        WHERE completed = FALSE
    `);
    res.json(result.rows);

  });
  
  
  app.get('/order-details', async (req, res) => {
    const { order_id } = req.query; 
  
   
      const result = await pool.query(`
        SELECT orders.order_id, orders.time_stamp, orders.payment_method,
               json_agg(
                    json_build_object('drink', line_items.drink, 'quantity', line_items.quantity)
               ) AS items
        FROM orders
        LEFT JOIN line_items ON orders.order_id = line_items.order_id
        WHERE orders.order_id = $1  
        GROUP BY orders.order_id
      `, [order_id]);
  
      if (result.rows.length > 0) {
        res.json(result.rows[0]); 
      } else {
        res.status(404).json({error: 'error with orders' }); 
      }
    
  });

  

app.get('/preparation-steps', async (req, res) => {
    const { recipe_name } = req.query;
  
      const { rows } = await pool.query(
        `SELECT position, description_name
           FROM preparation_step
          WHERE recipe_name = $1
          ORDER BY position`,
        [recipe_name]
      );
      res.json(rows);
   
  });



  
app.get('/accounting-records', async (req, res) => {
  const{start, end } = req.query;

    const{rows} = await pool.query(
      `SELECT timestamp, account_balance
         FROM Accounting
        WHERE timestamp >= $1
          AND timestamp <= $2
        ORDER BY timestamp`,
      [start, end]
    );
    res.json(rows);
 
});



app.get('/inventory', async(req,res) =>{
      const {rows} = await pool.query('SELECT * FROM inventory_item');
      res.json(rows);
   
  });
  
  
app.post('/inventory',async (req,res) =>{
  const { inventory_name, unit, price, stock } = req.body;

    await pool.query(
      'INSERT INTO inventory_item (inventory_name, unit, price, stock) VALUES($1,$2,$3,$4)',
      [inventory_name,unit,price,stock]);
    res.send('Item added');
});
  
  
  app.put('/inventory/:inventory_name', async (req, res) => {
    const { inventory_name } = req.params;
    const { price, stock } = req.body;
  
      const result = await pool.query(
        'UPDATE inventory_item SET price = $1, stock = $2 WHERE inventory_name = $3',
        [price, stock, inventory_name]
      );
      res.send('Item updated');
   
  });





app.get('/employee', async(req,res) => {
      const result = await pool.query('SELECT * FROM employee');
      res.json(result.rows);
  
  });

  app.get('/barista', async(req,res) => {
    const result = await pool.query('SELECT * FROM barista');
    res.json(result.rows);

});
  
  
  app.post('/employee', async (req, res) => {
    const { name, email, ssn, salary, password, schedule, role, percentOwned } = req.body;

      const result = await pool.query(
        'INSERT INTO Employee (ssn, name, email, salary, password, schedule, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [ssn, name, email, salary, password, schedule, role] 
      );
      if (role === 'Manager' || role === 'Hybrid') {
        const percentOwnedValue = role === 'Manager' || role === 'Hybrid' ? percentOwned : null;
  
        await pool.query(
          'INSERT INTO Manager (ssn, percent_own) VALUES ($1, $2)',
          [ssn, percentOwnedValue]
        );
      }

      await pool.query(
        `INSERT INTO user_login (ssn, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        [ssn, email, password, role.toLowerCase()]
      );
  
      res.json(result.rows[0]);  
  
   
  });
  


  app.delete('/employee/:id', async (req, res) => {
    const { id } = req.params; 
    await pool.query('DELETE FROM Manager WHERE ssn = $1', [id]);
    await pool.query('DELETE FROM user_login WHERE ssn = $1', [id]);
    await pool.query('DELETE FROM Barista WHERE ssn = $1', [id]);
    
    const result = await pool.query(
        'DELETE FROM employee WHERE ssn = $1 RETURNING *',  
    [id]
    );
    res.send('Employee removed successfully');
 
  });
  
  

  app.put('/employee/:ssn', async (req, res) => {
    const { ssn } = req.params;  
    const { name, email, salary, password, schedule, role, percentOwned } = req.body;  
  
    const parsedSalary = parseFloat(salary);
   
  
    let updateSSN = ssn;  
    const { newSSN } = req.body;
  
    if (newSSN) {
      const result = await pool.query('SELECT * FROM employee WHERE ssn = $1', [newSSN]);
      if (result.rowCount > 0) {
        return res.send('New SSN is already in use');
      }
      updateSSN = newSSN; 
    }
  
   
      const result = await pool.query(
        'UPDATE employee SET name = $1, email = $2, salary = $3, password = $4, schedule = $5, ssn = $6, role = $7 WHERE ssn = $8 RETURNING *',
        [name, email, parsedSalary, password, schedule, updateSSN, role, ssn] 
      );
  
      if (result.rowCount > 0) {
    
  
        if (role === 'Manager' || role === 'Hybrid') {
            const percentOwnedValue = role === 'Manager' || role === 'Hybrid' ? percentOwned : null;
    
            await pool.query(
            'INSERT INTO Manager (ssn, percent_own) VALUES ($1, $2) ON CONFLICT (ssn) DO UPDATE SET percent_own = $2',
            [updateSSN, percentOwnedValue]  
            );
        }
    
        res.json(result.rows[0]);
    }
   
  });


  app.post('/purchase-inventory', async (req, res) => {
    const { line_items } = req.body;
    const client = await pool.connect();

      let totalCost = 0;
      for (let { inventory_name, quantity } of line_items) {
      
        const priceRes = await client.query(
          `SELECT price
             FROM inventory_item
            WHERE inventory_name = $1`,
          [inventory_name]
        );
        if (!priceRes.rows.length) {
          throw new Error(`No such inventory_item: ${inventory_name}`);
        }
        const unitPrice = parseFloat(priceRes.rows[0].price);
        totalCost += unitPrice * quantity;
  
        // increment stock
        await client.query(
          `UPDATE inventory_item
              SET stock = stock + $1
            WHERE inventory_name = $2`,
          [quantity, inventory_name]
        );
      }
  
      const balRes = await client.query(
        `SELECT account_balance
           FROM Accounting
          ORDER BY timestamp DESC
          LIMIT 1`
      );
      const currBal = balRes.rows.length? parseFloat(balRes.rows[0].account_balance):0;
      const newBal = currBal - totalCost;
  
      await client.query(
        `INSERT INTO Accounting (timestamp, account_balance)
         VALUES ($1, $2)`,
        [new Date(), newBal]
      );
  
      res.json({ success: true, totalCost });
    
  });
  
  
  
// login for creating new emp
app.post('/user-login', async (req, res) => {
    const { ssn, email, password, role } = req.body;
  
    try {
      await pool.query(
        'INSERT INTO user_login (ssn, email, password, role) VALUES ($1, $2, $3, $4)',
        [ssn, email, password, role]
      );
      res.json({ message: 'User login created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.json({ error: 'Error creating new user' });
    }
  });