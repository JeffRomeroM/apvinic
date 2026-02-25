<template>
  <div class="mobile-header" :class="{ 'header-hidden': isHidden }">
    <img src="/apvinic_logo.png" alt="Apvinic" class="logo-mobile" />
   
  </div>

  <nav class="navigation-bar">
    <div class="logo-container">
      <img src="/apvinic_logo.png" alt="Logo" class="logo-desktop" />
    </div>

    <div class="nav-links">
      <RouterLink to="/" class="nav-item">
        <Icon icon="mdi:home" class="nav-icon" />
        <span class="label">Inicio</span>
      </RouterLink>

      <RouterLink to="/rutas" class="nav-item">
        <Icon icon="mdi:bus" class="nav-icon" />
        <span class="label">Servicios</span>
      </RouterLink>

      <RouterLink to="/favoritos" class="nav-item">
        <Icon icon="mdi:heart" class="nav-icon" />
        <span class="label">Favoritos</span>
      </RouterLink>

      <RouterLink to="/lugares" class="nav-item">
        <Icon icon="mdi:map-marker" class="nav-icon" />
        <span class="label">Lugares</span>
      </RouterLink>

      <RouterLink to="/perfil" class="nav-item">
        <Icon icon="mdi:user" class="nav-icon" />
        <span class="label">Perfil</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

const isHidden = ref(false)
let lastScrollPosition = 0

const handleScroll = () => {
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
  
  // Ignorar scrolls menores para evitar "parpadeos" (umbral de 10px)
  if (Math.abs(currentScrollPosition - lastScrollPosition) < 10) return

  // Si bajamos, ocultamos. Si subimos, mostramos.
  // También evitamos que se oculte si estamos muy arriba (top < 60px)
  if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 60) {
    isHidden.value = true
  } else {
    isHidden.value = false
  }
  
  lastScrollPosition = currentScrollPosition
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* --- CONFIGURACIÓN BASE --- */
.navigation-bar {
  --nav-width: 70px;
  --primary: #d19a02;
  --bg-card: #ffffff;
  
  display: flex;
  flex-direction: column;
  width: var(--nav-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--bg-card);
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding: 1.5rem 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-header {
  display: none;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.logo-desktop {
  width: 45px;
  height: auto;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94a3b8;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-icon { font-size: 26px; }

/* Tooltip Desktop */
.label {
  position: absolute;
  left: 70px;
  background: #1e293b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.nav-item:hover .label {
  opacity: 1;
  transform: translateX(0);
}

.nav-item:hover {
  color: var(--primary);
  background: rgba(209, 154, 2, 0.08);
}

.router-link-active {
  color: var(--primary);
  background: rgba(209, 154, 2, 0.12);
}

/* --- RESPONSIVE MÓVIL --- */
@media (max-width: 640px) {
  .navigation-bar {
    flex-direction: row;
    width: 100%;
    height: 65px;
    top: auto;
    bottom: 0;
    padding: 0;
    justify-content: center;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    border-top: 1px solid #f1f5f9;
    
  }
  
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 10px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background:transparent !important; /* Sólido para evitar traslapes feos */
    padding: 0 1.5rem;
    z-index: 1100; /* Por encima de todo */
  }

  .header-hidden {
    transform: translateY(-100%);
    opacity: 0;
  
  }

  .logo-mobile { width: 32px; }
  .brand-name { font-weight: 800; color: #0f172a; font-size: 1.1rem; }

  .nav-links {
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    gap: 0;
  }

  .nav-item { width: 20%; height: 100%; border-radius: 0; }
  .nav-icon { font-size: 22px; margin-bottom: 2px; }

  .label {
    position: static;
    opacity: 1;
    transform: none;
    background: none;
    color: inherit;
    font-size: 10px;
    padding: 0;
    font-weight: 700;
  }
  .logo-container{
    display: none;
  }
}
</style>