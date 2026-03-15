-- =========================
-- GUEST
-- =========================
CREATE TABLE guest (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    image TEXT,
    face_embedding FLOAT8[],    
    end_date DATE,
    status VARCHAR(20),
    note TEXT
);

-- =========================
-- RECEPTIONIST
-- =========================
CREATE TABLE receptionist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20),
    image TEXT
);

-- =========================
-- ACCOUNT (LOGIN + ROLE)
-- =========================
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20),
    password TEXT,
    role VARCHAR(20),
    id_guest INTEGER,
    id_receptionist INTEGER,

    FOREIGN KEY (id_guest) REFERENCES guest(id) ON DELETE CASCADE,
    FOREIGN KEY (id_receptionist) REFERENCES receptionist(id) ON DELETE CASCADE
);

-- =========================
-- PACKAGE
-- =========================
CREATE TABLE package (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    duration_month INTEGER,
    price INTEGER,
);

-- =========================
-- BILL
-- =========================
CREATE TABLE bill (
    id SERIAL PRIMARY KEY,
    id_guest INTEGER,
    id_receptionist INTEGER,
    id_package INTEGER,

    original_price INTEGER,
    discount INTEGER,
    final_price INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_guest) REFERENCES guest(id),
    FOREIGN KEY (id_receptionist) REFERENCES receptionist(id),
    FOREIGN KEY (id_package) REFERENCES package(id)
);

-- =========================
-- CHECKIN HISTORY
-- =========================
CREATE TABLE checkin_history (
    id SERIAL PRIMARY KEY,
    id_guest INTEGER,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_guest) REFERENCES guest(id) ON DELETE CASCADE
);

-- =========================
-- RESERVE (BẢO LƯU)
-- =========================
CREATE TABLE reserve (
    id SERIAL PRIMARY KEY,
    id_guest INTEGER,
    start_date DATE,
    end_date DATE,
    total_days INTEGER,

    FOREIGN KEY (id_guest) REFERENCES guest(id) ON DELETE CASCADE
);

-- =========================
-- PT
-- =========================
CREATE TABLE pt (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    experience TEXT,
    specialization TEXT,
    image TEXT
);

-- =========================
-- CONTACT REQUEST
-- =========================
CREATE TABLE contact_request (
    id SERIAL PRIMARY KEY,
    id_pt INTEGER,
    name VARCHAR(100),
    phone VARCHAR(20),
    time VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_pt) REFERENCES pt(id)
);

-- =========================
-- NEWS
-- =========================
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    date DATE,
    image TEXT
);

-- =========================
-- COMPLAIN
-- =========================
CREATE TABLE complain (
    id SERIAL PRIMARY KEY,
    id_guest INTEGER,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_guest) REFERENCES guest(id)
);