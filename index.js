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
app.use("/photos", express.static("photos")); // Cho phép truy cập ảnh qua URL: /photos/ten-file.png

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
    const queryText = `
      SELECT 
        a.*, 
        g.name AS guest_name, 
        r.name AS staff_name,
        r.image AS staff_img
      FROM account a 
      LEFT JOIN guest g ON a.id_guest = g.id
      LEFT JOIN receptionist r ON a.id_receptionist = r.id 
      WHERE a.phone = $1
      ORDER BY a.id ASC
    `;

    const result = await db.query(queryText, [phone]);
    console.log(result.rows[0]);
    // Trả về user đầu tiên tìm thấy (hoặc null nếu không thấy)
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Lỗi tại getUserByPhone:", error);
    return null;
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
app.get("/admin", (req, res) => {
  res.render("admin-index.ejs");
});
app.get("/404", (req, res) => {
  res.render("404.ejs");
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

//CHECKOUT
app.get("/admin/invoice", (req, res) => {
  res.render("admin-invoice.ejs");
});
app.get("/admin/invoice/create", (req, res) => {
  res.render("admin-invoice-create.ejs");
});

//CHECKIN
app.get("/admin/checkin", (req, res) => {
  res.render("admin-checkin.ejs");
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
  if (!user) {
    return res.json({ success: false, message: "Số điện thoại không tồn tại" });
  }

  if (password !== user.password) {
    return res.json({ success: false, message: "Sai mật khẩu" });
  }

  req.session.user = user;
  res.json({ success: true, user: user });
});
app.get("/logout", (req, res) => {
  req.session.destroy();

  res.json({ success: true });
});
app.get("/me", (req, res) => {
  // 1. Kiểm tra nếu chưa đăng nhập
  if (!req.session.user) {
    return res.json({ logged: false });
  }
  // 2. Danh sách các Role được phép truy cập
  const allowedRoles = ["admin", "staff"];
  // Kiểm tra role của user hiện tại có nằm trong danh sách không
  if (!allowedRoles.includes(req.session.user.role)) {
    return res.json({
      logged: true,
      authorized: false, // Đã đăng nhập nhưng không đủ quyền
    });
  }
  // 3. Nếu hợp lệ
  res.json({
    logged: true,
    authorized: true,
    user: req.session.user, // Chứa thông tin role, phone, v.v.
  });
});

//STATS
app.get("/api/admin/stats", async (req, res) => {
  try {
    const queries = {
      // 1. Doanh thu hôm nay
      dailyRevenue: `
        SELECT COALESCE(SUM(final_price), 0) as total 
        FROM bill 
        WHERE created_at::date = CURRENT_DATE`,

      // 2. Doanh thu tháng này
      monthlyRevenue: `
        SELECT COALESCE(SUM(final_price), 0) as total 
        FROM bill 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,

      // 3. Tổng số khách hàng
      totalGuests: `SELECT COUNT(*) as total FROM guest`,

      // 4. So sánh doanh thu tháng này vs tháng trước
      growthMonth: `
        WITH monthly AS (
          SELECT 
            SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN final_price ELSE 0 END) as current_m,
            SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN final_price ELSE 0 END) as last_m
          FROM bill
        )
        SELECT 
          CASE 
            WHEN last_m = 0 THEN 100 
            ELSE ROUND(((current_m - last_m)::numeric / last_m) * 100, 2) 
          END as percent
        FROM monthly`,

      // 5. So sánh doanh thu tuần này vs tuần trước
      growthWeek: `
        WITH weekly AS (
          SELECT 
            SUM(CASE WHEN DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE) THEN final_price ELSE 0 END) as current_w,
            SUM(CASE WHEN DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week') THEN final_price ELSE 0 END) as last_w
          FROM bill
        )
        SELECT 
          CASE 
            WHEN last_w = 0 THEN 100 
            ELSE ROUND(((current_w - last_w)::numeric / last_w) * 100, 2) 
          END as percent
        FROM weekly`,
    };

    // Chạy tất cả query cùng lúc để tối ưu hiệu năng
    const [daily, monthly, guests, growthM, growthW] = await Promise.all([
      db.query(queries.dailyRevenue),
      db.query(queries.monthlyRevenue),
      db.query(queries.totalGuests),
      db.query(queries.growthMonth),
      db.query(queries.growthWeek),
    ]);

    res.json({
      dailyRevenue: parseInt(daily.rows[0].total),
      monthlyRevenue: parseInt(monthly.rows[0].total),
      totalGuests: parseInt(guests.rows[0].total),
      growthMonth: parseFloat(growthM.rows[0].percent),
      growthWeek: parseFloat(growthW.rows[0].percent),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi máy chủ khi truy vấn dữ liệu" });
  }
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
//API Lấy cụ thể hóa đơn theo khách hàng
app.get("/api/customer/:id/bills", async (req, res) => {
  const id = req.params.id;

  const result = await db.query(
    `
    SELECT 
      bill.id,
      package.name as package_name,
      bill.original_price,
      bill.discount,
      bill.final_price,
      bill.created_at
    FROM bill
    JOIN package ON bill.id_package = package.id
    WHERE bill.id_guest = $1
    ORDER BY bill.created_at DESC
  `,
    [id]
  );

  res.json(result.rows);
});
// API Thêm mới khách hàng
app.post("/api/customer", upload.single("image"), async (req, res) => {
  const { name, phone } = req.body;
  const face = JSON.parse(req.body.face);
  console.log(face);
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
    INSERT INTO guest (name, phone,face_embedding)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  const result = await db.query(query, [name, phone, face]);
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
  await db.query(query_account, [phone, "123456", "user", newID]);

  res.json({ success: true });
});
//API Sửa khách hàng
app.put("/api/customer/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, end_date, status, note } = req.body;
  const query = `
UPDATE guest
SET 
    name = $1,
    phone = $2,
    end_date = $3,
    status = $4,
    note = $5
WHERE id = $6
`;
  const values = [name, phone, end_date, status, note, id];
  await db.query(query, values);

  const queryAccount = `
UPDATE account
SET 
    phone = $1
WHERE id_guest = $2
`;
  const valuesAccount = [phone, id];
  await db.query(queryAccount, valuesAccount);
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
  // 1. Insert vào bảng guest để lấy ID
  const query = `
    INSERT INTO receptionist (name, phone)
    VALUES ($1, $2)
    RETURNING id
  `;
  const result = await db.query(query, [name, phone]);
  const newID = result.rows[0].id;
  // 2. Tạo account
  const query_account = `
    INSERT INTO account (phone, password, role, id_receptionist)
    VALUES ($1, $2, $3, $4)
  `;
  await db.query(query_account, [phone, "123456", "staff", newID]);
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

  const queryAccount = `
UPDATE account
SET 
    phone = $1
WHERE id_receptionist = $2
`;
  const valuesAccount = [phone, id];
  await db.query(queryAccount, valuesAccount);
  res.json({ message: "Đã sửa nhân viên" });
});
// API XÓA Nhân Viên
app.delete("/api/staff/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.query("DELETE FROM account WHERE id_guest = $1", [id]);
  await db.query("DELETE FROM receptionist WHERE id = $1", [id]);
  res.json({ message: "Đã xóa khách hàng" });
});

//API Hoá Đơn
// API Lấy danh sách Hoá Đơn
app.get("/api/bills", async (req, res) => {
  const result = await db.query(`
    SELECT
    bill.id,
    guest.name AS guest_name,
    receptionist.name AS receptionist_name,
    package.name AS package_name,
    bill.original_price,
    bill.discount,
    bill.final_price,
    bill.created_at
FROM bill
LEFT JOIN guest ON bill.id_guest = guest.id
LEFT JOIN receptionist ON bill.id_receptionist = receptionist.id
LEFT JOIN package ON bill.id_package = package.id
ORDER BY bill.created_at DESC;
  `);

  res.json(result.rows);
});
// API Lấy bill theo id
app.get("/api/bills/:id", async (req, res) => {
  const id = req.params.id;
  const result = await db.query(
    `
    SELECT
    b.*,
    g.name as guest_name,
    p.name as package_name,
    s.name as receptionist_name

    FROM bill b
    LEFT JOIN guest g ON b.id_guest = g.id
    LEFT JOIN package p ON b.id_package = p.id
    LEFT JOIN receptionist s ON b.id_receptionist = s.id

    WHERE b.id = $1
    `,
    [id]
  );
  res.json(result.rows[0]);
});
// API Lấy hóa đơn theo ngày
app.get("/api/bill-filter", async (req, res) => {
  const { from, to } = req.query;

  let sql = `
    SELECT
      bill.id,
      guest.name AS guest_name,
      receptionist.name AS receptionist_name,
      package.name AS package_name,
      bill.original_price,
      bill.discount,
      bill.final_price,
      bill.created_at
    FROM bill
    LEFT JOIN guest ON bill.id_guest = guest.id
    LEFT JOIN receptionist ON bill.id_receptionist = receptionist.id
    LEFT JOIN package ON bill.id_package = package.id
    WHERE 1=1
  `;

  const params = [];
  let i = 1;

  if (from) {
    sql += ` AND bill.created_at >= $${i}`;
    params.push(from);
    i++;
  }

  if (to) {
    sql += ` AND bill.created_at <= $${i}`;
    params.push(to + " 23:59:59");
    i++;
  }

  sql += ` ORDER BY bill.created_at DESC`;

  const result = await db.query(sql, params);
  res.json(result.rows);
});
// API Tạo Hóa Đơn
app.post("/api/bill", async (req, res) => {
  const { id_guest, id_receptionist, id_package, discount } = req.body;

  // Lấy price + duration_month của package
  const pkg = await db.query(`SELECT price, duration_month FROM package WHERE id=$1`, [id_package]);

  const original_price = pkg.rows[0].price;
  const duration = pkg.rows[0].duration_month;

  const final_price = original_price - (original_price * discount) / 100;

  // Tạo bill
  const result = await db.query(
    `INSERT INTO bill
    (id_guest,id_receptionist,id_package,original_price,discount,final_price)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id, created_at`,
    [id_guest, id_receptionist, id_package, original_price, discount, final_price]
  );

  const created_at = result.rows[0].created_at;

  // Lấy end_date hiện tại của khách
  const guest = await db.query(`SELECT end_date FROM guest WHERE id=$1`, [id_guest]);

  const end_date = guest.rows[0].end_date;

  let new_end_date;

  if (!end_date || end_date < new Date()) {
    // TH1 + TH2
    new_end_date = await db.query(`SELECT ($1::date + INTERVAL '1 month' * $2) AS date`, [created_at, duration]);
  } else {
    // TH3
    new_end_date = await db.query(`SELECT ($1::date + INTERVAL '1 month' * $2) AS date`, [end_date, duration]);
  }

  const final_end_date = new_end_date.rows[0].date;

  // Update guest
  await db.query(`UPDATE guest SET end_date=$1 WHERE id=$2`, [final_end_date, id_guest]);

  res.json({
    id: result.rows[0].id,
    new_end_date: final_end_date,
  });
});

//API CHECKIN
//Checkin
app.post("/api/checkin", async (req, res) => {
  const face = req.body.face;

  const customers = await db.query("select * from guest where face_embedding is not null");

  let bestMatch = null;
  let minDistance = 999;

  for (const c of customers.rows) {
    const dbFace = c.face_embedding;

    let sum = 0;

    for (let i = 0; i < 128; i++) {
      sum += Math.pow(face[i] - dbFace[i], 2);
    }

    const distance = Math.sqrt(sum);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = c;
    }
  }

  if (minDistance < 0.5) {
    res.json({ customer: bestMatch });
  } else {
    res.json({ customer: null });
  }
});

//API Realtime
// API lấy khách hàng realtime
app.get("/api/search_customer", async (req, res) => {
  const search = req.query.search || "";
  const values = [`${search}%`];
  const query = `
    SELECT *
    FROM guest
    WHERE name ILIKE $1
    OR phone ILIKE $1
  `;
  const result = await db.query(query, values);
  res.json(result.rows);
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
