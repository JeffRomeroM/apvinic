<template>
  <div class="lugares-container">
    <header class="header">
      <div class="header-top">
        <h1>Explorar Destinos</h1>
        <div class="search-container">
          <Icon icon="solar:magnifer-linear" class="search-icon" />
          <input 
            v-model="busqueda" 
            type="text" 
            placeholder="¿Qué estás buscando hoy?" 
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-bar">
        <button 
          v-for="cat in categoriasNav" 
          :key="cat.id"
          :class="['filter-btn', { active: filtro === cat.id }]"
          @click="filtro = cat.id"
        >
          <Icon :icon="cat.icon" />
          {{ cat.nombre }}
        </button>
      </div>
    </header>

    <section class="map-section">
      <div id="map" class="leaflet-map"></div>
      <button class="btn-user-location" @click="obtenerUbicacionActual" title="Mi ubicación">
        <Icon icon="solar:gps-bold" />
      </button>
    </section>

    <main class="list-section">
      <div class="section-title">
        <h2 v-if="busqueda">Resultados para "{{ busqueda }}"</h2>
        <h2 v-else>{{ categoriaActivaNombre }}</h2>
        <span>{{ lugaresFiltrados.length }} sitios</span>
      </div>

      <div class="cards-grid">
        <article 
          v-for="lugar in lugaresFiltrados" 
          :key="lugar.id" 
          :id="'card-' + lugar.id"
          class="place-card"
          :class="{ 'highlight': lugarSeleccionado === lugar.id }"
          @click="focusEnMapa(lugar)"
        >
          <div class="card-img">
            <img :src="lugar.foto_url || '/placeholder.png'" :alt="lugar.nombre" loading="lazy" />
            <div class="type-pill">{{ getCatNombre(lugar.tipo_id) }}</div>
            <button @click.stop="toggleFav(lugar.id)" class="btn-fav">
              <Icon :icon="esFav(lugar.id) ? 'solar:heart-bold' : 'solar:heart-linear'" :class="{ active: esFav(lugar.id) }" />
            </button>
          </div>

          <div class="card-info">
            <h3>{{ lugar.nombre }}</h3>
            <div class="details-list">
              <p class="address"><Icon icon="solar:map-point-outline" /> {{ lugar.direccion }}</p>
              <p class="phone" v-if="lugar.celular"><Icon icon="solar:phone-calling-outline" /> {{ lugar.celular }}</p>
            </div>

            <div class="card-actions">
              <a :href="`https://wa.me/${lugar.celular?.replace(/[^0-9]/g, '')}`" 
                 target="_blank" class="btn-action secondary" @click.stop>
                <Icon icon="solar:whatsapp-outline" /> Contactar
              </a>
              <a :href="`https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`" 
                 target="_blank" class="btn-action primary" @click.stop>
                <Icon icon="solar:routing-2-outline" /> Ir ahora
              </a>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { Icon } from '@iconify/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

const busqueda = ref('');
const filtro = ref('all');
const lugares = ref([]);
const categorias = ref([]);
const lugarSeleccionado = ref(null);
const favs = ref(JSON.parse(localStorage.getItem('lugares_favs')) || []);
let map = null;
let markerLayer = null;
let userMarker = null;
const marcadoresMap = new Map(); // Para rastrear objetos marker

const iconConfig = { 'Comida': 'solar:clutter-2-bold', 'Hospedaje': 'solar:bed-bold', 'Ocio': 'solar:ferris-wheel-bold', 'Default': 'solar:map-point-favorite-bold' };

const categoriasNav = computed(() => {
  const base = [{ id: 'all', nombre: 'Todos', icon: 'solar:globus-bold' }];
  const deDB = categorias.value.map(c => ({ id: c.id, nombre: c.nombre, icon: iconConfig[c.nombre] || iconConfig.Default }));
  return [...base, ...deDB];
});

const categoriaActivaNombre = computed(() => filtro.value === 'all' ? 'Todos los destinos' : categorias.value.find(c => c.id === filtro.value)?.nombre || 'Destinos');
const getCatNombre = (id) => categorias.value.find(c => c.id === id)?.nombre || 'General';

const lugaresFiltrados = computed(() => {
  return lugares.value.filter(l => {
    const mFiltro = filtro.value === 'all' || l.tipo_id === filtro.value;
    const search = busqueda.value.toLowerCase();
    return mFiltro && l.nombre.toLowerCase().includes(search);
  });
});

const cargarDatos = async () => {
  const { data: catData } = await supabase.from('categorias_lugares').select('*').order('nombre');
  categorias.value = catData || [];
  const { data: lugData } = await supabase.from('lugares').select('*').eq('pago', true);
  lugares.value = lugData || [];
  actualizarMarkers();
};

