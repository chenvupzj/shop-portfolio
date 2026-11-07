// 啟動 Express，設定所有 API，處理登入、商品管理、建立訂單與扣庫存

const pool = require("./db");
const express = require("express");
const app = express();
const { verifyPassword } = require("./password");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("請在 .env 設定 SESSION_SECRET");
}

app.use(
  session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 2 * 60 * 60 * 1000,
    },
  }),
);

function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({
      message: "請先登入。",
    });
  }

  next();
}

app.get("/api/hello", (req, res) => {
  res.json({
    message: "你好，這是後端回傳的訊息！",
  });
});

//顧客商品列表
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price, description, image_url, stock FROM products WHERE is_active = true ORDER BY id",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("查詢商品失敗：", error);

    res.status(500).json({
      message: "暫時無法取得商品，請稍後再試。",
    });
  }
});

//顧客商品詳情
app.get("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({
      message: "商品 ID 必須是大於或等於 1 的整數。",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, price, description, image_url, stock FROM products WHERE id = $1 AND is_active = true",
      [productId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "找不到這件商品。",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("查詢單件商品失敗：", error);

    res.status(500).json({
      message: "暫時無法取得商品，請稍後再試。",
    });
  }
});

//管理員商品列表
app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, price, description, is_active, image_url, stock FROM products ORDER BY id",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("查詢後台商品失敗：", error.message);

    res.status(500).json({
      message: "暫時無法取得商品。",
    });
  }
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({
    adminId: req.session.adminId,
  });
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({
      message: "帳號和密碼必須是字串。",
    });
  }

  if (username.trim() === "" || password === "") {
    return res.status(400).json({
      message: "請輸入帳號和密碼",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM admins WHERE username = $1",
      [username.trim()],
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({
        message: "帳號或密碼錯誤。",
      });
    }

    const isPasswordCorrect = verifyPassword(password, admin.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "帳號或密碼錯誤。",
      });
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        console.error("建立 Session 失敗：", regenerateError);

        return res.status(500).json({
          message: "暫時無法登入，請稍後再試。",
        });
      }

      req.session.adminId = admin.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("儲存 Session 失敗：", saveError);

          return res.status(500).json({
            message: "暫時無法登入，請稍後再試。",
          });
        }

        res.json({
          message: "登入成功。",
        });
      });
    });
  } catch (error) {
    console.error("登入處理失敗：", error.message);

    res.status(500).json({
      message: "暫時無法登入，請稍後再試。",
    });
  }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "暫時無法登出，請稍後再試。",
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "已登出。",
    });
  });
});

