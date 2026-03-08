import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// 1. KẾT NỐI DATABASE
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

// 2. MIDDLEWARES & CẤU HÌNH PHỤC VỤ FILE TĨNH
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public")); // Thư mục chứa CSS/JS frontend
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads")); // Cho phép truy cập ảnh qua URL: /uploads/ten-file.png

// 3. CẤU HÌNH MULTER (XỬ LÝ UPLOAD ẢNH)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, "temp_" + Date.now() + ".png"); // Tên tạm để tránh trùng lặp lúc đang xử lý
  },
});
const upload = multer({ storage });

// 4. CÁC HÀM TRUY VẤN (HELPER FUNCTIONS)
// Lấy toàn bộ tài khoản
async function getUsers() {
  try {
    const result = await db.query("SELECT * FROM account ORDER BY id ASC");
    let users = result.rows;
    return users;
  } catch (error) {
    console.log("co loi getUsers");
  }
}
// Lấy tra tài khoản qua SĐT
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

// Lấy toàn bộ khách hàng
async function getCustomer() {
  try {
    const result = await db.query("SELECT * FROM guest ORDER BY id ASC");
    let users = result.rows;
    return users;
  } catch (error) {
    console.log("co loi getCustomer");
  }
}
// Lấy tra khách hàng qua ID
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
// Lấy tra khách hàng qua SĐT
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

// Lấy toàn bộ nhân viên
async function getStaff() {
  try {
    const result = await db.query("SELECT * FROM receptionist ORDER BY id ASC");
    let staffs = result.rows;
    return staffs;
  } catch (error) {
    console.log("co loi getStaff");
  }
}
// Lấy tra khách hàng qua ID
async function getStaffByID(id) {
  try {
    const result = await db.query("SELECT * FROM receptionist WHERE id = $1", [id]);
    let staff = result.rows;
    return staff;
  } catch (error) {
    console.log(error);
    console.log("co loi getStaffByID");
  }
}

// Lấy toàn bộ gói tập
async function getPackage() {
  try {
    const result = await db.query("SELECT * FROM package ORDER BY id ASC");
    let packages = result.rows;
    return packages;
  } catch (error) {
    console.log("co loi getPackage");
  }
}
// Lấy gói tập qua ID
async function getPackageByID(id) {
  try {
    const result = await db.query("SELECT * FROM package WHERE id = $1", [id]);
    let packages = result.rows;
    return packages;
  } catch (error) {
    console.log(error);
    console.log("co loi getPackageByID");
  }
}

// 5. CÁC ROUTE ĐIỀU HƯỚNG GIAO DIỆN (GET)
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
app.get("/admin/customer", (req, res) => {
  res.render("admin-customer.ejs");
});
app.get("/admin/customer/create", (req, res) => {
  res.render("admin-customer-create.ejs");
});
app.get("/admin/customer/edit", (req, res) => {
  res.render("admin-customer-edit.ejs");
});

//STAFF
app.get("/admin/staff", (req, res) => {
  res.render("admin-staff.ejs");
});
app.get("/admin/staff/create", (req, res) => {
  res.render("admin-staff-create.ejs");
});
app.get("/admin/staff/edit", (req, res) => {
  res.render("admin-staff-edit.ejs");
});

//PACKAGE
app.get("/admin/package", (req, res) => {
  res.render("admin-package.ejs");
});
app.get("/admin/package/create", (req, res) => {
  res.render("admin-package-create.ejs");
});
app.get("/admin/package/edit", (req, res) => {
  res.render("admin-package-edit.ejs");
});

// 6. HỆ THỐNG API CHÍNH
// API Đăng nhập
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

// API Khách Hàng
// API Lấy danh sách khách hàng
app.get("/api/customer", async (req, res) => {
  const customers = await getCustomer();
  res.json(customers);
});
// API Lấy cụ thể khách hàng
app.get("/api/customer/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const customer = await getCustomerByID(id);
  if (!customer) return res.status(404).json({ message: "Not found" });
  res.json(customer[0]);
});
// API Thêm mới khách hàng
app.post("/api/customer", upload.single("image"), async (req, res) => {
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

  res.json({ success: true });
});
//API Sửa khách hàng
app.put("/api/customer/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, start_date, end_date, status, note } = req.body;
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
`;
  const values = [name, phone, start_date, end_date, status, note, id];
  await db.query(query, values);
  res.json({ message: "Đã sửa khách hàng" });
});
// API Xóa Khách Hàng
app.delete("/api/customer/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  // Lưu ý: Nên xóa account trước vì có khóa ngoại ID_Guest
  await db.query("DELETE FROM account WHERE id_guest = $1", [id]);

  // Kiểm tra xem có file ảnh không để xóa vật lý trong folder uploads
  const imagePath = path.join("uploads/", `${id}.png`);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  await db.query("DELETE FROM guest WHERE id = $1", [id]);
  res.json({ message: "Đã xóa khách hàng và ảnh liên quan" });
});

//API Gói Tập
// API Lấy danh sách Gói Tập
app.get("/api/package", async (req, res) => {
  const packages = await getPackage();
  res.json(packages);
});
// API Lấy cụ thể Gói Tập
app.get("/api/package/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const packages = await getPackageByID(id);
  console.log(packages);
  if (!packages) return res.status(404).json({ message: "Not found" });
  res.json(packages[0]);
});
// API Thêm mới Gói Tập
app.post("/api/package", async (req, res) => {
  const { name, duration, price } = req.body;
  console.log(name, duration, price);
  const query = `
    INSERT INTO package (name, duration_month, price)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  await db.query(query, [name, duration, price]);
  res.json({ success: true });
});
// API Sửa Gói Tập
app.put("/api/package/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, duration, price } = req.body;
  const query = `
UPDATE package
SET 
    name = $1,
    duration_month = $2,
    price = $3
WHERE id = $4
`;
  const values = [name, duration, price, id];
  await db.query(query, values);
  res.json({ message: "Đã sửa gói tập" });
});
// API XÓA Gói Tập
app.delete("/api/package/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.query("DELETE FROM package WHERE id = $1", [id]);
  res.json({ message: "Đã xóa gói tập" });
});

//API Nhân Viên
// API Lấy danh sách Nhân Viên
app.get("/api/staff", async (req, res) => {
  const staffs = await getStaff();
  res.json(staffs);
});
// API Lấy cụ thể Nhân Viên
app.get("/api/staff/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const staff = await getStaffByID(id);
  if (!staff) return res.status(404).json({ message: "Not found" });
  res.json(staff[0]);
});
// API Thêm mới Nhân Viên
app.post("/api/staff", async (req, res) => {
  const { name, phone } = req.body;
  const query = `
    INSERT INTO receptionist (name, phone)
    VALUES ($1, $2)
    RETURNING id
  `;
  await db.query(query, [name, phone]);
  res.json({ success: true });
});
//API Sửa Nhân Viên
app.put("/api/staff/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone } = req.body;
  const query = `
UPDATE receptionist
SET 
    name = $1,
    phone = $2
WHERE id = $3
`;
  const values = [name, phone, id];
  await db.query(query, values);
  res.json({ message: "Đã sửa nhân viên" });
});
// API XÓA Nhân Viên
app.delete("/api/staff/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.query("DELETE FROM receptionist WHERE id = $1", [id]);
  res.json({ message: "Đã xóa khách hàng" });
});

//API PT
// API Lấy danh sách PT
// API Lấy cụ thể PT
// API Thêm mới PT
// API XÓA PT

////////LISTEN
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
