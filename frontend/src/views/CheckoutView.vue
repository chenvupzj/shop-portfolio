<!-- 收件表單、送出訂單、顯示成功結果 -->
<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useCartStore } from "../Store/cart";

const cartStore = useCartStore();
const { cartItems, cartTotal } = storeToRefs(cartStore);

const recipientName = ref("");
const recipientPhone = ref("");
const recipientAddress = ref("");

const checkoutError = ref("");
const checkoutMessage = ref("");

const isSubmitting = ref(false);

const createdOrder = ref(null);

async function handleCheckout() {
  if (isSubmitting.value || createdOrder.value) {
    return;
  }

  checkoutError.value = "";
  checkoutMessage.value = "";

  if (cartItems.value.length === 0) {
    checkoutError.value = "請先加入商品。";
    return;
  }

  if (
    recipientName.value.trim() === "" ||
    recipientAddress.value.trim() === "" ||
    recipientPhone.value.trim() === ""
  ) {
    checkoutError.value = "請填寫完整收件資料";
    return;
  }

  const orderItems = cartItems.value.map((item) => {
    return {
      product_id: item.id,
      quantity: item.quantity,
    };
  });

  const orderData = {
    recipient_name: recipientName.value.trim(),
    recipient_phone: recipientPhone.value.trim(),
    recipient_address: recipientAddress.value.trim(),
    items: orderItems,
  };

  isSubmitting.value = true;

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      checkoutError.value = data.message;
      return;
    }

    createdOrder.value = data.order;
    checkoutMessage.value = data.message;
    cartStore.clearCart();
  } catch (error) {
    checkoutError.value = "訂單請求失敗，請稍後再試。";
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section>
    <h2>結帳</h2>

    <div v-if="createdOrder" role="status">
      <h3>{{ checkoutMessage }}</h3>
      <p>訂單編號：{{ createdOrder.id }}</p>
      <p>訂單金額：NT$ {{ createdOrder.total_amount }}</p>
    </div>

    <p v-else-if="cartItems.length === 0">購物車目前是空的，請先加入商品。</p>

    <form v-else @submit.prevent="handleCheckout">
      <p>商品小計：NT$ {{ cartTotal }}</p>

      <label>
        收件人
        <input v-model="recipientName" type="text" />
      </label>

      <label>
        電話
        <input v-model="recipientPhone" type="tel" />
      </label>

      <label>
        地址
        <textarea v-model="recipientAddress"></textarea>
      </label>

      <p v-if="checkoutError">{{ checkoutError }}</p>
      <p v-if="checkoutMessage" role="status">
        {{ checkoutMessage }}
      </p>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "訂單送出中……" : "送出訂單" }}
      </button>
    </form>
  </section>
</template>
