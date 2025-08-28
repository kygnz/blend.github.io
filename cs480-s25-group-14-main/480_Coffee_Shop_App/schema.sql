DROP TABLE IF EXISTS Accounting CASCADE;
DROP TABLE IF EXISTS Employee CASCADE;
DROP TABLE IF EXISTS Manager CASCADE;
DROP TABLE IF EXISTS Barista CASCADE;
DROP TABLE IF EXISTS user_login CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS barista_order CASCADE;
DROP TABLE IF EXISTS line_items CASCADE;
DROP TABLE IF EXISTS barista_line_items CASCADE;
DROP TABLE IF EXISTS order_line_items CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS promotion_menu CASCADE;
DROP TABLE IF EXISTS inventory_item CASCADE;
DROP TABLE IF EXISTS recipe CASCADE;
DROP TABLE IF EXISTS ingredient CASCADE;
DROP TABLE IF EXISTS preparation_step CASCADE;

-- Accounting entity
CREATE TABLE Accounting (
    timestamp TIMESTAMP PRIMARY KEY,
    account_balance NUMERIC(10,2)
);

-- ALTER TABLE Accounting OWNER TO postgres;
CREATE INDEX balance_id ON Accounting(account_balance);
INSERT INTO Accounting (timestamp, account_balance) 
VALUES (CURRENT_TIMESTAMP, 100.00);

-- Employee entity
CREATE TABLE Employee (
    ssn NUMERIC PRIMARY KEY,
    email VARCHAR,
    password VARCHAR,
    salary NUMERIC,
    name VARCHAR,
    role text,
    schedule VARCHAR
);

INSERT INTO Employee (ssn, email, password, salary, name, role, schedule)
VALUES (12345, 'rasleen', 'a', 50000, 'Rasleen', 'manager', 'Mon–Fri 09:00–17:00'),
  (45678, 'fariha', 'b', 50000, 'Fariha', 'barista', 'Tue–Thu 08:00–12:00'),
  (00000, 'kyla', 'c', 50000, 'Kyla', 'hybrid', 'Tue–Thu 08:00–12:00');


-- ALTER TABLE Employee OWNER TO postgres;
CREATE INDEX email_id ON Employee(email);

        INSERT INTO Employee(ssn,email,password,salary,name)
        VALUES (12345,'rasleen','a',50000,'Rasleen'),
        (45678,'fariha','b',50000,'Fariha'),
        (00000,'kyla','c',50000,'Kyla')
        ON CONFLICT DO NOTHING;


-- Manager entity
CREATE TABLE Manager (
    ssn NUMERIC PRIMARY KEY,
    percent_own NUMERIC CHECK (percent_own BETWEEN 0 AND 100),
    FOREIGN KEY (ssn) REFERENCES Employee (ssn) -- manager is a sub entity of employee
);
-- ALTER TABLE Manager OWNER TO postgres;
CREATE INDEX own_id ON Manager(percent_own);

INSERT INTO Manager (ssn, percent_own)
VALUES (12345, 80), 
  (00000,  15);

-- barista entity
CREATE TABLE Barista (
    ssn NUMERIC,
    day VARCHAR CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME,
    end_time TIME,
    PRIMARY KEY (ssn, day, start_time, end_time),
    FOREIGN KEY (ssn) REFERENCES Employee (ssn) -- barista is a sub entity of employee
);
-- ALTER TABLE Barista OWNER TO postgres;
INSERT INTO Barista (ssn, day, start_time, end_time)
VALUES (45678, 'Monday',    '09:00', '17:00'),
  (45678, 'Wednesday', '10:00', '18:00'),
  (00000, 'Tuesday',   '08:00', '12:00'),
  (00000, 'Thursday',  '12:00', '16:00')
