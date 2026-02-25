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
            placeholder="Buscar por nombre, comida o zona..." 
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-bar">
        <button 
          v-for="cat in categorias" 
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
    </section>

    <main class="list-section">
      <div class="section-title">
        <h2 v-if="busqueda">Resultados para "{{ busqueda }}"</h2>
        <h2 v-else>{{ categoriaActiva?.nombre }} destacados</h2>
        <span>{{ lugaresFiltrados.length }} sitios encontrados</span>
      </div>

      <div class="cards-grid">
        <div 
          v-for="lugar in lugaresFiltrados" 
          :key="lugar.id" 
          class="place-card"
          @click="centrarEnMapa(lugar)"
        >
          <div class="card-img">
            <img :src="lugar.foto" :alt="lugar.nombre" loading="lazy" />
            <div class="type-pill">{{ lugar.tipo }}</div>
            <button @click.stop="toggleFav(lugar.id)" class="btn-fav">
              <Icon :icon="esFav(lugar.id) ? 'solar:heart-bold' : 'solar:heart-linear'" :class="{ active: esFav(lugar.id) }" />
            </button>
          </div>
          <div class="card-info">
            <div class="meta">
              <span class="rating"><Icon icon="solar:star-bold" /> {{ lugar.rating }}</span>
              <span class="price">{{ lugar.precio }}</span>
            </div>
            <h3>{{ lugar.nombre }}</h3>
            <p class="address"><Icon icon="solar:map-point-outline" /> {{ lugar.direccion }}</p>
            <div class="tags">
              <span v-for="tag in lugar.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="lugaresFiltrados.length === 0" class="empty-results">
        <Icon icon="solar:map-point-remove-broken" />
        <p>No encontramos nada que coincida con tu búsqueda.</p>
        <button @click="busqueda = ''; filtro = 'all'" class="btn-reset">Limpiar filtros</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busqueda = ref('');
const filtro = ref('all');
const favs = ref(JSON.parse(localStorage.getItem('lugares_favs')) || []);
const lugares = ref([]);
let map = null;
let markerLayer = null;

const categorias = [
  { id: 'all', nombre: 'Todos', icon: 'solar:globus-bold' },
  { id: 'restaurante', nombre: 'Comida', icon: 'solar:clutter-2-bold' },
  { id: 'hotel', nombre: 'Hospedaje', icon: 'solar:bed-bold' },
  { id: 'ocio', nombre: 'Ocio y Bar', icon: 'solar:ferris-wheel-bold' }
];

