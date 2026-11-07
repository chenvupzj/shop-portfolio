<!-- 單件商品詳情：圖片、介紹、價格、庫存、選擇加入數量 -->
<script setup>
import { useRoute, RouterLink } from "vue-router";
import { ref, watch } from "vue";
import { useCartStore } from "../Store/cart";

//useRoute() 可以取得目前的路由資訊，這裡用它讀取網址中的商品 ID。
const route = useRoute();

const product = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

const cartStore = useCartStore();
const { addToCart } = cartStore;

const quantity = ref(1);

const message = ref("");
function handleAddToCart() {
  if (!product.value || !Number.isInteger(quantity.value) || quantity.value < 1) {
    message.value = "請輸入大於或等於 1 的整數數量。";
    return;
  }
  if (quantity.value > product.value.stock) {
    message.value = "選擇的數量超過目前庫存。";
    return;
  }

  const added = addToCart(product.value, quantity.value);

  if (!added) {
    message.value = "無法加入，購物車合併後的數量可能超過庫存。";
    return;
  }

  message.value = `已加入 ${quantity.value} 件「${product.value.name}」`;
}

watch(
  () => route.params.id,
  async (id, oldId, onCleanup) => {
    const controller = new AbortController();

    onCleanup(() => {
      controller.abort();
    });

    product.value = null;
    isLoading.value = true;
    errorMessage.value = "";
    message.value = "";
    quantity.value = 1;

    try {
      const response = await fetch(`/api/products/${id}`, {
        signal: controller.signal,
      });

      if (response.status === 404) {
        errorMessage.value = "找不到這件商品。";
        return;
      }

      if (!response.ok) {
        throw new Error("取得商品失敗");
      }

      const data = await response.json();

      if (!controller.signal.aborted) {
        product.value = data;
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        errorMessage.value = "無法載入商品，請確認後端已啟動。";
        console.error(error);
      }
    } finally {
      if (!controller.signal.aborted) {
        isLoading.value = false;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <RouterLink to="/">← 回商品列表</RouterLink>
  <p v-if="isLoading">商品載入中...</p>
  <p v-else-if="errorMessage" role="alert">
    {{ errorMessage }}
  </p>
  <section v-else-if="product">
    <img
      v-if="product.image_url"
      :src="product.image_url"
      :alt="product.name"
      class="product-image"
    />
    <h2>{{ product.name }}</h2>
    <p>{{ product.description }}</p>
    <p>NT$ {{ product.price }}</p>
    <p v-if="product.stock === 0">已售完</p>
    <p v-else>庫存：{{ product.stock }} 件</p>
    <label>
      數量：
      <input
        v-model.number="quantity"
        type="number"
        min="1"
        step="1"
        :max="product.stock"
        :disabled="product.stock === 0"
      />
    </label>
    <p role="status">{{ message }}</p>
    <button
      @click="handleAddToCart"
      :disabled="
        product.stock === 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > product.stock
      "
    >
      {{ product.stock === 0 ? "已售完" : "加入購物車" }}
    </button>
  </section>
</template>

<style scoped>
.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}
</style>
