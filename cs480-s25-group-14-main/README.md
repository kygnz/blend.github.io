# cs480-s25-group-14
## Kyla, Rasleen, Fariha

## Instructions to Run

Our app uses html, css, javascript and postgresql to create a user interface for our coffee shop database relational schema<br><br>

Our app opens to a login page. Here are 3 login options, pre-initialized for demonstration:
Manager: Username "rasleen", password "a" <br>
Barista: Username "fariha", password "b" <br>
Hybrid (barista and manager): Username "kyla", password "c" <br><br>

To run: <br>
- install dependencies: npm install
- create the database: createdb -U postgres coffeedb
- load schema: psql -U postgres -d coffeedb -f schema.sql
- start express.js: node server.js
