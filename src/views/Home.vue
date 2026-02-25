<template>
  <div class="home">
    <header class="search-header">
      <h1>Busca tu ruta</h1>
      <div class="search-box">
        <div class="input-group">
          <Icon icon="solar:map-point-wave-bold" class="input-icon" />
          <input v-model="origen" type="text" placeholder="¿De dónde sales?" />
        </div>
        <div class="input-group">
          <Icon icon="solar:route-bold" class="input-icon" />
          <input v-model="destino" type="text" placeholder="¿A dónde vas? (Opcional)" />
        </div>
      </div>
    </header>

    <main class="results-container">
      <div class="cards-grid" v-if="rutasFiltradas.length">
        <div class="card" v-for="item in rutasFiltradas" :key="item.id">
          
          <div class="card-media" @click="imagenZoom = item.foto_url">
            <img :src="item.foto_url" class="ruta-img" alt="Bus" @error="item.foto_url = 'https://via.placeholder.com/400x200?text=Bus+disponible'" />
            <div class="price-badge">C$ {{ item.precio }}</div>
            <button @click.stop="toggleLike(item.id)" class="fav-button">
              <Icon :icon="esFavorito(item.id) ? 'solar:heart-bold' : 'solar:heart-linear'" :class="{ 'is-liked': esFavorito(item.id) }" />
            </button>
            <div class="category-tag">Bus</div>
          </div>

          <div class="card-body">
            <div class="owner-info">
              <Icon icon="solar:bus-bold" />
              <span>{{ item.nombre_negocio }}</span>
            </div>

            <h2 class="route-name">
              {{ item.origen }} 
              <Icon icon="solar:arrow-right-outline" /> 
              {{ item.destino || 'Destino pendiente' }}
            </h2>

            <div class="schedule-section">
              <div class="time-block" v-if="item.hora_origen">
                <span class="city">{{ item.origen }}</span>
                <span class="hour">{{ formatearHora(item.hora_origen) }}</span>
              </div>
              <div class="time-divider" v-if="item.hora_destino"></div>
              <div class="time-block" v-if="item.hora_destino">
                <span class="city">{{ item.destino }}</span>
                <span class="hour">{{ formatearHora(item.hora_destino) }}</span>
              </div>
              
            </div>

            <div class="card-actions">
              <button @click="contactar(item.whatsapp)" class="btn-wa">
                <Icon icon="logos:whatsapp-icon" />
                Contactar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="loading" class="status-view">
        <div class="spinner"></div>
        <p>Buscando las mejores rutas...</p>
      </div>
      <div v-else class="status-view">
        <Icon icon="solar:map-point-remove-broken" class="empty-icon" />
        <p>No encontramos rutas para esa búsqueda.</p>
      </div>
    </main>

    <Transition name="fade">
      <div v-if="imagenZoom" class="zoom-overlay" @click="imagenZoom = null">
        <button class="close-zoom">✕</button>
        <img :src="imagenZoom" class="full-img" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const origen = ref("");
const destino = ref("");
const rutas = ref([]);
const loading = ref(true);
const favs = ref([]);
const imagenZoom = ref(null);

const formatearHora = (hora) => {
  if (!hora) return '';
  let [h, m] = hora.split(':');
  h = parseInt(h);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const cargarDatos = async () => {
  loading.value = true;
  try {
    const saved = localStorage.getItem('mis_favoritos');
    if (saved) favs.value = JSON.parse(saved);

    const { data: dataServicios } = await supabase.from('servicios').select('*').eq('tipo', 'bus').order('creado_at', { ascending: false });
    const { data: dataPerfiles } = await supabase.from('perfiles_duenos').select('id, nombre_negocio');

    rutas.value = dataServicios.map(srv => ({
      ...srv,
      nombre_negocio: dataPerfiles?.find(p => p.id === srv.dueno_id)?.nombre_negocio || 'Independiente'
    }));
  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
};

const rutasFiltradas = computed(() => {
  const o = origen.value.toLowerCase().trim();
  const d = destino.value.toLowerCase().trim();
  return rutas.value.filter(r => 
    (r.origen.toLowerCase().includes(o) || r.nombre_negocio.toLowerCase().includes(o)) && 
    (d ? r.destino?.toLowerCase().includes(d) : true)
  );
});

const toggleLike = (id) => {
  const idx = favs.value.indexOf(id);
  idx > -1 ? favs.value.splice(idx, 1) : favs.value.push(id);
  localStorage.setItem('mis_favoritos', JSON.stringify(favs.value));
};
const esFavorito = (id) => favs.value.includes(id);
const contactar = (num) => window.open(`https://wa.me/505${num}`, '_blank');

onMounted(cargarDatos);
</script>

<style scoped>
.home { background: #f1f5f9; min-height: 100vh; font-family: 'Inter', sans-serif; padding-bottom: 40px; }

/* Header & Search */
.search-header { background: white; padding: 2rem 1rem; border-radius: 0 0 2rem 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
h1 { font-weight: 900; text-align: center; margin-bottom: 1.5rem; color: #0f172a; }
.search-box { display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin: 0 auto; }
.input-group { position: relative; }
.input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #d19a02; font-size: 1.2rem; }
input { width: 100%; padding: 14px 14px 14px 45px; border-radius: 16px; border: 2px solid #f1f5f9; outline: none; transition: 0.3s; font-size: 1rem; }
input:focus { border-color: #d19a02; background: white; }

/* Grid */
.results-container { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

/* Card */
.card { background: white; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; transition: 0.3s; position: relative; }
.card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }

.card-media { height: 180px; position: relative; overflow: hidden; cursor: zoom-in; }
.ruta-img { width: 100%; height: 100%; object-fit: cover; }

.price-badge { position: absolute; top: 12px; right: 12px; background: #0f172a; color: white; padding: 6px 12px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; }
.fav-button { position: absolute; top: 12px; left: 12px; background: white; border: none; width: 36px; height: 36px; border-radius: 50%; color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.is-liked { color: #ef4444; }
.category-tag { position: absolute; bottom: 12px; left: 12px; background: rgba(209, 154, 2, 0.9); color: white; padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }

/* Card Info */
.card-body { padding: 1.2rem; }
.owner-info { display: flex; align-items: center; gap: 6px; color: #d19a02; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
.route-name { font-size: 1.1rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 8px; margin-bottom: 1.2rem; }

/* Schedule Design */
.schedule-section { background: #f8fafc; border-radius: 16px; padding: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
.time-block { display: flex; flex-direction: column; }
.time-block .city { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
.time-block .hour { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
.time-divider { width: 1px; height: 30px; background: #e2e8f0; }

.btn-wa { width: 100%; background: #25d366; color: white; border: none; padding: 12px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.9rem; }

/* Status */
.status-view { text-align: center; padding: 4rem 1rem; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 4px solid #e2e8f0; border-top-color: #d19a02; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

/* Zoom */
.zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.full-img { max-width: 95%; max-height: 85vh; border-radius: 1rem; object-fit: contain; }
.close-zoom { position: absolute; top: 20px; right: 20px; background: white; border: none; width: 45px; height: 45px; border-radius: 50%; font-size: 1.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (min-width: 600px) {
  .search-box { flex-direction: row; }
}
</style>