ON CONFLICT DO NOTHING;
-- so that new users can register and existing users can log in
CREATE TABLE user_login (
    ssn NUMERIC,
    email TEXT PRIMARY KEY,
    password text,
    role text CHECK (role IN ('barista', 'manager', 'hybrid')),
    FOREIGN KEY (ssn) REFERENCES Employee(ssn)
);
-- ALTER TABLE user_login OWNER TO postgres;  

      INSERT INTO user_login(ssn, email,password,role)
        VALUES(12345, 'rasleen','a','manager'),
        (45678, 'fariha','b','barista'),
         (00000,'kyla','c', 'hybrid')
        ON CONFLICT DO NOTHING;


CREATE TABLE orders(
    order_id SERIAL PRIMARY KEY,
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE
);

-- barista makes an order - relationship
CREATE TABLE barista_order(
    ssn NUMERIC,
    day VARCHAR CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME,
    end_time TIME,
    order_id SERIAL,
    PRIMARY KEY (ssn, day, start_time, end_time, order_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id), -- these keys are from the barista entity
    FOREIGN KEY (ssn, day, start_time, end_time) REFERENCES Barista(ssn, day, start_time, end_time) -- these keys are from the orders entity
);


CREATE TABLE line_items( -- line items entity
    order_id SERIAL,
    drink VARCHAR(50),
    quantity INT,
    PRIMARY KEY(order_id,drink),
    FOREIGN KEY(order_id) REFERENCES orders(order_id) -- order_id is referenced from orders
);



-- barista makes line items - relationship
CREATE TABLE barista_line_items(
    ssn NUMERIC,
    day VARCHAR CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME,
    end_time TIME,
    order_id SERIAL NOT NULL,
    drink VARCHAR(50), -- only drink is needed since order id stores quantity
    PRIMARY KEY (ssn, day, start_time, end_time, order_id),
    FOREIGN KEY (ssn, day, start_time, end_time) REFERENCES Barista(ssn, day, start_time, end_time), -- these keys are from the barista entity
    FOREIGN KEY (order_id, drink) REFERENCES line_items(order_id, drink) -- these keys are from the line_items entity
);


CREATE TABLE menu (  -- table for entity menu
    recipe_name VARCHAR(100) PRIMARY KEY,
    size INT,
    type VARCHAR(50),
    temp_drink VARCHAR(50) CHECK (temp_drink IN ('Hot', 'Cold')),
    price NUMERIC(10,2),
    i_url VARCHAR
);


INSERT INTO menu (recipe_name, size, type, temp_drink, price, i_url)
VALUES 
    ('Iced Tea', 5, 'Tea', 'Cold', 4.50, 'https://images.themodernproper.com/production/posts/IcedTea_8.jpg?w=1200&q=82&auto=format&fit=crop&dm=1716306653&s=18373e4fe8a89b94c5cfe7c6c9ed6d94'),
    ('Hot Matcha', 8, 'Tea', 'Hot', 7.80, 'https://www.sugimotousa.com/asset/5f6d2413c43f9'),
    ('Cappuccino', 4, 'Coffee', 'Hot', 6.50, 'https://prod-app.breville.com/thumbnail/recipe/1726116895/Italian+Capuccino+with+chocolate+1080x1440_1080x1440.jpg'),
    ('Caramel Latte', 8, 'Coffee', 'Hot', 6.50, 'https://www.forkinthekitchen.com/wp-content/uploads/2022/06/220518.homemade.caramel.latte-6630.jpg'),
    ('Iced Coke', 4, 'Soft Drink', 'Cold', 2.00, 'https://thumbs.dreamstime.com/b/refreshing-glass-iced-cola-drink-ice-cubes-refreshing-glass-iced-cola-drink-ice-cubes-created-help-333612512.jpg'),
    ('Iced Fanta', 4, 'Soft Drink', 'Cold', 2.00, 'https://static.vecteezy.com/system/resources/previews/030/658/483/large_2x/fanta-exotic-with-white-background-high-quality-ultra-free-photo.jpg');




-- ALTER TABLE barista_line_items OWNER TO postgres;
CREATE TABLE order_line_items ( --relationship table between orders and menu
    order_id SERIAL,
    recipe_name VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2),
    PRIMARY KEY (order_id, recipe_name),
    FOREIGN KEY(order_id) REFERENCES orders(order_id), 
    FOREIGN KEY(recipe_name) REFERENCES menu(recipe_name) 
);


