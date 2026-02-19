<template>
  <transition name="slide-fade">
    <div v-show="showLogo" class="mobile-header">
      <div class="logo-circle" @click="scrollToTop">
        <img src="/apvinic_logo.png" alt="Apvinic" class="logo-mobile" />
      </div>
    </div>
  </transition>

  <nav class="navigation-bar">
    <div class="logo-container">
      <img src="/apvinic_logo.png" alt="Logo" class="logo-desktop" />
    </div>

    <div class="nav-links">
      <div class="nav-indicator" :style="indicatorStyle"></div>

      <RouterLink to="/" class="nav-item">
        <Icon icon="solar:home-2-bold-duotone" class="nav-icon" />
        <span class="label">Inicio</span>
      </RouterLink>

      <RouterLink to="/rutas" class="nav-item">
        <Icon icon="solar:bus-bold-duotone" class="nav-icon" />
        <span class="label">Servicios</span>
      </RouterLink>

      <RouterLink to="/favoritos" class="nav-item">
        <Icon icon="solar:heart-bold-duotone" class="nav-icon" />
        <span class="label">Favoritos</span>
      </RouterLink>

      <RouterLink to="/lugares" class="nav-item">
        <Icon icon="solar:map-point-bold-duotone" class="nav-icon" />
        <span class="label">Lugares</span>
      </RouterLink>

      <RouterLink to="/perfil" class="nav-item">
        <Icon icon="solar:user-circle-bold-duotone" class="nav-icon" />
        <span class="label">Perfil</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'

const showLogo = ref(true)
const lastScrollPosition = ref(0)
const route = useRoute()

const handleScroll = () => {
  // Obtenemos el scroll de forma más agresiva para asegurar detección
  const currentScrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
  
  // Evitar errores en iOS y valores negativos
  if (currentScrollPosition < 0) return

  // Margen de diferencia para evitar que parpadee (sensibilidad)
  if (Math.abs(currentScrollPosition - lastScrollPosition.value) < 5) return

  // Ocultar si baja, mostrar si sube o está muy arriba
  if (currentScrollPosition > lastScrollPosition.value && currentScrollPosition > 80) {
    showLogo.value = false
  } else {
    showLogo.value = true
  }
  
  lastScrollPosition.value = currentScrollPosition
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const indicatorStyle = computed(() => {
  const routes = ['/', '/rutas', '/favoritos', '/lugares', '/perfil']
  const index = routes.indexOf(route.path)
  if (index === -1) return { opacity: 0 }
  return {
    left: `calc(${index * 20}% + 10%)`,
    opacity: 1
  }
})

onMounted(() => {
  // Escuchamos el scroll global
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* --- SIDEBAR DESKTOP --- */
.navigation-bar {
  --nav-width: 75px;
  --primary: #d19a02;
  display: flex;
  flex-direction: column;
  width: var(--nav-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #ffffff;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding: 1.5rem 0;
}

.logo-container { display: flex; justify-content: center; margin-bottom: 2.5rem; }
.logo-desktop { width: 45px; }

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  position: relative;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94a3b8;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  transition: all 0.3s ease;
  z-index: 2;
}

.nav-icon { font-size: 28px; }

.label {
  position: absolute;
  left: 75px;
  background: #1e293b;
  color: white;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.nav-item:hover .label { opacity: 1; transform: translateX(0); }

/* --- ESTILO MÓVIL (CORREGIDO) --- */
@media (max-width: 640px) {
  .mobile-header {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: auto; /* IMPORTANTE: No ocupa el 100% ahora */
    height: auto;
    padding: 15px; /* Margen desde la esquina */
    z-index: 2000;
    background: transparent !important;
    pointer-events: none;
  }

  .logo-circle {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.7) !important;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  .logo-mobile { width: 32px; height: 32px; }

  .navigation-bar {
    flex-direction: row;
    width: 100%;
    height: 65px;
    top: auto;
    bottom: 0;
    padding: 0;
    background: #ffffff;
    border-top: 1px solid #f1f5f9;
  }

  .logo-container { display: none; }

  .nav-links {
    flex-direction: row;
    width: 100%;
    height: 100%;
    justify-content: space-around;
  }

  .nav-item {
    width: 20%;
    height: 100%;
    background: transparent !important;
  }

  .nav-indicator {
    display: block;
    position: absolute;
    top: 8px;
    width: 44px;
    height: 44px;
    background: rgba(209, 154, 2, 0.12);
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 1;
  }

  .nav-icon { font-size: 24px; }
  .router-link-active .nav-icon { color: var(--primary); }

  .label {
    position: static;
    opacity: 1;
    transform: none;
    background: none;
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    margin-top: 2px;
    padding: 0;
  }

  .router-link-active .label { color: var(--primary); }
}

@media (min-width: 641px) {
  .nav-indicator { display: none; }
  .router-link-active { color: var(--primary); background: rgba(209, 154, 2, 0.08); }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-20px); }
</style>