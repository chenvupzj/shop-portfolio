// 共用購物車資料與規則：加入、合併、數量限制、移除、總額計算與瀏覽器保存
import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";

function localCart() {
  try {
    const savedCart = localStorage.getItem("shopping-cart");

    if (savedCart === null) {
      return [];
    }

    const items = JSON.parse(savedCart);

    if (!Array.isArray(items)) {
      return [];
    }
    return items.filter((item) => {
      return (
        item !== null &&
        typeof item === "object" &&
        Number.isInteger(item.id) &&
        typeof item.name === "string" &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

//定義一個識別名稱為 cart 的 Store
export const useCartStore = defineStore("cart", () => {
  const cartItems = ref(localCart());

  //使用watch()，當資料改變後，自動執行指定操作
  watch(
    cartItems,
    (items) => {
      try {
        localStorage.setItem("shopping-cart", JSON.stringify(items));
      } catch {
        console.warn("購物車暫時無法儲存至瀏覽器");
      }
    },
    { deep: true },
  );

  //購物車內商品 總數量
  const cartCount = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  });

  //購物車內商品 總金額
  const cartTotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return item.price * item.quantity + total;
    }, 0);
  });

  //加入購物車按鈕
  function addToCart(product, quantity = 1) {
    //數量不是整數或是數量小於1都會跳出函式
    if (!Number.isInteger(quantity) || quantity < 1) {
      return false;
    }
    // 從購物車陣列中尋找是否已有相同 id 的商品
    // 找到會回傳該商品物件，找不到則回傳 undefined
    const existingItem = cartItems.value.find((item) => {
      return item.id === product.id;
    });

    if (!Number.isInteger(product.stock) || product.stock < 0) {
      return false;
    }

    const currentQuantity = existingItem ? existingItem.quantity : 0;

    const nextQuantity = currentQuantity + quantity;

    if (nextQuantity > product.stock) {
      return false;
    }

    //商品已在購物車內 -> quantity++
    if (existingItem) {
      existingItem.stock = product.stock;
      existingItem.quantity += quantity;
    } else {
      cartItems.value.push({
        ...product,
        quantity: quantity,
      });
    }
    return true;
  }

  //移除按鈕 移除購物車商品(保留 ID 不同的商品 就能移除指定商品)
  function removeFromCart(productId) {
    cartItems.value = cartItems.value.filter((item) => {
      return item.id !== productId;
    });
  }

  //＋按鈕
  function increaseQuantity(item) {
    if (!Number.isInteger(item.stock) || item.stock < 0) {
      return false;
    }

    if (item.quantity >= item.stock) {
      return false;
    }

    item.quantity++;
    return true;
  }

  //ㄧ按鈕
  function decreaseQuantity(item) {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  //清空購物車按鈕
  function clearCart() {
    cartItems.value = [];
  }

  return {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };
});
