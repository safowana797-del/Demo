import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'honey-ghee-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    images TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    payment_method TEXT DEFAULT 'COD',
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    expiry_date DATETIME
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Migration: Add long_description and images to products if they don't exist
try {
  db.prepare("ALTER TABLE products ADD COLUMN long_description TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE products ADD COLUMN images TEXT").run();
} catch (e) {}

// Seed Admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin',
    'admin@satkhira.com',
    hashedPassword,
    'admin'
  );
}

// Seed some products if empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const honeyImageUrl = 'https://lh3.googleusercontent.com/d/1w5jIdAlUmGt4PL0mRA3sgovuttzGo-Lu';
  const honeyImageUrl2 = 'https://lh3.googleusercontent.com/d/167oAoJjPndor9yGGQ6K-YuTzr_jARY7u';
  const gheeImageUrl = 'https://lh3.googleusercontent.com/d/1G8ckll4ZvAXKexhK03INnkS9lCzX8oLx';
  
  if (productCount.count === 0) {
    const products = [
      { 
        name: 'Sundarbans Honey (500g)', 
        price: 450, 
        category: 'Honey', 
        stock: 50, 
        image_url: honeyImageUrl,
        description: '১০০% খাঁটি সুন্দরবনের মধু।',
        long_description: 'সুন্দরবনের গভীর অরণ্য থেকে সংগৃহীত এই মধু সম্পূর্ণ প্রাকৃতিক এবং কোনো প্রকার ভেজাল মুক্ত। এতে রয়েছে প্রচুর পরিমাণে অ্যান্টি-অক্সিডেন্ট যা শরীরের রোগ প্রতিরোধ ক্ষমতা বাড়াতে সাহায্য করে।',
        images: JSON.stringify([honeyImageUrl, 'https://picsum.photos/seed/honey2/800/800', 'https://picsum.photos/seed/honey3/800/800', 'https://picsum.photos/seed/honey4/800/800'])
      },
      { 
        name: 'Pure Cow Ghee (500g)', 
        price: 850, 
        category: 'Ghee', 
        stock: 30, 
        image_url: gheeImageUrl,
        description: 'সাতক্ষীরার ঐতিহ্যবাহী খাঁটি গাওয়া ঘি।',
        long_description: 'সাতক্ষীরার বিখ্যাত গাওয়া ঘি যা তৈরি করা হয় সম্পূর্ণ ঘরোয়া পদ্ধতিতে। এর চমৎকার স্বাদ এবং ঘ্রাণ আপনার খাবারের স্বাদ বাড়িয়ে দেবে বহুগুণ।',
        images: JSON.stringify([gheeImageUrl, 'https://picsum.photos/seed/ghee2/800/800', 'https://picsum.photos/seed/ghee3/800/800', 'https://picsum.photos/seed/ghee4/800/800'])
      },
      { 
        name: 'Black Seed Honey (250g)', 
        price: 350, 
        category: 'Honey', 
        stock: 20, 
        image_url: honeyImageUrl2,
        description: 'কালো জিরার ফুলের মধু।',
        long_description: 'কালো জিরার ফুলের নির্যাস থেকে তৈরি এই মধু স্বাস্থ্যের জন্য অত্যন্ত উপকারী। এটি শ্বাসকষ্ট এবং হজমের সমস্যায় দারুণ কাজ করে।',
        images: JSON.stringify([honeyImageUrl2, 'https://picsum.photos/seed/bsh2/800/800', 'https://picsum.photos/seed/bsh3/800/800', 'https://picsum.photos/seed/bsh4/800/800'])
      },
      { 
        name: 'Mustard Oil (1L)', 
        price: 220, 
        category: 'Grocery', 
        stock: 100, 
        image_url: 'https://picsum.photos/seed/oil/400/400',
        description: 'ঘানি ভাঙা খাঁটি সরিষার তেল।',
        long_description: 'বাছাইকৃত সরিষা থেকে ঘানি ভাঙা পদ্ধতিতে তৈরি এই তেল রান্নায় আনে আসল স্বাদ। এতে কোনো প্রকার কৃত্রিম রঙ বা গন্ধ ব্যবহার করা হয়নি।',
        images: JSON.stringify(['https://picsum.photos/seed/oil/800/800', 'https://picsum.photos/seed/oil2/800/800', 'https://picsum.photos/seed/oil3/800/800', 'https://picsum.photos/seed/oil4/800/800'])
      },
    ];
    const insertProduct = db.prepare('INSERT INTO products (name, price, category, stock, image_url, description, long_description, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => insertProduct.run(p.name, p.price, p.category, p.stock, p.image_url, p.description, p.long_description, p.images));
  } else {
    // Update existing products to use the new images and descriptions
    const updateProduct = db.prepare('UPDATE products SET image_url = ?, description = ?, long_description = ?, images = ? WHERE name = ?');
    
    updateProduct.run(
      honeyImageUrl, 
      '১০০% খাঁটি সুন্দরবনের মধু।', 
      'সুন্দরবনের গভীর অরণ্য থেকে সংগৃহীত এই মধু সম্পূর্ণ প্রাকৃতিক এবং কোনো প্রকার ভেজাল মুক্ত। এতে রয়েছে প্রচুর পরিমাণে অ্যান্টি-অক্সিডেন্ট যা শরীরের রোগ প্রতিরোধ ক্ষমতা বাড়াতে সাহায্য করে।',
      JSON.stringify([honeyImageUrl, 'https://picsum.photos/seed/honey2/800/800', 'https://picsum.photos/seed/honey3/800/800', 'https://picsum.photos/seed/honey4/800/800']),
      'Sundarbans Honey (500g)'
    );

    updateProduct.run(
      gheeImageUrl, 
      'সাতক্ষীরার ঐতিহ্যবাহী খাঁটি গাওয়া ঘি।', 
      'সাতক্ষীরার বিখ্যাত গাওয়া ঘি যা তৈরি করা হয় সম্পূর্ণ ঘরোয়া পদ্ধতিতে। এর চমৎকার স্বাদ এবং ঘ্রাণ আপনার খাবারের স্বাদ বাড়িয়ে দেবে বহুগুণ।',
      JSON.stringify([gheeImageUrl, 'https://picsum.photos/seed/ghee2/800/800', 'https://picsum.photos/seed/ghee3/800/800', 'https://picsum.photos/seed/ghee4/800/800']),
      'Pure Cow Ghee (500g)'
    );

    updateProduct.run(
      honeyImageUrl2, 
      'কালো জিরার ফুলের মধু।', 
      'কালো জিরার ফুলের নির্যাস থেকে তৈরি এই মধু স্বাস্থ্যের জন্য অত্যন্ত উপকারী। এটি শ্বাসকষ্ট এবং হজমের সমস্যায় দারুণ কাজ করে।',
      JSON.stringify([honeyImageUrl2, 'https://picsum.photos/seed/bsh2/800/800', 'https://picsum.photos/seed/bsh3/800/800', 'https://picsum.photos/seed/bsh4/800/800']),
      'Black Seed Honey (250g)'
    );
  }

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
      const token = jwt.sign({ id: result.lastInsertRowid, email, role: 'customer' }, JWT_SECRET);
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role: 'customer' } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Products
  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all() as any[];
    const parsedProducts = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [p.image_url]
    }));
    res.json(parsedProducts);
  });

  app.post('/api/products', authenticate, isAdmin, (req, res) => {
    const { name, description, long_description, price, category, stock, image_url, images } = req.body;
    const result = db.prepare('INSERT INTO products (name, description, long_description, price, category, stock, image_url, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(name, description, long_description, price, category, stock, image_url, images ? JSON.stringify(images) : null);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/products/:id', authenticate, isAdmin, (req, res) => {
    const { name, description, long_description, price, category, stock, image_url, images } = req.body;
    db.prepare('UPDATE products SET name=?, description=?, long_description=?, price=?, category=?, stock=?, image_url=?, images=? WHERE id=?')
      .run(name, description, long_description, price, category, stock, image_url, images ? JSON.stringify(images) : null, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/products/:id', authenticate, isAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.post('/api/orders', (req, res) => {
    const { user_id, items, total_amount, payment_method, customer_name, customer_email, customer_phone, customer_address } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (user_id, items, total_amount, payment_method, customer_name, customer_email, customer_phone, customer_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user_id || null, JSON.stringify(items), total_amount, payment_method, customer_name, customer_email, customer_phone, customer_address);

      // Update stock
      const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      items.forEach((item: any) => {
        updateStock.run(item.quantity, item.id);
      });

      return result.lastInsertRowid;
    });

    try {
      const orderId = transaction();
      res.json({ id: orderId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/orders/my', authenticate, (req: any, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
  });

  app.get('/api/orders', authenticate, isAdmin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  });

  app.put('/api/orders/:id/status', authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    // Mock Notification Logic
    const notificationMessage = `Dear ${order.customer_name}, your order #INV-${order.id} status has been updated to: ${status}. Thank you for shopping with us!`;
    
    console.log('--- NOTIFICATION SENT ---');
    console.log(`To: ${order.customer_email} / ${order.customer_phone}`);
    console.log(`Message: ${notificationMessage}`);
    console.log('-------------------------');

    res.json({ 
      success: true, 
      notificationSent: true,
      recipient: order.customer_email || order.customer_phone 
    });
  });

  // Admin Stats
  app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
    const totalSales = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status != "Cancelled"').get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').get() as any;
    const lowStock = db.prepare('SELECT * FROM products WHERE stock < 10').all();
    
    // Last 7 days sales for chart
    const dailySales = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as amount
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND status != "Cancelled"
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    res.json({
      totalSales: totalSales.total || 0,
      totalOrders: totalOrders.count,
      totalCustomers: totalCustomers.count,
      lowStock,
      dailySales
    });
  });

  // Expenses
  app.get('/api/expenses', authenticate, isAdmin, (req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    res.json(expenses);
  });

  app.post('/api/expenses', authenticate, isAdmin, (req, res) => {
    const { description, amount } = req.body;
    db.prepare('INSERT INTO expenses (description, amount) VALUES (?, ?)').run(description, amount);
    res.json({ success: true });
  });

  // Coupons
  app.get('/api/coupons', (req, res) => {
    const coupons = db.prepare('SELECT * FROM coupons').all();
    res.json(coupons);
  });

  app.post('/api/coupons', authenticate, isAdmin, (req, res) => {
    const { code, discount_percent, expiry_date } = req.body;
    db.prepare('INSERT INTO coupons (code, discount_percent, expiry_date) VALUES (?, ?, ?)').run(code, discount_percent, expiry_date);
    res.json({ success: true });
  });

  // Reviews
  app.get('/api/products/:id/reviews', (req, res) => {
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(reviews);
  });

  app.post('/api/products/:id/reviews', (req: any, res) => {
    const { user_name, rating, comment, user_id } = req.body;
    const product_id = req.params.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    try {
      db.prepare('INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .run(product_id, user_id || null, user_name, rating, comment);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