// 新增商品 API 讓庫存存進資料庫
app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const { name, price, description = "", image_url = "", stock = 0 } = req.body ?? {};

  if (typeof name !== "string" || typeof description !== "string") {
    return res.status(400).json({
      message: "商品名稱和介紹必須是文字。",
    });
  }

  if (name.trim() === "" || name.trim().length > 100) {
    return res.status(400).json({
      message: "名稱去除前後空白後，不可為空，也不可超過 100 字元",
    });
  }

  if (!Number.isInteger(price) || price < 1 || price > 2147483647) {
    return res.status(400).json({
      message: "價格必須是整數，範圍為 1～2147483647",
    });
  }

  if (typeof image_url !== "string") {
    return res.status(400).json({
      message: "圖片網址必須是文字。",
    });
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
    return res.status(400).json({
      message: "庫存必須是 0～2147483647 的整數。",
    });
  }

  const imageUrl = image_url.trim();

  if (imageUrl !== "") {
    try {
      const url = new URL(imageUrl);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return res.status(400).json({
          message: "圖片網址只接受 HTTP 或 HTTPS。",
        });
      }
    } catch {
      return res.status(400).json({
        message: "請輸入有效的圖片網址。",
      });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, description, image_url, stock)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, name, price, description, image_url, stock`,
      [name.trim(), price, description, imageUrl, stock],
    );

    res.status(201).json({
      message: "商品新增成功。",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("新增商品失敗：", error.message);

    res.status(500).json({
      message: "暫時無法新增商品，請稍後再試。",
    });
  }
});

//顧客下單的 API
app.post("/api/orders", async (req, res) => {
  const { recipient_name, recipient_phone, recipient_address, items } = req.body ?? {};

  if (
    typeof recipient_name !== "string" ||
    typeof recipient_phone !== "string" ||
    typeof recipient_address !== "string"
  ) {
    return res.status(400).json({
      message: "收件人、電話與地址必須是文字。",
    });
  }

  if (
    recipient_name.trim() === "" ||
    recipient_phone.trim() === "" ||
    recipient_address.trim() === ""
  ) {
    return res.status(400).json({
      message: "請填寫完整收件資料。",
    });
  }
  if (
    recipient_name.trim().length > 100 ||
    recipient_phone.trim().length > 30 ||
    recipient_address.trim().length > 500
  ) {
    return res.status(400).json({
      message: "收件人、電話或地址超過長度限制。",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "訂單至少需要一件商品。",
    });
  }

  const productIds = new Set();

  for (const item of items) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return res.status(400).json({
        message: "商品明細格式不正確。",
      });
    }

    // 檢查商品 ID
    if (item.product_id < 1 || !Number.isInteger(item.product_id)) {
      return res.status(400).json({
        message: "商品 ID 必須是大於或等於 1 的整數。",
      });
    }

    // 檢查購買數量
    if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
      return res.status(400).json({
        message: "購買數量必須是大於或等於 1 的整數。",
      });
    }

    if (productIds.has(item.product_id)) {
      return res.status(400).json({
        message: "同一商品不可重複列入，請合併購買數量。",
      });
    }
    productIds.add(item.product_id);
  }

  const sortedItems = [...items].sort((a, b) => {
    return a.product_id - b.product_id;
  });

  let client;
  let transactionActive = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionActive = true;

    let totalAmount = 0;
    const orderDetails = [];

    for (const item of sortedItems) {
      const result = await client.query(
        `SELECT id, name, price, stock
   FROM products
   WHERE id = $1 AND is_active = true
   FOR UPDATE`,
        [item.product_id],
      );

      const product = result.rows[0];

      if (!product) {
        return res.status(400).json({
          message: "訂單中有商品不存在或已下架。",
        });
      }

      if (item.quantity > product.stock) {
        return res.status(409).json({
          message: `「${product.name}」庫存不足。`,
        });
      }

      const subtotal = product.price * item.quantity;

      totalAmount += subtotal;

      if (!Number.isSafeInteger(totalAmount) || totalAmount > 2147483647) {
        return res.status(400).json({
          message: "訂單總金額超出可處理範圍。",
        });
      }

      orderDetails.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
      });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (
     recipient_name, recipient_phone, recipient_address, total_amount
   )
   VALUES ($1, $2, $3, $4)
   RETURNING id, total_amount, status`,
      [recipient_name.trim(), recipient_phone.trim(), recipient_address.trim(), totalAmount],
    );

    const order = orderResult.rows[0];

    for (const detail of orderDetails) {
      await client.query(
        `INSERT INTO order_items (
       order_id, product_id, product_name, unit_price, quantity
     )
     VALUES ($1, $2, $3, $4, $5)`,
        [order.id, detail.product_id, detail.product_name, detail.unit_price, detail.quantity],
      );

      const stockResult = await client.query(
        `UPDATE products
   SET stock = stock - $1
   WHERE id = $2 AND stock >= $1
   RETURNING id, stock`,
        [detail.quantity, detail.product_id],
      );

      if (stockResult.rowCount !== 1) {
        throw new Error("扣除商品庫存失敗。");
      }
    }

    await client.query("COMMIT");
    transactionActive = false;

    res.status(201).json({
      message: "訂單建立成功。",
      order: {
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("檢查訂單商品失敗：", error.message);

    res.status(500).json({
      message: "暫時無法處理訂單，請稍後再試。",
    });
  } finally {
    if (client) {
      try {
        if (transactionActive) {
          await client.query("ROLLBACK");
          transactionActive = false;
        }

        client.release();
      } catch (cleanupError) {
        client.release(cleanupError);
        console.error("清理訂單連線失敗：", cleanupError.message);
      }
    }
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  const { name, price, description = "", image_url = "", stock } = req.body ?? {};

  if (productId < 1 || !Number.isInteger(productId)) {
    return res.status(400).json({
      message: "商品 ID 必須是大於或等於 1 的整數。",
    });
  }

  if (typeof name !== "string" || typeof description !== "string") {
    return res.status(400).json({
      message: "商品名稱和說明必須都是字串",
    });
  }

  if (name.trim().length < 1 || name.trim().length > 100) {
    return res.status(400).json({
      message: "商品名稱長度須為 1～100",
    });
  }

  if (!Number.isInteger(price) || price < 1 || price > 2147483647) {
    return res.status(400).json({
      message: "商品價格必須是 1～2147483647 的整數",
    });
  }

  if (typeof image_url !== "string") {
    return res.status(400).json({
      message: "圖片網址必須是文字。",
    });
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
    return res.status(400).json({
      message: "庫存必須是 0～2147483647 的整數。",
    });
  }

  const imageUrl = image_url.trim();

  if (imageUrl !== "") {
    try {
      const url = new URL(imageUrl);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return res.status(400).json({
          message: "圖片網址只接受 HTTP 或 HTTPS。",
        });
      }
    } catch {
      return res.status(400).json({
        message: "請輸入有效的圖片網址。",
      });
    }
  }

  try {
    const result = await pool.query(
      `UPDATE products
   SET name = $1, price = $2, description = $3,
       image_url = $4, stock = $5
   WHERE id = $6
   RETURNING id, name, price, description, image_url, stock`,
      [name.trim(), price, description, imageUrl, stock, productId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "找不到這件商品。",
      });
    }

    res.json({
      message: "商品修改成功。",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("修改商品失敗：", error.message);

    res.status(500).json({
      message: "暫時無法修改商品，請稍後再試。",
    });
  }
});

app.patch("/api/admin/products/:id/status", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  const { is_active } = req.body ?? {};

  if (productId < 1 || !Number.isInteger(productId)) {
    return res.status(400).json({
      message: "productId 必須是大於或等於 1 的整數",
    });
  }

  if (typeof is_active !== "boolean") {
    return res.status(400).json({
      message: "is_active 必須是布林值",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE products
     SET is_active = $1
     WHERE id = $2
     RETURNING id, name, is_active`,
      [is_active, productId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "找不到這件商品。",
      });
    }

    res.json({
      message: "商品狀態更新成功。",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("更新商品狀態失敗：", error.message);

    res.status(500).json({
      message: "暫時無法更新商品狀態。",
    });
  }
});

app.listen(3000, () => {
  console.log("後端已啟動：http://localhost:3000");
});
