// 手動執行，用來建立管理員帳號

const pool = require("./db");
const { hashPassword } = require("./password");

async function createAdmin(username, password) {
  try {
    const passwordHash = hashPassword(password);

    const result = await pool.query(
      `INSERT INTO admins (username, password_hash)
          VALUES ($1, $2)
          RETURNING id, username`,
      [username, passwordHash],
    );

    console.log("管理員已建立：", result.rows[0]);
  } catch (error) {
    console.error("建立管理員失敗：", error.message);
  } finally {
    await pool.end();
  }
}

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (
  typeof adminUsername !== "string" ||
  adminUsername.trim() === "" ||
  typeof adminPassword !== "string" ||
  adminPassword.length < 12
) {
  console.error("請在 .env 設定帳號，以及至少 12 個字元的密碼。");
  process.exitCode = 1;
} else {
  createAdmin(adminUsername.trim(), adminPassword);
}
