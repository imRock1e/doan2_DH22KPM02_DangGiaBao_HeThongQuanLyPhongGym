import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
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
    cb(null, "temp_" + Date.now() + ".png"); // Tên tạm để tránh trùng lặp lúc đang xử lý
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

app.get("/api/customers/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const customer = await getCustomerByID(id);

  if (!customer) return res.status(404).json({ message: "Not found" });

  res.json(customer[0]);
});

app.post("/api/customers", upload.single("image"), async (req, res) => {
  const { name, phone } = req.body;

  // 1. Kiểm tra SĐT
  const result_check = await getCustomerByPhone(phone);
  if (result_check.length > 0) {
    // Nếu trùng, xóa file tạm vừa upload để tránh rác server
    if (req.file) fs.unlinkSync(req.file.path);
    return res.json({ success: false, message: "SĐT đã tồn tại" });
  }

  // 2. Insert vào bảng guest để lấy ID
  // Lưu ý: Lúc này cột image ta để trống hoặc null trước
  const query = `
    INSERT INTO guest (name, phone)
    VALUES ($1, $2)
    RETURNING id
  `;
  const result = await db.query(query, [name, phone]);
  const newID = result.rows[0].id;
  const newFileName = `${newID}.png`; // Tên file bạn muốn: id.png

  // 3. Đổi tên file vật lý từ "temp_..." sang "ID.png"
  if (req.file) {
    const oldPath = req.file.path;
    const newPath = path.join("uploads/", newFileName);

    fs.renameSync(oldPath, newPath); // Đổi tên file trên ổ cứng

    // 4. Cập nhật lại tên file chuẩn vào Database
    await db.query("UPDATE guest SET image = $1 WHERE id = $2", [newFileName, newID]);
  }

  // 5. Tạo account như cũ
  const query_account = `
    INSERT INTO account (phone, password, role, ID_Guest)
    VALUES ($1, $2, $3, $4)
  `;
  await db.query(query_account, [phone, "123455", "user", newID]);

  res.json({ success: true, id: newID });
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

  const query_account = `
DELETE FROM account
WHERE id_guest = $1
RETURNING *;
`;
  const values_account = [id];
  const result_account = await db.query(query_account, values_account);
  res.json({ message: "Deleted" });
});

////////LISTEN
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
