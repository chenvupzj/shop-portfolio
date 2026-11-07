<!-- 購物車畫面：顯示商品、增減數量、移除、清空與前往結帳 -->
<script setup>
import { storeToRefs } from "pinia";
import { useCartStore } from "../Store/cart";
import { RouterLink } from "vue-router";

const cartStore = useCartStore();

// 資料與計算結果：透過 storeToRefs 取出，保持響應式連結
const { cartItems, cartCount, cartTotal } = storeToRefs(cartStore);

// 函式：可以直接從 Store 取出
const { removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = cartStore;
</script>

<template>
  <section>
    <h2>購物車內容</h2>
    <p v-if="cartItems.length === 0">購物車目前是空的</p>
    <ul v-else>
      <li v-for="item in cartItems" :key="item.id">
        {{ item.name }}
        <button
          @click="increaseQuantity(item)"
          :disabled="!Number.isInteger(item.stock) || item.quantity >= item.stock"
        >
          ＋
        </button>
        {{ item.quantity }}
        <button @click="decreaseQuantity(item)" :disabled="item.quantity === 1">-</button>
        小計：NT${{ item.price * item.quantity }}
        <button @click="removeFromCart(item.id)">移除</button>
      </li>
    </ul>
    <p>總金額：NT$ {{ cartTotal }}</p>

    <RouterLink v-if="cartItems.length > 0" to="/checkout"> 前往結帳 </RouterLink>
    <button @click="clearCart" :disabled="cartItems.length === 0">清空購物車</button>
  </section>
</template>

<style scoped>
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
