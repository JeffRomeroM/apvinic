<template>
  <div class="perfil-container">
    <header class="perfil-header">
      <div class="header-top">
        <h1>Mi Perfil</h1>
        <button @click="logoutSimulado" class="btn-icon-logout">
          <span class="iconify" data-icon="solar:logout-3-bold-duotone"></span>
        </button>
      </div>
      
      <div class="status-card">
        <div class="bus-icon-wrapper">
          <span class="iconify" data-icon="solar:bus-bold-duotone"></span>
        </div>
        <div class="status-info">
          <h2>{{ perfil.nombre_negocio }}</h2>
          <div :class="['badge', perfil.verificado ? 'verified' : 'pending']">
            <span class="iconify" :data-icon="perfil.verificado ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'"></span>
            {{ perfil.verificado ? 'Cuenta Verificada' : 'Pendiente de Validación' }}
          </div>
        </div>
      </div>
    </header>

    <main class="perfil-form">
      <div class="input-group">
        <label>Nombre del Negocio / Cooperativa</label>
        <div class="input-wrapper">
          <span class="iconify" data-icon="solar:shop-2-bold-duotone"></span>
          <input 
            v-model="perfil.nombre_negocio" 
            type="text" 
            placeholder="Ej: Transporte El Segoviano"
          >
        </div>
      </div>

      <div class="input-group disabled">
        <label>Correo Electrónico (Privado)</label>
        <div class="input-wrapper">
          <span class="iconify" data-icon="solar:letter-bold-duotone"></span>
          <input :value="perfil.email" type="email" disabled>
        </div>
      </div>

      <button @click="guardarSimulado" :disabled="loading" class="btn-save">
        <span v-if="!loading" class="iconify" data-icon="solar:diskette-bold-duotone"></span>
        <span>{{ loading ? 'Procesando...' : 'Guardar Cambios' }}</span>
      </button>

      <p class="support-text">
        La verificación de cuenta asegura que tus rutas aparezcan en los primeros resultados de búsqueda.
      </p>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Estado local reactivo (Simulando datos que vendrían de una DB)
const loading = ref(false);
const perfil = ref({
  nombre_negocio: 'Transportes Jarquín',
  email: 'contacto@busnica.com',
  verificado: false // Cambia a true para ver el estilo verificado
});

const guardarSimulado = () => {
  loading.value = true;
  
  // Simulamos una petición de red de 1.5 segundos
  setTimeout(() => {
    loading.value = false;
    alert(`Éxito: Datos de "${perfil.value.nombre_negocio}" actualizados localmente.`);
  }, 1500);
};

const logoutSimulado = () => {
  if(confirm("¿Estás seguro que deseas cerrar sesión?")) {
    alert("Sesión cerrada (Simulación)");
  }
};
</script>

<style scoped>
/* Variables de diseño */
.perfil-container {
  --primary: #1e3a8a;
  --accent: #facc15;
  --bg: #f8fafc;
  --text-main: #0f172a;
  --text-muted: #64748b;
  
  background: var(--bg);
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, sans-serif;
}

.perfil-header {
  background: var(--primary);
  padding: 2.5rem 1.5rem 4.5rem;
  border-radius: 0 0 2.5rem 2.5rem;
  color: white;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-top h1 { font-size: 1.4rem; margin: 0; }

.btn-icon-logout {
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  padding: 0.6rem;
  border-radius: 50%;
  display: flex;
  cursor: pointer;
  transition: 0.3s;
}

.btn-icon-logout:hover { background: rgba(255,255,255,0.25); }

.status-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
}

.bus-icon-wrapper {
  background: #fef9c3;
  color: #a16207;
  padding: 1rem;
  border-radius: 1.2rem;
  font-size: 2.2rem;
  display: flex;
}

.status-info h2 {
  color: var(--text-main);
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.3rem;
}

.verified { color: #2563eb; }
.pending { color: var(--text-muted); }

.perfil-form {
  padding: 1.5rem;
  margin-top: -2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
  padding-left: 0.5rem;
}

.input-wrapper {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1.2rem;
  display: flex;
  align-items: center;
  padding: 0 1.2rem;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.05);
}

.input-wrapper .iconify {
  color: var(--text-muted);
  font-size: 1.3rem;
}

.input-wrapper input {
  border: none;
  padding: 1.1rem;
  width: 100%;
  outline: none;
  font-size: 1rem;
  font-weight: 500;
  background: transparent;
}

.disabled { opacity: 0.65; cursor: not-allowed; }

.btn-save {
  background: var(--primary);
  color: white;
  border: none;
  padding: 1.2rem;
  border-radius: 1.2rem;
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  transition: all 0.3s ease;
}

.btn-save:active { transform: scale(0.96); }
.btn-save:disabled { background: #94a3b8; cursor: not-allowed; }

.support-text {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  padding: 0 1rem;
}
</style>