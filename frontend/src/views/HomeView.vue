<!-- 商品首頁：取得商品、搜尋、排序、排列商品卡片 -->
<script setup>
import { useCartStore } from "../Store/cart";
import { ref, computed, onMounted } from "vue";
import ProductCard from "../components/ProductCard.vue";

const products = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

const cartStore = useCartStore();
// 函式：可以直接從 Store 取出
const { addToCart } = cartStore;

//商品搜尋功能& 排序功能（先搜尋，再排序）
const searchKeyword = ref("");

const sortOrder = ref("default");

//篩選出符合條件的商品清單
const filterProducts = computed(() => {
  const keyword = searchKeyword.value.trim();

  const result = products.value.filter((product) => {
    return product.name.includes(keyword);
  });

  if (sortOrder.value === "price-asc") {
    result.sort((a, b) => {
      return a.price - b.price; // 低價在前
    });
  } else if (sortOrder.value === "price-desc") {
    result.sort((a, b) => {
      return b.price - a.price; // 高價在前
    });
  }
  return result; //上述兩個條件都不符合，因此不執行任何排序，直接回傳 result，也就是"default"。
});

function clearSearch() {
  searchKeyword.value = "";
}

async function loadProducts() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("取得商品失敗");
    }

    const data = await response.json();

    products.value = data;
  } catch (error) {
    errorMessage.value = "無法載入商品，請確認後端已啟動。";
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}
onMounted(() => {
  loadProducts();
});
</script>

<template>
  <section>
    <h2>所有商品</h2>
    <label>
      搜尋商品：
      <input v-model="searchKeyword" type="search" placeholder="輸入商品名稱" />
    </label>
    <button @click="clearSearch" :disabled="searchKeyword === ''">清除搜尋</button>

    <label>
      商品排序：
      <select v-model="sortOrder">
        <option value="default">預設排序</option>
        <option value="price-asc">價格由低到高</option>
        <option value="price-desc">價格由高到低</option>
      </select>
    </label>
    <p v-if="isLoading">商品載入中...</p>
    <p v-else-if="errorMessage">{{ errorMessage }}</p>
    <p v-else-if="filterProducts.length === 0">
      找不到符合「{{ searchKeyword }}」的商品，請試試其他關鍵字。
    </p>
    <div v-else class="product-list">
      <ProductCard
        v-for="product in filterProducts"
        :key="product.id"
        :product="product"
        @add-to-cart="addToCart"
      />
    </div>
  </section>
</template>

<style scoped>
h2 {
  margin-bottom: 20px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
