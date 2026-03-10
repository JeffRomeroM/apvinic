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
          <input v-model="destino" type="text" placeholder="¿A dónde vas?" />
        </div>
      </div>
    </header>

    <main class="results-container">
      <div class="cards-grid" v-if="rutasFiltradas.length">
        <article class="card" v-for="item in rutasFiltradas" :key="item.id">
          
          <div class="card-media" @click="imagenZoom = item.foto_url">
            <img :src="item.foto_url" class="ruta-img" @error="item.foto_url = 'https://via.placeholder.com/400x200?text=Bus+disponible'" />
            <div class="price-badge" v-if="item.precio > 0">C$ {{ item.precio }}</div>
            <button @click.stop="toggleLike(item.id)" class="fav-button">
              <Icon :icon="esFavorito(item.id) ? 'solar:heart-bold' : 'solar:heart-linear'" :class="{ 'is-liked': esFavorito(item.id) }" />
            </button>
          </div>

          <div class="card-body">
            <div class="owner-info">
              <span>Transporte {{ item.nombre_negocio }}</span>
            </div>

            <h2 class="route-name">
              {{ item.origen }} <Icon icon="solar:arrow-right-outline" /> {{ item.destino }}
            </h2>

            <div class="quick-info">
              <div class="preview-row">
                <div class="preview-item">
                  <Icon icon="solar:map-arrow-up-bold" class="icon-up" />
                  <div class="time-box">
                    <span class="label">{{ item.origen }}</span>
                    <span class="time">{{ formatearHoras(item.hora_origen)[0] || '--:--' }}</span>
                  </div>
                </div>
                <div class="preview-item" v-if="item.hora_destino">
                  <Icon icon="solar:map-arrow-down-bold" class="icon-down" />
                  <div class="time-box">
                    <span class="label">{{ item.destino}}</span>
                    <span class="time">{{ formatearHoras(item.hora_destino)[0] || '--:--' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button @click="abrirDetalles(item)" class="btn-more">
                Ver detalles
              </button>
              <button @click="llamar(item.whatsapp)" class="btn-call-icon">
                <Icon icon="solar:phone-calling-bold" />
              </button>
              <button @click="contactar(item.whatsapp)" class="btn-wa-icon">
                <Icon icon="logos:whatsapp-icon" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="loading" class="status-view">
        <div class="spinner"></div>
      </div>
      <div v-else class="status-view">
        <p>No se encontraron rutas de bus disponibles.</p>
      </div>
    </main>

    <Transition name="slide-up">
      <div v-if="rutaSeleccionada" class="modal-overlay" @click.self="rutaSeleccionada = null">
        <div class="detail-modal">
          <div class="modal-handle"></div>
          <header class="modal-header">
            <h3>Detalles del Servicio</h3>
            <button @click="rutaSeleccionada = null" class="btn-close-modal">✕</button>
          </header>

          <div class="modal-content">
            <div class="route-header">
              <h2>{{ rutaSeleccionada.origen }} a {{ rutaSeleccionada.destino }}</h2>
              <span class="modal-price">C$ {{ rutaSeleccionada.precio }}</span>
            </div>

            <div class="detail-section" v-if="rutaSeleccionada.dias">
              <p class="detail-label">Días de Salida</p>
              <div class="days-row">
                <span v-for="dia in ['L', 'M', 'X', 'J', 'V', 'S', 'D']" 
                  :key="dia" class="day-circle" :class="{ 'active': estaActivo(rutaSeleccionada.dias, dia) }">
                  {{ dia }}
                </span>
              </div>
            </div>

            <div class="detail-section">
              <p class="detail-label">Todos los Horarios</p>
              <div class="schedule-box">
                <div class="group">
                  <span class="group-title">Desde {{ rutaSeleccionada.origen }}</span>
                  <div class="chips-wrapper">
                    <span v-for="h in formatearHoras(rutaSeleccionada.hora_origen)" :key="h" class="h-chip">
                      {{ h }}
                    </span>
                  </div>
                </div>

                <div class="group mt-3" v-if="rutaSeleccionada.hora_destino">
                  <span class="group-title">Desde {{ rutaSeleccionada.destino }}</span>
                  <div class="chips-wrapper">
                    <span v-for="h in formatearHoras(rutaSeleccionada.hora_destino)" :key="h" class="h-chip return">
                      {{ h }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions-grid">
              <button @click="contactar(rutaSeleccionada.whatsapp)" class="btn-wa-full">
                <Icon icon="logos:whatsapp-icon" /> WhatsApp
              </button>
              <button @click="llamar(rutaSeleccionada.whatsapp)" class="btn-call-full">
                <Icon icon="solar:phone-bold" /> Llamar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="imagenZoom" class="zoom-overlay" @click="imagenZoom = null">
      <img :src="imagenZoom" class="full-img" />
    </div>
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
const rutaSeleccionada = ref(null);

const abrirDetalles = (ruta) => { rutaSeleccionada.value = ruta; };

const formatearHoras = (horasString) => {
  if (!horasString) return [];
  return horasString.split(',').map(hora => {
    let h_clean = hora.trim();
    if (!h_clean.includes(':')) return h_clean;
    let [h, m] = h_clean.split(':');
    h = parseInt(h);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  });
};

const estaActivo = (diasBD, diaAbreviado) => {
  if (!diasBD) return false;
  return String(diasBD).toUpperCase().split(',').includes(diaAbreviado);
};

const cargarDatos = async () => {
  loading.value = true;
  try {
    const saved = localStorage.getItem('mis_favoritos');
    if (saved) favs.value = JSON.parse(saved);
    const { data: srv } = await supabase.from('servicios').select('*').order('creado_at', { ascending: false });
    const { data: perf } = await supabase.from('perfiles_duenos').select('id, nombre_negocio');
    rutas.value = srv.map(s => ({
      ...s,
      nombre_negocio: perf?.find(p => p.id === s.dueno_id)?.nombre_negocio || 'Independiente'
    }));
  } finally { loading.value = false; }
};

const rutasFiltradas = computed(() => {
  const o = origen.value.toLowerCase().trim();
  const d = destino.value.toLowerCase().trim();
  return rutas.value.filter(r => {
    const tipo = (r.tipo || '').toLowerCase();
    const esRutaValida = !tipo.includes('taxi') && !tipo.includes('moto');
    return esRutaValida &&
      (r.origen.toLowerCase().includes(o) || r.nombre_negocio.toLowerCase().includes(o)) && 
      (d ? r.destino?.toLowerCase().includes(d) : true);
  });
});

const toggleLike = (id) => {
  const idx = favs.value.indexOf(id);
  idx > -1 ? favs.value.splice(idx, 1) : favs.value.push(id);
  localStorage.setItem('mis_favoritos', JSON.stringify(favs.value));
};
const esFavorito = (id) => favs.value.includes(id);
const contactar = (num) => window.open(`https://wa.me/505${num}`, '_blank');
const llamar = (num) => window.open(`tel:+505${num}`, '_self');

onMounted(cargarDatos);
</script>

<style scoped>
/* (Estilos anteriores se mantienen, añado/ajusto los de los botones) */
.home { background: #f4f7fa; min-height: 100vh; font-family: 'Inter', sans-serif; padding-bottom: 50px; }
.search-header { background: white; padding: 1.5rem 1rem; border-radius: 0 0 2rem 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
h1 { font-weight: 800; text-align: center; margin-bottom: 1rem; font-size: 1.4rem; color: #1e293b; }
.search-box { display: flex; flex-direction: column; gap: 8px; max-width: 450px; margin: 0 auto; }
.input-group { position: relative; }
.input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #d19a02; }
input { width: 100%; padding: 12px 12px 12px 42px; border-radius: 14px; border: 1.5px solid #e2e8f0; outline: none; background: #f8fafc; }

.results-container { padding: 1.2rem; max-width: 500px; margin: 0 auto; }
.cards-grid { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.card { background: white; border-radius: 20px; overflow: hidden; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02); }

.card-media { height: 160px; position: relative; cursor: pointer; }
.ruta-img { width: 100%; height: 100%; object-fit: cover; }
.price-badge { position: absolute; top: 12px; right: 12px; background: #1e293b; color: white; padding: 4px 10px; border-radius: 10px; font-weight: 800; font-size: 0.8rem; }
.fav-button { position: absolute; top: 12px; left: 12px; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; color: #cbd5e1; display: flex; align-items: center; justify-content: center; }
.is-liked { color: #ef4444; }

.card-body { padding: 1rem; }
.owner-info { font-size: 0.65rem; color: #d19a02; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
.route-name { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }

.quick-info { background: #f8fafc; padding: 12px; border-radius: 16px; margin-bottom: 15px; }
.preview-row { display: flex; justify-content: space-between; gap: 10px; }
.preview-item { display: flex; align-items: center; gap: 8px; flex: 1; }
.time-box { display: flex; flex-direction: column; }
.time-box .label { font-size: 0.6rem; text-transform: uppercase; color: #94a3b8; font-weight: 800; }
.time-box .time { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
.icon-up { color: #10b981; }
.icon-down { color: #d19a02; }

/* ACCIONES DE LA CARD */
.card-actions { display: flex; gap: 8px; }
.btn-more { flex: 1; background: #1e293b; color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; }
.btn-wa-icon { background: #e8f5e9; padding: 10px; border-radius: 12px; border: none; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.btn-call-icon { background: #f1f5f9; padding: 10px; border-radius: 12px; border: none; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #1e293b; }

/* MODAL Y BOTONES FULL */
.modal-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 1rem; }
.btn-wa-full { background: #25d366; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.95rem; }
.btn-call-full { background: #d19a02; color: white; border: none; padding: 1rem; border-radius: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.95rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: flex-end; }
.detail-modal { background: white; width: 100%; border-radius: 2rem 2rem 0 0; padding: 1.5rem; max-height: 85vh; overflow-y: auto; }
.modal-handle { width: 40px; height: 5px; background: #e2e8f0; border-radius: 10px; margin: 0 auto 1.5rem; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-header h3 { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; }
.btn-close-modal { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; }

.route-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
.route-header h2 { font-size: 1.2rem; font-weight: 900; margin: 0; color: #1e293b; }
.modal-price { background: #d19a02; color: white; padding: 4px 12px; border-radius: 10px; font-weight: 800; }

.detail-section { margin-bottom: 1.5rem; }
.detail-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; }
.days-row { display: flex; justify-content: space-between; }
.day-circle { width: 35px; height: 35px; border-radius: 50%; background: #f8fafc; color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; border: 1.5px solid #f1f5f9; }
.day-circle.active { background: #d19a02; color: white; border-color: #d19a02; }

.schedule-box { background: #f8fafc; border-radius: 1.5rem; padding: 1.2rem; }
.group-title { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 8px; }
.chips-wrapper { display: flex; flex-wrap: wrap; gap: 8px; }
.h-chip { background: #1e293b; color: white; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; }
.h-chip.return { background: white; color: #1e293b; border: 2px solid #1e293b; }

.zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; }
.full-img { max-width: 90%; max-height: 80vh; border-radius: 1rem; }
.spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #d19a02; border-radius: 50%; animation: spin 1s linear infinite; margin: auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>