CREATE TABLE promotions ( -- table for entity promotions
    promotion_id SERIAL PRIMARY KEY,
    promotion_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    discount_pct NUMERIC(5,2) NOT NULL, -- discount percentage added
    active BOOLEAN DEFAULT TRUE
);
-- ALTER TABLE promotions OWNER TO postgres;


CREATE TABLE promotion_menu ( -- relationship table between menu and promotions
    promotion_id INT NOT NULL,
    recipe_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (promotion_id, recipe_name),
    FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id), -- foreign key to reference
    FOREIGN KEY (recipe_name) REFERENCES menu(recipe_name) -- foreign key to reference
);
-- ALTER TABLE promotion_menu OWNER TO postgres;


CREATE TABLE inventory_item (
    inventory_name text PRIMARY KEY,
    unit text,
    price float,
    stock integer

);
-- ALTER TABLE inventory_item OWNER TO postgres;

INSERT INTO inventory_item (inventory_name, unit, price, stock)
VALUES 
    ('Coffee Roast', 'oz', 10, 128),
    ('Milk', 'oz', 3, 128),
    ('Sugar', 'g', 2, 128),
    ('Matcha Powder', 'g', 2, 128),
    ('Cream', 'oz', 6, 128),
    ('Syrup', 'oz', 10, 128),
    ('Water', 'ml', 0, 128),
    ('Ice', 'oz', 0, 128),
    ('Fanta', 'oz', 10, 128),
    ('Tea', 'oz', 10, 128),
    ('Coke', 'oz', 10, 128);
    


-- -Recipe table: primary key recipe_name, Strong entity
CREATE TABLE recipe (
    recipe_name text PRIMARY KEY
);
-- ALTER TABLE recipe OWNER TO postgres;
INSERT INTO recipe(recipe_name)
VALUES
    ('Iced Tea'),
    ('Hot Matcha'),
    ('Cappuccino'),
    ('Caramel Latte'),
    ('Iced Coke'),
    ('Iced Fanta');




--Ingredient Table: primary key ingredient_id, other attributes 
-- inventory_name, recipe_name, unit, and quantity
-- Week entity where inventory_name references the primary key 
-- in inventory_item, and recipe_name references primary ker in recipe
-- Index created on ingredient name
CREATE TABLE ingredient (
    ingredient_id SERIAL PRIMARY KEY,
    inventory_name text,
    recipe_name text,
    unit text,
    quantity INT,
    FOREIGN KEY (inventory_name) REFERENCES inventory_item(inventory_name),
    FOREIGN KEY (recipe_name) REFERENCES recipe(recipe_name)
);
-- ALTER TABLE ingredient OWNER TO postgres;
CREATE INDEX ingredient_name ON ingredient(inventory_name);
INSERT INTO ingredient (inventory_name, recipe_name, unit, quantity) 
VALUES
    ('Tea', 'Iced Tea', 'oz', 2),
    ('Ice', 'Iced Tea', 'oz', 6),
    ('Sugar', 'Iced Tea', 'g', 56.7),
    ('Water', 'Iced Tea', 'ml', 59),

    ('Matcha Powder', 'Hot Matcha', 'oz', 2),
    ('Milk', 'Hot Matcha', 'oz', 2),
    ('Sugar', 'Hot Matcha', 'g', 56.7),
    ('Syrup', 'Hot Matcha', 'oz', 2),

    ('Coffee Roast', 'Cappuccino', 'oz', 2),
    ('Sugar', 'Cappuccino', 'g', 56.7),
    ('Milk', 'Cappuccino', 'oz', 2),
    ('Water', 'Cappuccino', 'ml', 59),
    ('Syrup', 'Cappuccino', 'oz', 2),
    ('Cream', 'Cappuccino', 'oz', 2),

    ('Coffee Roast', 'Caramel Latte', 'oz', 2),
    ('Sugar', 'Caramel Latte', 'g', 56.7),
    ('Milk', 'Caramel Latte', 'oz', 2),
    ('Syrup', 'Caramel Latte', 'oz', 2),
    ('Cream', 'Caramel Latte', 'oz', 2),

    ('Coke', 'Iced Coke', 'oz', 8),
    ('Ice', 'Iced Coke', 'oz', 6),

    ('Fanta', 'Iced Fanta', 'oz', 8),
    ('Ice', 'Iced Fanta', 'oz', 6);