// Base de datos expandida
const datosLocales = [
  { id: 1, tipo: 'restaurante', nombre: 'Asados El Toro', lat: 11.691, lng: -84.456, rating: 4.8, precio: '$$', direccion: 'Frente al Parque Central', foto: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', tags: ['Asados', 'Cerveza'] },
  { id: 2, tipo: 'hotel', nombre: 'Hotel Riverside', lat: 11.693, lng: -84.458, rating: 4.5, precio: '$$$', direccion: 'Zona del Río', foto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500', tags: ['Piscina', 'Wifi'] },
  { id: 3, tipo: 'restaurante', nombre: 'Café de la Montaña', lat: 11.695, lng: -84.460, rating: 4.9, precio: '$', direccion: 'Salida a Managua', foto: 'https://images.unsplash.com/photo-1501339819358-6830b5645d7f?w=500', tags: ['Café', 'Postres'] },
  { id: 4, tipo: 'ocio', nombre: 'Bar El Mirador', lat: 11.688, lng: -84.452, rating: 4.3, precio: '$$', direccion: 'Colina Norte', foto: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500', tags: ['Música', 'Cocteles'] },
  { id: 5, tipo: 'hotel', nombre: 'Hospedaje Familiar', lat: 11.692, lng: -84.453, rating: 4.0, precio: '$', direccion: 'Cerca de la Terminal', foto: 'https://images.unsplash.com/photo-1517840901100-8179e982ad44?w=500', tags: ['Económico'] },
  { id: 6, tipo: 'restaurante', nombre: 'Pizzería Napolitana', lat: 11.690, lng: -84.457, rating: 4.6, precio: '$$', direccion: 'Barrio Central', foto: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500', tags: ['Pizza', 'Pasta'] }
];

const categoriaActiva = computed(() => categorias.find(c => c.id === filtro.value));

const lugaresFiltrados = computed(() => {
  return datosLocales.filter(l => {
    const matchFiltro = filtro.value === 'all' || l.tipo === filtro.value;
    const search = busqueda.value.toLowerCase();
    const matchSearch = l.nombre.toLowerCase().includes(search) || 
                        l.direccion.toLowerCase().includes(search) ||
                        l.tags.some(t => t.toLowerCase().includes(search));
    return matchFiltro && matchSearch;
  });
});

const initMap = () => {
  if (map) return;
  map = L.map('map', { zoomControl: false }).setView([11.691, -84.456], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png').addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  actualizarMarkers();
};

const actualizarMarkers = () => {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  lugaresFiltrados.value.forEach(l => {
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-dot ${l.tipo}"></div>`,
      iconSize: [20, 20]
    });
    L.marker([l.lat, l.lng], { icon: customIcon }).addTo(markerLayer)
     .bindPopup(`<b>${l.nombre}</b>`);
  });
};

const centrarEnMapa = (lugar) => {
  map.flyTo([lugar.lat, lugar.lng], 17, { duration: 1.5 });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleFav = (id) => {
  const idx = favs.value.indexOf(id);
  idx > -1 ? favs.value.splice(idx, 1) : favs.value.push(id);
  localStorage.setItem('lugares_favs', JSON.stringify(favs.value));
};
const esFav = (id) => favs.value.includes(id);

watch([filtro, busqueda], () => {
  actualizarMarkers();
  if (lugaresFiltrados.value.length > 0 && map) {
    const group = L.featureGroup(lugaresFiltrados.value.map(l => L.marker([l.lat, l.lng])));
    map.fitBounds(group.getBounds().pad(0.2));
  }
});

onMounted(() => {
  lugares.value = datosLocales;
  initMap();
});
</script>

<style scoped>
.lugares-container { background: #f1f5f9; min-height: 100vh; font-family: 'Inter', sans-serif; }

/* Header & Search */
.header { background: white; padding: 1.5rem 1rem; border-radius: 0 0 2rem 2rem; box-shadow: 0 4px 25px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000; }
.header-top { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.2rem; }
h1 { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0; }

.search-container { position: relative; width: 100%; }
.search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.2rem; }
.search-input { width: 100%; padding: 12px 15px 12px 45px; border-radius: 14px; border: 2px solid #f1f5f9; background: #f8fafc; outline: none; transition: 0.3s; font-size: 0.95rem; }
.search-input:focus { border-color: #d19a02; background: white; }

.filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
.filter-bar::-webkit-scrollbar { display: none; }
.filter-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; font-weight: 700; font-size: 0.8rem; color: #64748b; cursor: pointer; white-space: nowrap; transition: 0.2s; }
.filter-btn.active { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2); }

/* Mapa */
.map-section { height: 280px; margin: 1rem; border-radius: 24px; overflow: hidden; border: 4px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.leaflet-map { height: 100%; width: 100%; z-index: 1; }

/* Marcadores Personalizados */
:deep(.marker-dot) { width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
:deep(.marker-dot.restaurante) { background: #ef4444; }
:deep(.marker-dot.hotel) { background: #3b82f6; }
:deep(.marker-dot.ocio) { background: #8b5cf6; }

/* Lista */
.list-section { padding: 0 1rem 2rem; }
.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.section-title h2 { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.section-title span { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }

.place-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: 0.3s; cursor: pointer; }
.place-card:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }

.card-img { height: 150px; position: relative; }
.card-img img { width: 100%; height: 100%; object-fit: cover; }
.type-pill { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
.btn-fav { position: absolute; top: 10px; right: 10px; background: white; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #cbd5e1; }
.btn-fav .active { color: #ef4444; }

.card-info { padding: 12px; }
.meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
.rating { color: #d19a02; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; gap: 3px; }
.price { color: #10b981; font-weight: 800; font-size: 0.8rem; }
h3 { font-size: 0.95rem; color: #0f172a; font-weight: 800; margin-bottom: 4px; }
.address { font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tags span { font-size: 0.6rem; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; color: #475569; font-weight: 700; }

.empty-results { text-align: center; padding: 3rem 0; color: #94a3b8; }
.empty-results .iconify { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.btn-reset { margin-top: 1rem; background: #0f172a; color: white; border: none; padding: 8px 20px; border-radius: 10px; font-weight: 700; }

@media (max-width: 600px) {
  .map-section { height: 220px; }
}
</style>