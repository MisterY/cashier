/*
  App router.
*/
import Vue from 'vue'
import Router from 'vue-router'

// about is lazy-loaded
//import About from './views/About.vue'
import Home from './views/Home.vue'
//const Home = () => import('./Home.vue')
import BalanceSheet from './views/BalanceSheet.vue'
import PayeeList from './views/Payees.vue'
import Register from './views/Register.vue'
//const BalanceSheet = () => import('./BalanceSheet.vue')
import Settings from './views/Settings.vue'
import Transaction from './views/Transaction.vue'

Vue.use(Router)

const routes = [
  { path: '/', name: 'home', component: Home },
  // route level code-splitting
  // this generates a separate chunk (about.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  //{ path: '/about', name: 'about', component: About },
  { path: '/about', name: 'about',
    component: () => import(/* webpackChunkName: "about" */ './views/About.vue')},
  { path: '/bal', component: BalanceSheet },
  //{ path: '/payee/:name', component: PayeeList, props: true },
  { path: '/payees', component: PayeeList },
  { path: '/reg', component: Register },
  { path: '/settings', component: Settings },
  { path: '/tx', component: Transaction }
]

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: routes,
  hashbang: false
});

export default router;