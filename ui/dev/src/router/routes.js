import pages from "./pages";

const children = pages.map((page) => ({
  path: page.path,
  // component: () => import("pages/" + page.file + ".vue"),
  components: {
    default: () => import("pages/" + page.file + ".vue"),
    sentinfo: () => import("components/SentenceInfo.vue"),
  },
}));

const routes = [
  {
    path: "/",
    redirect: "/viewer",
  },

  {
    path: "/",
    component: () => import("layouts/MyLayout.vue"),
    children: [{ path: "", component: () => import("pages/Index.vue") }].concat(
      children
    ),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue"),
  },
];

export default routes;
