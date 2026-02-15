import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Buses from '../views/Buses.vue'
import Perfil from '../views/Perfil.vue'
import Taxis from '../views/Taxis.vue'
import Mandados from '../views/Mandados.vue'
import Login from '../components/Login.vue'
import Registrarse from '../components/Registrarse.vue'


    const routes = [ 
  { path: '/', name: 'Inicio', component: Home },
  { path: '/rutas', name: 'Rutas', component: Buses },
  { path: '/taxis', name: 'Taxis', component: Taxis },
  { path: '/perfil', name: 'Perfil', component: Perfil },
  { path: '/mandados', name: 'Mandados', component: Mandados },
  { path: '/login', name: 'Login', component: Login },
  { path: '/registrarse', name: 'Registrarse', component: Registrarse },
  // otras rutas
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;
