<template>
  <div class="search-container">
    <header class="search-header">
      <div class="header-content">
        <h1>Transporte Local</h1>
        <p>¿Qué buscas hoy?</p>
        
        <div class="search-bar">
          <Icon icon="solar:magnifer-linear" class="search-icon" />
          <input 
            v-model="query" 
            type="text" 
            placeholder="Ej: Estelí, Managua, Central..."
          />
        </div>
      </div>

      <div class="filter-scroll">
        <button 
          v-for="cat in categorias" 
          :key="cat.value"
          :class="['filter-chip', { active: filtroTipo === cat.value }]"
          @click="filtroTipo = cat.value"
        >
          <Icon :icon="cat.icon" />
          {{ cat.name }}
        </button>
      </div>
    </header>

    <main class="results-list">
      <div v-if="loading" class="status-msg">
        <div class="spinner"></div>
        <p>Buscando unidades...</p>
      </div>

      <div v-else-if="serviciosFiltrados.length === 0" class="empty-state">
        <Icon icon="solar:map-point-remove-broken" />
        <p>No encontramos servicios que coincidan.</p>
      </div>

      <div v-else v-for="item in serviciosFiltrados" :key="item.id" class="feed-card">
        <div class="card-image">
          <img :src="item.foto_url" alt="Unidad" loading="lazy" />
          <div v-if="item.tipo !== 'taxi' && item.tipo !== 'moto'" class="card-price">
            C$ {{ item.precio }}
          </div>
          
          <button @click.stop="toggleLike(item.id)" class="btn-heart">
            <Icon 
              :icon="esFavorito(item.id) ? 'solar:heart-bold' : 'solar:heart-linear'" 
              :class="{ 'is-liked': esFavorito(item.id) }" 
            />
          </button>
        </div>
        
        <div class="card-details">
          <div class="card-top">
            <h2 class="empresa-txt"> {{ 
            item.tipo === 'bus' ? 'Transporte ' + item.nombre_negocio :
            item.tipo === 'taxi' ? 'Taxi ' + item.nombre_negocio :
            item.tipo === 'moto' ? 'Motomandados ' + item.nombre_negocio :
            item.nombre_negocio 
          }}
          </h2>
            <span :class="['type-tag', item.tipo]">{{ item.tipo }}</span>
          </div>

          <h3 class="card-title">
            {{ item.origen }} 
            <span v-if="item.destino" class="arrow">→</span> 
            <span v-if="item.destino">{{ item.destino }}</span>
          </h3>

          <div class="card-meta">
            <span v-if="item.hora_salida" class="time-tag">
              <Icon icon="solar:clock-circle-bold" /> {{ item.hora_salida }}
            </span>
          </div>

          <div class="card-footer">
            <button class="btn-whatsapp" @click.stop="contactar(item.whatsapp)">
              <Icon icon="logos:whatsapp-icon" />
              Contactar
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';

// CONFIGURACIÓN CLIENTE
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

// ESTADOS
const servicios = ref([]);
const loading = ref(true);
const query = ref('');
const filtroTipo = ref('todos');
const favs = ref([]);

const categorias = [
  { name: 'Todos', value: 'todos', icon: 'solar:globus-linear' },
  { name: 'Buses', value: 'bus', icon: 'solar:bus-bold' },
  { name: 'Taxis', value: 'taxi', icon: 'solar:automotive-bold' },
  { name: 'Motos', value: 'moto', icon: 'solar:motorbike-bold' },
];

// CARGA DE DATOS (DOS CONSULTAS SEPARADAS)
const cargarDatos = async () => {
  loading.value = true;
  
  const saved = localStorage.getItem('mis_favoritos');
  if (saved) favs.value = JSON.parse(saved);

  try {
    // 1. Obtener Servicios
    const { data: dataServicios, error: errS } = await supabase
      .from('servicios')
      .select('*')
      .order('creado_at', { ascending: false });

    // 2. Obtener Perfiles de Dueños
    const { data: dataPerfiles, error: errP } = await supabase
      .from('perfiles_duenos')
      .select('id, nombre_negocio');

    if (errS) throw errS;
    if (errP) throw errP;

    // 3. Unión manual usando dueno_id
    servicios.value = dataServicios.map(srv => {
      const perfil = dataPerfiles.find(p => p.id === srv.dueno_id);
      return {
        ...srv,
        nombre_negocio: perfil?.nombre_negocio || 'Transporte Independiente'
      };
    });

  } catch (e) {
    console.error("Error cargando datos:", e.message);
  } finally {
    loading.value = false;
  }
};

