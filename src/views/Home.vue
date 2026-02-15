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
        
        <div class="card-image-container">
          <img :src="item.foto_url" class="ruta-img" alt="Unidad" />
          <div class="card-price">C$ {{ item.precio }}</div>
          
          <button @click.stop="toggleLike(item.id)" class="btn-heart">
            <Icon 
              :icon="esFavorito(item.id) ? 'solar:heart-bold' : 'solar:heart-linear'" 
              :class="{ 'is-liked': esFavorito(item.id) }" 
            />
          </button>
        </div>

        <div class="card-header">
          <h2>
            {{ item.origen }} <span v-if="item.destino">→ {{ item.destino }}</span>
            <span class="empresa-label">{{ item.nombre || 'Transporte Independiente' }}</span>
          </h2>
        </div>

        <div class="card-body">
          <div class="badge-row">
            <span :class="['type-tag', item.tipo]">{{ item.tipo }}</span>
            <span v-if="item.hora_salida" class="time-tag">
              <Icon icon="solar:clock-circle-bold" /> {{ item.hora_salida }}
            </span>
          </div>

          <p v-if="item.whatsapp"><strong>Contacto:</strong> +505 {{ item.whatsapp }}</p>
          
          <button @click="contactar(item.whatsapp)" class="btn-detalles">
            <Icon icon="logos:whatsapp-icon" />
            Contactar ahora
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="sin-resultados">Cargando rutas...</div>
    <p v-else class="sin-resultados">No se encontraron rutas disponibles.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

// CONFIGURACIÓN SUPABASE
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const origen = ref("");
const destino = ref("");
const rutas = ref([]);
const loading = ref(true);
const favs = ref([]);

// CARGAR DATOS
const cargarDatos = async () => {
  loading.value = true;
  const saved = localStorage.getItem('mis_favoritos');
  if (saved) favs.value = JSON.parse(saved);

  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('creado_at', { ascending: false });
  
  if (!error) rutas.value = data;
  loading.value = false;
};

// FILTRADO INTELIGENTE
const rutasFiltradas = computed(() => {
  const o = origen.value.toLowerCase().trim();
  const d = destino.value.toLowerCase().trim();

  if (!o && !d) return rutas.value;

  return rutas.value.filter(r => {
    const ro = r.origen.toLowerCase();
    const rd = (r.destino || "").toLowerCase();
    const rn = (r.nombre || "").toLowerCase();

    // Filtra por origen, destino o nombre de empresa
    return ro.includes(o) || rd.includes(o) || rn.includes(o) || rd.includes(d);
  });
});

// FUNCIONES EXTRA
const toggleLike = (id) => {
  const index = favs.value.indexOf(id);
  if (index > -1) favs.value.splice(index, 1);
  else favs.value.push(id);
  localStorage.setItem('mis_favoritos', JSON.stringify(favs.value));
};
const esFavorito = (id) => favs.value.includes(id);
const contactar = (num) => window.open(`https://wa.me/505${num}`, '_blank');

onMounted(cargarDatos);
</script>

<style scoped>
.home { max-width: 1100px; margin: auto; padding: 24px; background: #f6f7f9; min-height: 100vh; }

h1 { text-align: center; margin-bottom: 25px; font-size: 26px; font-weight: 800; color: #111827; }

/* INPUTS ESTILO MODERNO */
.inputs-in-drive { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; max-width: 600px; margin: 0 auto 30px; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: #d19a02; font-size: 1.2rem; }
.input-in-drive { width: 100%; padding: 14px 14px 14px 40px; border-radius: 12px; border: 1px solid #e5e7eb; outline: none; transition: 0.3s; }
.input-in-drive:focus { border-color: #d19a02; box-shadow: 0 0 0 4px rgba(209, 154, 2, 0.1); }

/* CARDS */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 22px; }
.card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); transition: 0.3s; }
.card:hover { transform: translateY(-5px); }

.card-image-container { position: relative; height: 180px; }
.ruta-img { width: 100%; height: 100%; object-fit: cover; }
.card-price { position: absolute; bottom: 12px; right: 12px; background: #fff; color: #d19a02; font-weight: 800; padding: 6px 12px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

.btn-heart { position: absolute; top: 12px; left: 12px; background: #fff; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #cbd5e1; }
.is-liked { color: #ef4444 !important; }

.card-header { padding: 15px 20px 5px; }
.card-header h2 { margin: 0; font-size: 1.1rem; color: #1f2937; }
.empresa-label { display: block; font-size: 0.85rem; color: #6b7280; font-weight: 400; margin-top: 4px; }

.card-body { padding: 0 20px 20px; }
.badge-row { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
.type-tag { text-transform: uppercase; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; }
.type-tag.bus { background: #dbeafe; color: #1e40af; }
.type-tag.taxi { background: #fef9c3; color: #a16207; }
.type-tag.moto { background: #dcfce7; color: #15803d; }
.time-tag { font-size: 0.85rem; font-weight: 700; color: #d19a02; display: flex; align-items: center; gap: 4px; }

.btn-detalles { margin-top: 15px; width: 100%; padding: 12px; border-radius: 12px; border: none; background: #d19a02; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }

@media (max-width: 600px) { .inputs-in-drive { grid-template-columns: 1fr; } }
</style>