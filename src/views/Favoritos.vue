<template>
  <div class="fav-manager">
    <header class="manager-header">
      <div class="nav-top">
        <button @click="router.back()" class="btn-back">
          <Icon icon="solar:alt-arrow-left-outline" />
        </button>
        <h1>Mis Guardados</h1>
      </div>

      <div class="tabs-container">
        <button 
          :class="['tab-link', { active: activeTab === 'rutas' }]" 
          @click="activeTab = 'rutas'"
        >
          <Icon icon="solar:bus-bold" />
          <span>Rutas</span>
        </button>
        <button 
          :class="['tab-link', { active: activeTab === 'lugares' }]" 
          @click="activeTab = 'lugares'"
        >
          <Icon icon="solar:map-point-favourite-bold" />
          <span>Lugares</span>
        </button>
      </div>
    </header>

    <main class="manager-content">
      <div v-if="activeTab === 'rutas'" class="tab-panel">
        <div v-if="loading" class="loader-box">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="rutasFav.length === 0" class="empty-state">
          <Icon icon="solar:heart-break-bold-duotone" />
          <p>No tienes rutas guardadas</p>
          <button @click="router.push('/')" class="btn-go">Explorar</button>
        </div>

        <div v-else class="fav-grid">
          <div v-for="ruta in rutasFav" :key="ruta.id" class="modern-card">
            <div class="card-img-box">
              <img :src="ruta.foto_url" @error="ruta.foto_url = 'https://via.placeholder.com/150'" />
              <button @click="quitarRuta(ruta.id)" class="btn-heart-fav active">
                <Icon icon="solar:heart-bold" />
              </button>
            </div>
            <div class="card-info">
              <span class="type-tag" :class="ruta.tipo">{{ ruta.tipo }}</span>
              <h4 class="route-title">{{ ruta.origen }} <Icon icon="solar:arrow-right-linear" /> {{ ruta.destino }}</h4>
              <p class="price-tag">C$ {{ ruta.precio }}</p>
                <button class="btn-whatsapp" @click.stop="contactar(item.whatsapp)">
              <Icon icon="logos:whatsapp-icon" />
              Contactar
            </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'lugares'" class="tab-panel">
        <div v-if="lugaresFav.length === 0" class="empty-state">
          <Icon icon="solar:map-point-remove-bold-duotone" />
          <p>Aún no has guardado lugares</p>
        </div>

        <div v-else class="fav-grid">
          <div v-for="lugar in lugaresFav" :key="lugar.id" class="modern-card">
            <div class="card-img-box">
              <img :src="lugar.imagen" />
              <button @click="quitarLugar(lugar.id)" class="btn-heart-fav active">
                <Icon icon="solar:heart-bold" />
              </button>
            </div>
            <div class="card-info">
              <span class="cat-tag">{{ lugar.categoria }}</span>
              <h4 class="place-title">{{ lugar.nombre }}</h4>
              <p class="location-txt"><Icon icon="solar:map-point-linear" /> {{ lugar.ubicacion }}</p>
              <button class="btn-whatsapp" @click.stop="contactar(item.whatsapp)">
                <Icon icon="logos:whatsapp-icon" />
                Contactar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const router = useRouter();
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const activeTab = ref('rutas');
const loading = ref(false);
const rutasFav = ref([]);
const idsLugares = ref([]);

const lugaresData = [
  { id: 1, nombre: 'Asados El Cañón', categoria: 'restaurante', ubicacion: 'Estelí', imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500' },
  { id: 2, nombre: 'Hotel Los Pinos', categoria: 'hotel', ubicacion: 'Matagalpa', imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500' },
  { id: 3, nombre: 'Café de la Montaña', categoria: 'restaurante', ubicacion: 'León', imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' },
  { id: 4, nombre: 'Mirador El Crucero', categoria: 'ocio', ubicacion: 'Managua', imagen: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500' }
];

const lugaresFav = computed(() => {
  return lugaresData.filter(lugar => idsLugares.value.includes(lugar.id));
});

const cargarTodo = async () => {
  loading.value = true;
  const rutaIds = JSON.parse(localStorage.getItem('mis_favoritos') || '[]');
  
  if (rutaIds.length > 0) {
    const { data, error } = await supabase.from('servicios').select('*').in('id', rutaIds);
    if (!error) rutasFav.value = data;
  }

  idsLugares.value = JSON.parse(localStorage.getItem('guia_favoritos') || '[]');
  loading.value = false;
};

const quitarRuta = (id) => {
  rutasFav.value = rutasFav.value.filter(r => r.id !== id);
  localStorage.setItem('mis_favoritos', JSON.stringify(rutasFav.value.map(r => r.id)));
};

const quitarLugar = (id) => {
  idsLugares.value = idsLugares.value.filter(lId => lId !== id);
  localStorage.setItem('guia_favoritos', JSON.stringify(idsLugares.value));
};

onMounted(cargarTodo);
</script>

<style scoped>
.fav-manager {
  --p: #d19a02;
  --bg: #f8fafc;
  background: var(--bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
/* BOTÓN WHATSAPP */
.btn-whatsapp { 
  width: 100%; background: var(--p); color: white; border: none; 
  padding: 0.8rem; border-radius: 1rem; font-weight: 700; display: flex; 
  align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem;
  transition: opacity 0.2s;
}
.btn-whatsapp:active { opacity: 0.8; }
/* HEADER */
.manager-header {
  background: white;
  padding: 1.5rem 1rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.nav-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.btn-back {
  background: #f1f5f9;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e293b;
}

.nav-top h1 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }

.tabs-container {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 14px;
}

.tab-link {
  flex: 1;
  border: none;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
  background: transparent;
  transition: 0.3s;
}

.tab-link.active {
  background: white;
  color: var(--p);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* CONTENT GRID */
.manager-content { padding: 1rem; }

.fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.modern-card {
  background: white;
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.card-img-box {
  position: relative;
  height: 120px;
}

.card-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-heart-fav {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  cursor: pointer;
}

.btn-heart-fav.active { color: #ef4444; }

.card-info { padding: 0.8rem; }

.route-title, .place-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0.4rem 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-tag, .cat-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-tag.bus { background: #dbeafe; color: #1e40af; }
.type-tag.taxi { background: #fef9c3; color: #854d0e; }
.type-tag.moto { background: #dcfce7; color: #166534; }
.cat-tag { background: #f1f5f9; color: #475569; }

.price-tag { font-weight: 800; color: #16a34a; font-size: 0.85rem; margin: 0; }
.location-txt { font-size: 0.75rem; color: #64748b; margin: 0; display: flex; align-items: center; gap: 3px; }

/* STATES */
.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  color: #94a3b8;
}

.empty-state svg { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }

.btn-go {
  margin-top: 1rem;
  background: var(--p);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
}

.loader-box { display: flex; justify-content: center; padding: 4rem; }
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--p);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>