const initMap = () => {
  if (map) return;
  map = L.map('map', { zoomControl: false }).setView([12.1328, -86.2504], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(map);
  markerLayer = L.layerGroup().addTo(map);
};

const actualizarMarkers = () => {
  if (!markerLayer || !map) return;
  markerLayer.clearLayers();
  marcadoresMap.clear();

  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><i class="marker-dot"></i></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });

  lugaresFiltrados.value.forEach(l => {
    const marker = L.marker([l.lat, l.lng], { icon: customIcon }).addTo(markerLayer);
    
    // Añadir el nombre como Tooltip permanente
    marker.bindTooltip(l.nombre, { 
      permanent: true, 
      direction: 'top', 
      className: 'marker-label',
      offset: [0, -32]
    });

    marker.on('click', () => focusEnCard(l));
    marcadoresMap.set(l.id, marker);
  });

  if (lugaresFiltrados.value.length > 0) {
    const group = L.featureGroup(Array.from(marcadoresMap.values()));
    map.fitBounds(group.getBounds().pad(0.3));
  }
};

// De Card -> Mapa
const focusEnMapa = (lugar) => {
  lugarSeleccionado.value = lugar.id;
  map.flyTo([lugar.lat, lugar.lng], 17, { animate: true, duration: 1 });
  
  // Resaltar el marcador
  const marker = marcadoresMap.get(lugar.id);
  if (marker) marker.openTooltip();

  // Scroll suave al mapa en móvil
  if (window.innerWidth < 768) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// De Mapa -> Card
const focusEnCard = (lugar) => {
  lugarSeleccionado.value = lugar.id;
  const el = document.getElementById(`card-${lugar.id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const obtenerUbicacionActual = () => {
  if (!navigator.geolocation) return alert("No soportado");
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    if (userMarker) userMarker.remove();
    userMarker = L.circleMarker([latitude, longitude], { radius: 8, color: 'white', fillColor: '#3b82f6', weight: 3, fillOpacity: 1 }).addTo(map);
    map.flyTo([latitude, longitude], 15);
  });
};

const toggleFav = (id) => {
  const idx = favs.value.indexOf(id);
  idx > -1 ? favs.value.splice(idx, 1) : favs.value.push(id);
  localStorage.setItem('lugares_favs', JSON.stringify(favs.value));
};
const esFav = (id) => favs.value.includes(id);

watch([filtro, busqueda, lugares], () => {
  nextTick(() => actualizarMarkers());
});

onMounted(async () => {
  initMap();
  await cargarDatos();
});

onBeforeUnmount(() => { if (map) map.remove(); });
</script>

<style scoped>
.lugares-container { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; color: #0f172a; }

/* Header */
.header { background: white; padding: 1.2rem 1rem; border-radius: 0 0 1.8rem 1.8rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); position: sticky; top: 0; z-index: 1000; }
.header-top h1 { font-size: 1.4rem; font-weight: 900; margin-bottom: 1rem; }
.search-container { position: relative; margin-bottom: 1rem; }
.search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input { width: 100%; padding: 14px 15px 14px 45px; border-radius: 15px; border: 1.5px solid #f1f5f9; background: #f8fafc; outline: none; }

.filter-bar { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
.filter-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1.5px solid #f1f5f9; background: white; font-weight: 700; font-size: 0.8rem; color: #64748b; cursor: pointer; white-space: nowrap; transition: 0.3s; }
.filter-btn.active { background: #0f172a; color: white; border-color: #0f172a; }

/* Mapa */
.map-section { height: 350px; margin: 1rem; border-radius: 24px; overflow: hidden; position: relative; border: 5px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
.leaflet-map { height: 100%; width: 100%; }
.btn-user-location { position: absolute; bottom: 20px; right: 20px; z-index: 1000; width: 45px; height: 45px; border-radius: 12px; background: white; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }

/* Etiquetas de Nombres en el Mapa */
:deep(.marker-label) {
  background: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  color: #0f172a;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 4px 8px;
  white-space: nowrap;
}
:deep(.marker-label::before) { border-top-color: white; }

/* Marcador PIN */
:deep(.marker-pin) {
  width: 24px; height: 24px; background: #0f172a; border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
  border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
:deep(.marker-dot) { width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg); }

/* Cards */
.list-section { padding: 0 1rem 3rem; }
.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.place-card { background: white; border-radius: 24px; overflow: hidden; border: 1.5px solid #f1f5f9; transition: 0.3s; cursor: pointer; }
.place-card.highlight { border-color: #0f172a; border-width: 2.5px; transform: scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }

.card-img { height: 190px; position: relative; }
.card-img img { width: 100%; height: 100%; object-fit: cover; }
.type-pill { position: absolute; bottom: 12px; left: 12px; background: #0f172a; color: white; padding: 6px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 800; }
.btn-fav { position: absolute; top: 12px; right: 12px; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; color: #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.btn-fav .active { color: #ef4444; }

.card-info { padding: 1.2rem; }
.card-info h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 0.8rem; }
.details-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
.details-list p { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 8px; margin: 0; }
.details-list svg { color: #94a3b8; }

.card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-action { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 0.85rem; text-decoration: none; }
.btn-action.primary { background: #d19a02; color: white; }
.btn-action.secondary { background: #f1f5f9; color: #0f172a; }

@media (max-width: 600px) {
  .card-actions { grid-template-columns: 1fr; }
}
</style>