// FILTRADO REACTIVO
const serviciosFiltrados = computed(() => {
  const term = query.value.toLowerCase().trim();
  
  return servicios.value.filter(s => {
    const matchBusqueda = 
      s.origen.toLowerCase().includes(term) || 
      (s.destino && s.destino.toLowerCase().includes(term)) ||
      s.nombre_negocio.toLowerCase().includes(term);
    
    const matchTipo = filtroTipo.value === 'todos' || s.tipo === filtroTipo.value;
    
    return matchBusqueda && matchTipo;
  });
});

// FUNCIONES DE INTERACCIÓN
const toggleLike = (id) => {
  const index = favs.value.indexOf(id);
  if (index > -1) favs.value.splice(index, 1);
  else favs.value.push(id);
  localStorage.setItem('mis_favoritos', JSON.stringify(favs.value));
};

const esFavorito = (id) => favs.value.includes(id);

const contactar = (num) => {
  window.open(`https://wa.me/505${num}`, '_blank');
};

onMounted(cargarDatos);
</script>

<style scoped>
.search-container { --p: #d19a02; --s: #ffffff; background: #f1f5f9; min-height: 100vh; font-family: sans-serif; margin-top: 6vh; border-radius: 2rem; }

/* HEADER */
.search-header { background: var(--p); padding: 2rem 1.5rem 1rem; color: white; border-radius: 2rem; position: sticky; top: 0; z-index: 50; }
.header-content h1 { font-size: 1.5rem; margin: 0; font-weight: 800; }
.header-content p { font-size: 0.9rem; opacity: 0.8; margin: 0.2rem 0 1rem; }

.search-bar { background: white; border-radius: 1rem; padding: 0.8rem 1.2rem; display: flex; align-items: center; gap: 0.8rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.search-bar input { border: none; outline: none; width: 100%; font-size: 1rem; color: #1e293b; }
.search-icon { color: #94a3b8; font-size: 1.2rem; }

/* FILTROS */
.filter-scroll { display: flex; gap: 0.8rem; overflow-x: auto; padding: 1.5rem 0 0.5rem; scrollbar-width: none; }
.filter-chip { background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.6rem 1.2rem; border-radius: 2rem; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.filter-chip.active { background: var(--s); color: var(--p); }

/* CARDS */
.results-list { padding: 1.5rem; display: grid; gap: 1.2rem; }
.feed-card { background: white; border-radius: 1.5rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card-image { height: 160px; position: relative; }
.card-image img { width: 100%; height: 100%; object-fit: cover; }
.card-price { position: absolute; bottom: 1rem; right: 1rem; background: var(--s); color: var(--p); font-weight: 900; padding: 0.4rem 0.8rem; border-radius: 0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

.btn-heart { position: absolute; top: 1rem; left: 1rem; background: white; border: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #cbd5e1; cursor: pointer; }
.is-liked { color: #ef4444 !important; }

.card-details { padding: 1.2rem; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.empresa-txt { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }

.type-tag { text-transform: uppercase; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 0.5rem; }
.type-tag.bus { background: #dbeafe; color: #1e40af; }
.type-tag.taxi { background: #fef9c3; color: #a16207; }
.type-tag.moto { background: #dcfce7; color: #15803d; }

.card-title { font-size: 0.95rem; color: #64748b; margin: 0.3rem 0; font-weight: 500; }
.time-tag { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: var(--p); font-weight: 700; margin-top: 0.4rem; }

.btn-whatsapp { width: 100%; background: var(--p); color: white; border: none; padding: 0.8rem; border-radius: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; }

.status-msg { text-align: center; padding: 3rem; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: var(--p); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 3rem; color: #94a3b8; font-size: 2.5rem; }
.empty-state p { font-size: 1rem; margin-top: 0.5rem; color: #64748b; }
</style>