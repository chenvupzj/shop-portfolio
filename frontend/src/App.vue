<!-- 每個頁面共用的外框 包含網站名稱、導覽列 -->
<script setup>
import { RouterLink, RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "./Store/cart";

const cartStore = useCartStore();
const { cartCount } = storeToRefs(cartStore);
</script>

<template>
  <header class="site-header">
    <h1>我的選物商店</h1>

    <nav>
      <RouterLink to="/">首頁</RouterLink>
      <RouterLink to="/about">關於我們</RouterLink>
      <RouterLink to="/cart"> 購物車：{{ cartCount }} 件</RouterLink>
    </nav>
  </header>

  <!-- 留給各頁面顯示的地方 -->
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
.site-header {
  padding: 24px;
  border-bottom: 1px solid #ddd;
}

h1 {
  font-size: 28px;
  margin-bottom: 16px;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  text-decoration: none;
}

nav a.router-link-exact-active {
  font-weight: bold;
}

main {
  padding: 24px;
}
</style>
