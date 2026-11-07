// 網址與頁面的對照表
// Router 負責切換頁面

import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import CartView from "@/views/CartView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/cart",
      name: "cart",
      component: CartView,
    },
    {
      path: "/products/:id",
      name: "product",
      component: () => import("../views/ProductView.vue"),
    },
    {
      path: "/admin/login",
      name: "admin-login",
      component: () => import("../views/AdminLoginView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
    },
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("../views/CheckoutView.vue"),
    },
  ],
});

export default router;
