<template>
  <div class="home">
    <h1>Busca tu ruta</h1>

    <div class="inputs-in-drive">
      <div class="input-wrapper">
        <Icon icon="solar:map-point-wave-bold" class="input-icon" />
        <input v-model="origen" type="text" placeholder="Punto de partida" class="input-in-drive" />
      </div>
      <div class="input-wrapper">
        <Icon icon="solar:route-bold" class="input-icon" />
        <input v-model="destino" type="text" placeholder="Destino (Opcional)" class="input-in-drive" />
      </div>
    </div>

    <div class="cards" v-if="rutasFiltradas.length">
      <div class="card" v-for="item in rutasFiltradas" :key="item.id">
        
        <div class="card-image-container" @click="imagenZoom = item.foto_url">
          <img :src="item.foto_url" class="ruta-img" alt="Unidad" />
          <div class="card-price">C$ {{ item.precio }}</div>
          
          <button @click.stop="toggleLike(item.id)" class="btn-heart">
            <Icon :icon="esFavorito(item.id) ? 'solar:heart-bold' : 'solar:heart-linear'" :class="{ 'is-liked': esFavorito(item.id) }" />
          </button>
        </div>

        <div class="card-content">
          <div class="biz-header">
            <span class="empresa-name">Transporte {{ item.nombre_negocio }}</span>
            <span class="type-tag">Bus</span>
          </div>

          <h2 class="ruta-title">
            {{ item.origen }} 
            <Icon icon="solar:alt-arrow-right-outline" class="arrow" v-if="item.destino" /> 
            {{ item.destino }}
          </h2>

          <div class="card-footer">
            <span v-if="item.hora_salida" class="time-tag">
              <Icon icon="solar:clock-circle-bold" /> {{ item.hora_salida }}
            </span>
            <button @click="contactar(item.whatsapp)" class="btn-whatsapp">
              <Icon icon="logos:whatsapp-icon" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="status-box">
      <div class="spinner"></div>
      <p>Buscando unidades...</p>
    </div>
    <div v-else class="status-box">
      <p>No hay rutas disponibles.</p>
    </div>

    <div v-if="imagenZoom" class="zoom-overlay" @click="imagenZoom = null">
      <button class="btn-close-zoom">✕</button>
      <img :src="imagenZoom" class="img-full" />
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
  return rutas.value.filter(r => (r.origen.toLowerCase().includes(o) || r.nombre_negocio.toLowerCase().includes(o)) && (d ? r.destino?.toLowerCase().includes(d) : true));
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
.home { max-width: 900px; margin: auto; padding: 20px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
h1 { text-align: center; font-size: 1.5rem; font-weight: 900; color: #0f172a; margin-bottom: 20px; }

/* BUSCADOR */
.inputs-in-drive { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: #d19a02; }
.input-in-drive { width: 100%; padding: 12px 12px 12px 38px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; font-size: 0.9rem; font-weight: 500; }

/* CARDS RE DISEÑADAS */
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
.card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }

.card-image-container { height: 160px; position: relative; cursor: zoom-in; }
.ruta-img { width: 100%; height: 100%; object-fit: cover; }
.card-price { position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); color: #0f172a; font-weight: 800; padding: 4px 10px; border-radius: 8px; font-size: 0.85rem; }
.btn-heart { position: absolute; top: 10px; left: 10px; background: white; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

.card-content { padding: 12px; }
.biz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.empresa-name { font-size: 0.75rem; font-weight: 700; color: #d19a02; text-transform: uppercase; letter-spacing: 0.5px; }
.type-tag { font-size: 0.6rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 700; }

.ruta-title { font-size: 0.95rem; color: #1e293b; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.arrow { color: #94a3b8; font-size: 0.8rem; }

.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #f1f5f9; }
.time-tag { font-size: 0.8rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 4px; }
.btn-whatsapp { background: #25d366; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 5px; cursor: pointer; }

/* ZOOM MODAL */
.zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.img-full { max-width: 100%; max-height: 80vh; border-radius: 8px; }
.btn-close-zoom { position: absolute; top: 20px; right: 20px; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; }

.status-box { text-align: center; padding: 50px; color: #94a3b8; }
.spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #d19a02; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) { .inputs-in-drive { grid-template-columns: 1fr; } }
</style>