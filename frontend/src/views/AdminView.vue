<!-- 管理後台：商品列表、新增、編輯、上下架、圖片與庫存管理，以及登出-->
<script setup>
import { ref, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";

const adminId = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");
const router = useRouter();

const products = ref([]);
const productsError = ref("");

const productName = ref("");
const productPrice = ref(null);
const productDescription = ref("");
const createError = ref("");
const createMessage = ref("");

const isCreating = ref(false);

const editingProductId = ref(null);
const editName = ref("");
const editPrice = ref(null);
const editDescription = ref("");

const editError = ref("");
const editMessage = ref("");

const isUpdating = ref(false);

const statusError = ref("");

const changingStatusId = ref(null);

const productImageUrl = ref("");

const editImageUrl = ref("");

const productStock = ref(0);

const editStock = ref(0);

async function loadAdmin() {
  try {
    const response = await fetch("/api/admin/me");

    if (response.status === 401) {
      errorMessage.value = "請先登入。";
      return;
    }

    if (!response.ok) {
      throw new Error("查詢登入狀態失敗");
    }

    const data = await response.json();

    adminId.value = data.adminId;
    await loadProducts();
  } catch (error) {
    errorMessage.value = "無法取得登入狀態，請稍後再試。";
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function handleLogout() {
  errorMessage.value = "";

  try {
    const response = await fetch("/api/admin/logout", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.value = data.message;
      return;
    }

    router.push("/admin/login");
  } catch (error) {
    errorMessage.value = "登出請求失敗，請稍後再試。";
    console.error(error);
  }
}

async function loadProducts() {
  productsError.value = "";

  try {
    const response = await fetch("/api/admin/products");

    if (!response.ok) {
      throw new Error("取得商品失敗");
    }

    const data = await response.json();

    products.value = data;
  } catch (error) {
    productsError.value = "無法載入商品。";
    console.error(error);
  }
}

async function handleCreateProduct() {
  createError.value = "";
  createMessage.value = "";

  if (isCreating.value === true) {
    return;
  }

  if (productName.value.trim() === "") {
    createError.value = "請輸入商品名稱。";
    return;
  }

  if (!Number.isInteger(productPrice.value) || productPrice.value < 1) {
    createError.value = "價格必須是大於或等於 1 的整數。";
    return;
  }

  if (productStock.value < 0 || !Number.isInteger(productStock.value)) {
    createError.value = "庫存必須是大於或等於 0 的整數。";
    return;
  }

  isCreating.value = true;
  try {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: productName.value.trim(),
        price: productPrice.value,
        description: productDescription.value,
        image_url: productImageUrl.value.trim(),
        stock: productStock.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      createError.value = data.message;
      return;
    }
    createMessage.value = data.message;

    await loadProducts();
    productName.value = "";
    productPrice.value = null;
    productDescription.value = "";
    productImageUrl.value = "";
    productStock.value = 0;
  } catch (error) {
    createError.value = "新增商品請求失敗，請稍後再試。";
    console.error(error);
  } finally {
    isCreating.value = false;
  }
}

function startEdit(product) {
  editError.value = "";
  editMessage.value = "";
  editingProductId.value = product.id;
  editName.value = product.name;
  editPrice.value = product.price;
  editDescription.value = product.description;
  editImageUrl.value = product.image_url ?? "";
  editStock.value = product.stock;
}

function cancelEdit() {
  editError.value = "";
  editMessage.value = "";
  editingProductId.value = null;
  editName.value = "";
  editPrice.value = null;
  editDescription.value = "";
  editImageUrl.value = "";
  editStock.value = 0;
}

async function handleUpdateProduct() {
  editError.value = "";
  editMessage.value = "";

  if (isUpdating.value === true) {
    return;
  }

  if (editingProductId.value === null) {
    return;
  }

  if (editName.value.trim() === "") {
    editError.value = "名稱去除前後空白後不可為空";
    return;
  }

  if (!Number.isInteger(editPrice.value) || editPrice.value < 1) {
    editError.value = "價格必須是大於或等於 1 的整數";
    return;
  }

  if (editStock.value < 0 || !Number.isInteger(editStock.value)) {
    editError.value = "庫存必須是大於或等於 0 的整數。";
    return;
  }

  isUpdating.value = true;
  try {
    const response = await fetch(`/api/admin/products/${editingProductId.value}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editName.value.trim(),
        price: editPrice.value,
        description: editDescription.value,
        image_url: editImageUrl.value.trim(),
        stock: editStock.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      editError.value = data.message;
      return;
    }

    editMessage.value = data.message;
    await loadProducts();
  } catch (error) {
    editError.value = "修改商品請求失敗，請稍後再試。";
    console.error(error);
  } finally {
    isUpdating.value = false;
  }
}

async function toggleProductStatus(product) {
  statusError.value = "";

  if (changingStatusId.value !== null) {
    return;
  }

  changingStatusId.value = product.id;
  try {
    const response = await fetch(`/api/admin/products/${product.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: !product.is_active,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      statusError.value = data.message;
      return;
    }

    await loadProducts();
  } catch (error) {
    statusError.value = "更新商品狀態失敗，請稍後再試。";
    console.error(error);
  } finally {
    changingStatusId.value = null;
  }
}

onMounted(() => {
  loadAdmin();
});
</script>

<template>
  <section>
    <h2>管理後台</h2>

    <p v-if="isLoading">確認登入狀態中……</p>

    <div v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/admin/login">前往登入</RouterLink>
    </div>

    <div v-else>
      <p>歡迎，管理員 {{ adminId }}</p>
      <h3>商品列表</h3>

      <p v-if="statusError">{{ statusError }}</p>
      <p v-if="productsError">{{ productsError }}</p>
      <ul v-else>
        <li v-for="product in products" :key="product.id">
          {{ product.name }} — NT$ {{ product.price }} — 庫存：{{ product.stock }} —
          {{ product.is_active ? "上架中" : "已下架" }}
          <button
            type="button"
            @click="toggleProductStatus(product)"
            :disabled="changingStatusId !== null"
          >
            {{ changingStatusId === product.id ? "更新中……" : product.is_active ? "下架" : "上架" }}
          </button>
          <button type="button" @click="startEdit(product)" :disabled="isUpdating">編輯</button>
        </li>
      </ul>

      <section v-if="editingProductId !== null">
        <h3>編輯商品 #{{ editingProductId }}</h3>

        <form @submit.prevent="handleUpdateProduct">
          <label>
            圖片網址
            <input
              v-model="editImageUrl"
              type="url"
              placeholder="https://example.com/product.jpg"
            />
          </label>
          <label>
            商品名稱
            <!-- 加入文字輸入框，綁定 editName -->
            <input v-model="editName" type="text" maxlength="100" />
          </label>

          <label>
            價格
            <!-- 加入數字輸入框，綁定 editPrice -->
            <input v-model.number="editPrice" type="number" />
          </label>

          <label>
            庫存
            <input v-model.number="editStock" type="number" min="0" step="1" />
          </label>

          <label>
            商品介紹
            <!-- 加入 textarea，綁定 editDescription -->
            <textarea v-model="editDescription" />
          </label>

          <p v-if="editError">{{ editError }}</p>
          <p v-if="editMessage" role="status">{{ editMessage }}</p>

          <button type="submit" :disabled="isUpdating">
            {{ isUpdating ? "儲存中……" : "儲存修改" }}
          </button>
          <button type="button" @click="cancelEdit" :disabled="isUpdating">取消編輯</button>
        </form>
      </section>

      <h3>新增商品</h3>
      <form @submit.prevent="handleCreateProduct">
        <label>
          商品名稱
          <input v-model="productName" type="text" maxlength="100" />
        </label>

        <label>
          價格
          <input v-model.number="productPrice" type="number" />
        </label>

        <label>
          庫存
          <input v-model.number="productStock" type="number" min="0" step="1" />
        </label>

        <label>
          商品介紹
          <textarea v-model="productDescription"></textarea>
        </label>

        <label>
          圖片網址
          <input
            v-model="productImageUrl"
            type="url"
            placeholder="https://example.com/product.jpg"
          />
        </label>

        <p v-if="createError">{{ createError }}</p>
        <p v-if="createMessage" role="status">{{ createMessage }}</p>

        <button type="submit" :disabled="isCreating">
          {{ isCreating ? "新增中……" : "新增商品" }}
        </button>
      </form>
      <button type="button" @click="handleLogout">登出</button>
    </div>
  </section>
</template>
