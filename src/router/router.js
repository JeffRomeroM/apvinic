import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Buses from '../views/Buses.vue'
import Taxis from '../views/Perfil.vue'
import Mandados from '../views/Mandados.vue'


const routes = [
  { path: '/', name: 'Inicio', component: Home },
  { path: '/rutas', name: 'Rutas', component: Buses },
  { path: '/perfil', name: 'Perfil', component: Taxis },
  { path: '/motos', name: 'Motos', component: Mandados },
  // otras rutas
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;
