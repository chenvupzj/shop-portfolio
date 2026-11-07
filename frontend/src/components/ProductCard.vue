<!-- 一張商品卡片的畫面，例如圖片、名稱、價格與加入按鈕-->
<script setup>
import { RouterLink } from "vue-router";

//接收外面傳進來的資料
defineProps({
  product: {
    type: Object,
    required: true,
  },
});

//宣告這個元件會發出的事件
const emit = defineEmits(["add-to-cart"]);
</script>

<template>
  <article class="product-card">
    <img
      v-if="product.image_url"
      :src="product.image_url"
      :alt="product.name"
      class="product-image"
    />
    <h3>
      <RouterLink :to="`/products/${product.id}`">{{ product.name }}</RouterLink>
    </h3>

    <p>NT${{ product.price }}</p>
    <p v-if="product.stock === 0">已售完</p>
    <p v-else>庫存：{{ product.stock }} 件</p>

    <button :disabled="product.stock === 0" @click="emit('add-to-cart', product)">
      {{ product.stock === 0 ? "已售完" : "加入購物車" }}
    </button>
  </article>
</template>

<style scoped>
.product-card {
  padding: 24px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.product-card h3 {
  margin-bottom: 12px;
}

.product-image {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
  margin-bottom: 16px;
}
</style>
