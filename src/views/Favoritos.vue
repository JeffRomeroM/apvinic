<template>
  <div class="fav-manager">
    <header class="manager-header">
      <div class="nav-top">
      
        <h1>Mis favoritos</h1>
      </div>

      <div class="tabs-container">
        <button 
          :class="['tab-link', { active: activeTab === 'rutas' }]" 
          @click="activeTab = 'rutas'"
        >
          <Icon icon="solar:bus-bold" />
          <span>Transporte</span>
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
          <article v-for="ruta in rutasFav" :key="ruta.id" class="modern-card">
            <div class="card-img-box">
              <img :src="ruta.foto_url || '/placeholder-bus.png'" />
              <button @click="quitarRuta(ruta.id)" class="btn-heart-fav active">
                <Icon icon="solar:heart-bold" />
              </button>
            </div>
            <div class="card-info">
              <span class="type-tag" :class="ruta.tipo">{{ ruta.tipo }}</span>
              <h4 class="route-title">{{ ruta.origen }} <Icon icon="solar:arrow-right-linear" /> {{ ruta.destino }}</h4>
              <p class="price-tag">C$ {{ ruta.precio }}</p>
              <a :href="`https://wa.me/${ruta.whatsapp?.replace(/[^0-9]/g, '')}`" target="_blank" class="btn-whatsapp">
                <Icon icon="logos:whatsapp-icon" /> Contactar
              </a>
            </div>
          </article>
        </div>
      </div>

      <div v-if="activeTab === 'lugares'" class="tab-panel">
        <div v-if="loading" class="loader-box">
          <div class="spinner"></div>
        </div>

        <div v-else-if="lugaresFav.length === 0" class="empty-state">
          <Icon icon="solar:map-point-remove-bold-duotone" />
          <p>Aún no has guardado lugares</p>
          <button @click="router.push('/lugares')" class="btn-go">Ver guía</button>
        </div>

        <div v-else class="fav-grid">
          <article v-for="lugar in lugaresFav" :key="lugar.id" class="modern-card">
            <div class="card-img-box">
              <img :src="lugar.foto_url || '/placeholder-place.png'" />
              <button @click="quitarLugar(lugar.id)" class="btn-heart-fav active">
                <Icon icon="solar:heart-bold" />
              </button>
            </div>
            <div class="card-info">
              <span class="cat-tag">Destino</span>
              <h4 class="place-title">{{ lugar.nombre }}</h4>
              <p class="location-txt"><Icon icon="solar:map-point-linear" /> {{ lugar.direccion }}</p>
              <a :href="`https://wa.me/${lugar.celular?.replace(/[^0-9]/g, '')}`" target="_blank" class="btn-whatsapp">
                <Icon icon="logos:whatsapp-icon" /> Contactar
              </a>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const router = useRouter();
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const activeTab = ref('rutas');
const loading = ref(false);
const rutasFav = ref([]);
const lugaresFav = ref([]);

const cargarTodo = async () => {
  loading.value = true;
  
  // 1. Cargar Rutas (Transporte)
  const rutaIds = JSON.parse(localStorage.getItem('mis_favoritos') || '[]');
  if (rutaIds.length > 0) {
    const { data: dataR } = await supabase.from('servicios').select('*').in('id', rutaIds);
    if (dataR) rutasFav.value = dataR;
  }

  // 2. Cargar Lugares (Guía)
  const lugarIds = JSON.parse(localStorage.getItem('lugares_favs') || '[]');
  if (lugarIds.length > 0) {
    const { data: dataL } = await supabase.from('lugares').select('*').in('id', lugarIds);
    if (dataL) lugaresFav.value = dataL;
  }

  loading.value = false;
};

const quitarRuta = (id) => {
  rutasFav.value = rutasFav.value.filter(r => r.id !== id);
  localStorage.setItem('mis_favoritos', JSON.stringify(rutasFav.value.map(r => r.id)));
};

const quitarLugar = (id) => {
  lugaresFav.value = lugaresFav.value.filter(l => l.id !== id);
  localStorage.setItem('lugares_favs', JSON.stringify(lugaresFav.value.map(l => l.id)));
};

onMounted(cargarTodo);
</script>

<style scoped>
.fav-manager {
  --p: #d19a02;
  --bg: #f8fafc;
  background: var(--bg);
  min-height: 100vh;
}

/* BOTÓN WHATSAPP */
.btn-whatsapp { 
  width: 100%; background: #25d366; color: white; border: none; 
  padding: 0.6rem; border-radius: 10px; font-weight: 700; display: flex; 
  align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.8rem;
  text-decoration: none; font-size: 0.8rem;
}

/* HEADER */
.manager-header { background: white; padding: 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.nav-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.btn-back { background: #f1f5f9; border: none; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.nav-top h1 { font-size: 1.2rem; font-weight: 900; }

.tabs-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; }
.tab-link { flex: 1; border: none; padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: #64748b; background: transparent; transition: 0.3s; }
.tab-link.active { background: white; color: var(--p); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

/* GRID */
.manager-content { padding: 1rem; }
.fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.modern-card { background: white; border-radius: 1.2rem; overflow: hidden; border: 1.5px solid #f1f5f9; }
.card-img-box { position: relative; height: 110px; }
.card-img-box img { width: 100%; height: 100%; object-fit: cover; }

.btn-heart-fav { position: absolute; top: 8px; right: 8px; background: white; border: none; width: 30px; height: 30px; border-radius: 50%; color: #ef4444; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }

.card-info { padding: 0.8rem; }
.route-title, .place-title { font-size: 0.85rem; font-weight: 800; margin: 0.4rem 0; color: #0f172a; }
.type-tag, .cat-tag { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; padding: 2px 6px; border-radius: 5px; }
.cat-tag { background: #fef3c7; color: #92400e; }
.price-tag { font-weight: 900; color: #16a34a; font-size: 0.8rem; }
.location-txt { font-size: 0.7rem; color: #64748b; margin: 0; display: flex; align-items: center; gap: 3px; }

.empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
.empty-state svg { font-size: 3.5rem; margin-bottom: 1rem; }
.btn-go { background: var(--p); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 12px; font-weight: 800; margin-top: 1rem; }

.spinner { width: 30px; height: 30px; border: 3px solid #f1f5f9; border-top-color: var(--p); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 2rem auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>