--Preparation_step table: has two primary keys, position and recipe_name 
--because position could be repeated across different recipes and recipe_name can be repeated across different positions in same recipe
-- Other attribute description_name, weak entity where the recipe_name references the primary key from recipe

CREATE TABLE preparation_step (
    position int,
    description_name text,
    recipe_name text,
    ingredient_id int,         
    quantity float,             
    unit text,   
    PRIMARY KEY (position, recipe_name, ingredient_id),
    FOREIGN KEY (recipe_name) REFERENCES recipe(recipe_name),
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id)
);
-- ALTER TABLE preparation_step OWNER TO postgres;

INSERT INTO preparation_step (position, description_name, recipe_name, ingredient_id, quantity, unit) 
VALUES
    (1, 'Steep tea leaves', 'Iced Tea', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Tea' AND inventory_name='Tea'), 2, 'oz'),
    (2, 'Add sugar', 'Iced Tea', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Tea' AND inventory_name='Sugar'), 56.7, 'g'),
    (3, 'Add ice', 'Iced Tea', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Tea' AND inventory_name='Ice'), 6, 'oz'),
    (4, 'Add water', 'Iced Tea', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Tea' AND inventory_name='Water'), 50, 'ml'),
    
    (1, 'Pull espresso shot', 'Cappuccino', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Cappuccino' AND inventory_name='Coffee Roast'), 2, 'oz'),
    (2, 'Steam milk', 'Cappuccino', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Cappuccino' AND inventory_name='Milk'), 2, 'oz'),
    (3, 'Add cream', 'Cappuccino', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Cappuccino' AND inventory_name='Cream'), 1, 'oz'),
   
    (1, 'Measure matcha powder', 'Hot Matcha', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Hot Matcha' AND inventory_name='Matcha Powder'), 2, 'oz'),
    (2, 'Add sugar', 'Hot Matcha', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Hot Matcha' AND inventory_name='Sugar'), 56.7, 'g'),
    (3, 'Steam milk', 'Hot Matcha', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Hot Matcha' AND inventory_name='Milk'), 2, 'oz'),
    (4, 'Add syrup', 'Hot Matcha', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Hot Matcha' AND inventory_name='Syrup'), 2, 'oz'),
    
    (1, 'Add espresso', 'Caramel Latte', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Caramel Latte' AND inventory_name='Coffee Roast'), 2, 'oz'),
    (2, 'Add sugar', 'Caramel Latte', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Caramel Latte' AND inventory_name='Sugar'), 56.7, 'g'),
    (3, 'Steam milk and add', 'Caramel Latte', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Caramel Latte' AND inventory_name='Milk'), 2, 'oz'),
    (4, 'Add cream', 'Caramel Latte', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Caramel Latte' AND inventory_name='Cream'), 2, 'oz'),
    (5, 'Add caramel syrup', 'Caramel Latte', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Caramel Latte' AND inventory_name='Syrup'), 2, 'oz'),
    
     (1, 'Pour Coke', 'Iced Coke', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Coke' AND inventory_name='Coke'), 8, 'oz'),
    (2, 'Add ice', 'Iced Coke', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Coke' AND inventory_name='Ice'), 6, 'oz'),
   
     (1, 'Pour Fanta', 'Iced Fanta', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Fanta' AND inventory_name='Fanta'), 8, 'oz'),
    (2, 'Add ice', 'Iced Fanta', (SELECT ingredient_id FROM ingredient WHERE recipe_name='Iced Fanta' AND inventory_name='Ice'), 6, 'oz');
   




--created indexes on a couple attributes below
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_menu_size ON menu(size);
CREATE INDEX idx_menu_type ON menu(type);
CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX description ON preparation_step(description_name);

