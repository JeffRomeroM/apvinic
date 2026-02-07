<script setup>
import Menu from './components/Menu.vue';
import Publicidad from './components/Publicidad.vue';
</script>

<template>
  <div class="app">
    <!-- Menú fijo lateral o inferior -->
    <Menu />
    <Publicidad />

    <!-- Contenido principal -->
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}




body, html, #app {
  height: 100%;
  width: 100%;
}
/* main.css o App.vue <style> */
body {
  background-color: white;
  color: black;
  transition: background-color 0.3s, color 0.3s;
}

.dark body {
  background-color: #121212;
  color: white;
}

.app {
  display: flex;
  min-height: 100vh;
}

/* Contenido principal */
.content {
  flex: 1;
  padding: 1rem;
  margin-left: 60px; /* espacio para menú lateral */

  /* En móviles, elimina el margen izquierdo */
}

@media (max-width: 640px) {
  .app {
    flex-direction: column;
  }

  .content {
    margin-left: 0;
    margin-bottom: 60px; /* espacio para menú inferior */
  }
}
</style>
