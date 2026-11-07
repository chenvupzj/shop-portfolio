<!-- 管理員登入表單 -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const message = ref("");
const router = useRouter();

async function handleLogin() {
  errorMessage.value = "";
  message.value = "";

  if (username.value.trim() === "" || password.value === "") {
    errorMessage.value = "請輸入帳號和密碼";
    return;
  }

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.value = data.message;
      return;
    }

    message.value = data.message;
    router.push("/admin");
  } catch (error) {
    errorMessage.value = "登入請求失敗，請稍後再試";
    console.error(error);
  }
}

async function handleLogout() {
  errorMessage.value = "";
  message.value = "";

  try {
    const response = await fetch("/api/admin/logout", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.value = data.message;
      return;
    }

    message.value = data.message;
  } catch (error) {
    errorMessage.value = "登出請求失敗，請稍後再試。";
    console.error(error);
  }
}
</script>

<template>
  <section>
    <h2>管理員登入</h2>

    <form @submit.prevent="handleLogin">
      <!-- 自己加入帳號輸入框 -->
      <input v-model="username" type="text" placeholder="請輸入帳號" />

      <!-- 自己加入密碼輸入框 -->
      <input v-model="password" type="password" placeholder="請輸入密碼" />

      <!-- 自己加入錯誤訊息 -->
      <p v-if="errorMessage">{{ errorMessage }}</p>
      <p v-if="message" role="status">{{ message }}</p>
      <button type="submit">登入</button>
    </form>

    <button type="button" @click="handleLogout">登出</button>
  </section>
</template>
