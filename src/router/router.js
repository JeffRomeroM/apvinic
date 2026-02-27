import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Buses from '../views/Buses.vue'
import Perfil from '../views/Perfil.vue'
import Favoritos from '../views/Favoritos.vue'
import Mandados from '../views/Mandados.vue'
import Lugares from '../views/Lugares.vue'
import Login from '../components/Login.vue'
import Registrarse from '../components/Registrarse.vue'
import Editlugares from '../components/Editlugares.vue'


    const routes = [ 
  { path: '/', name: 'Inicio', component: Home },
  { path: '/rutas', name: 'Rutas', component: Buses },
  { path: '/favoritos', name: 'Favoritos', component: Favoritos },
  { path: '/lugares', name: 'Lugares', component: Lugares },
  { path: '/perfil', name: 'Perfil', component: Perfil },
  { path: '/mandados', name: 'Mandados', component: Mandados },
  { path: '/login', name: 'Login', component: Login },
  { path: '/registrarse', name: 'Registrarse', component: Registrarse },
  { path: '/editlugares', name: 'Editlugares', component: Editlugares },
  // otras rutas
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;
