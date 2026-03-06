import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
////////DB
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "exotic_data",
  password: "533123",
  port: 5432,
});
db.connect();

////////CONST
const app = express();
const port = 3000;

////////USE
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

////////CONFIG
//////UPLOAD
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".png");
  },
});
const upload = multer({ storage });

////////FUNCTION
/////GET
//GET USER
async function getUsers() {
  try {
    const result = await db.query("SELECT * FROM account ORDER BY id ASC");
    let users = result.rows;
    return users;
  } catch (error) {
    console.log("co loi getUsers");
  }
}
async function getUserByPhone(phone) {
  try {
    const result = await db.query("SELECT * FROM account WHERE phone = $1", [phone]);
    let users = result.rows;
    return users;
  } catch (error) {
    console.log(error);
    console.log("co loi getUserByPhone");
  }
}

//GET CUSTOMERS
async function getCustomer() {
  try {
    const result = await db.query("SELECT * FROM guest ORDER BY id ASC");
    let users = result.rows;
    return users;
  } catch (error) {
    console.log("co loi getCustomer");
  }
}
async function getCustomerByID(id) {
  try {
    const result = await db.query("SELECT * FROM guest WHERE id = $1", [id]);
    let users = result.rows;
    return users;
  } catch (error) {
    console.log(error);
    console.log("co loi getCustomerByID");
  }
}
async function getCustomerByPhone(phone) {
  try {
    const result = await db.query("SELECT * FROM guest WHERE phone = $1", [phone]);
    let users = result.rows;
    return users;
  } catch (error) {
    console.log(error);
    console.log("co loi getCustomerByPhone");
  }
}

////////METHOD
//////GET
////LOGIN
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
////USER
app.get("/index", (req, res) => {
  res.render("index.ejs");
});
////ADMIN
app.get("/admin-index", (req, res) => {
  res.render("admin-index.ejs");
});

//CUSTOMER
app.get("/admin-customer", (req, res) => {
  res.render("admin-customer.ejs");
});
app.get("/new-customer", (req, res) => {
  res.render("admin-create-customer.ejs");
});
app.get("/edit-customer", (req, res) => {
  res.render("admin-edit-customer.ejs");
});

//////API
////LOGIN
app.post("/auth/login", async (req, res) => {
  const phone = req.body.phone;
  const password = req.body.password;
  console.log(phone, password);

  const user = await getUserByPhone(phone);
  console.log(user[0], user.length);

  if (!user || user.length === 0) {
    return res.json({ success: false });
  }

  if (password !== user[0].password) {
    return res.json({ success: false });
  }

  req.session.user = user[0];
  res.json({ success: true, user: user[0] });
});
app.get("/logout", (req, res) => {
  req.session.destroy();

  res.json({ success: true });
});
app.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.json({ logged: false });
  }
  res.json({
    logged: true,
    user: req.session.user,
  });
});
////CUSTOMER
app.get("/api/customers", async (req, res) => {
  const customers = await getCustomer();
  res.json(customers);
});

app.post("/api/customers", upload.single("image"), async (req, res) => {
  const { name, phone } = req.body;

  //kiểm tra đã có user qua số điện thoại chưa
  const result_check = await getCustomerByPhone(phone);
  if (result_check.length > 0) {
    return res.json({ success: false });
  }

  const query = `
  INSERT INTO guest (name, phone, image)
  VALUES ($1, $2, $3)
  RETURNING *
`;
  const values = [name, phone, req.file ? req.file.filename : null];
  const result = await db.query(query, values);
  const newID = result.rows[0].id;

  const query_account = `
  INSERT INTO account (phone, password, role, ID_Guest)
  VALUES ($1, $2, $3, $4)
`;
  const values_account = [phone, "123455", "user", newID];
  await db.query(query_account, values_account);
  res.json(result);
});

app.get("/api/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const customer = await getCustomerByID(id);
  if (!customer) return res.status(404).json({ message: "Not found" });
  res.json(customer[0]);
});

app.put("/api/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const customer = await getCustomerByID(id);
  if (!customer[0]) return res.status(404).json({ message: "Not found" });
  const { name, phone, start_date, end_date, status, note } = req.body;
  console.log(name, phone, start_date, end_date, status, note);
  const query = `
UPDATE guest
SET 
    name = $1,
    phone = $2,
    start_date = $3,
    end_date = $4,
    status = $5,
    note = $6
WHERE id = $7
RETURNING *;
`;
  const values = [name, phone, start_date, end_date, status, note, id];
  const result = await db.query(query, values);
  res.json(result);
});

app.delete("/api/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const query = `
DELETE FROM guest
WHERE id = $1
RETURNING *;
`;
  const values = [id];
  const result = await db.query(query, values);
  res.json({ message: "Deleted" });
});

////////LISTEN
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
