<template>
  <div class="guia-container">
    <header class="guia-header">
      <div class="header-info">
        <span class="badge">Descubre</span>
        <h1>Guía Local</h1>
        <p>Lugares recomendados en tu ruta</p>
      </div>

      <div class="search-wrapper">
        <div class="search-box">
          <Icon icon="solar:magnifer-linear" />
          <input v-model="searchQuery" type="text" placeholder="Buscar comida, hoteles..." />
        </div>
      </div>

      <div class="filter-bar">
        <button 
          v-for="cat in categorias" :key="cat.id"
          :class="['filter-btn', { active: filtroActivo === cat.id }]"
          @click="filtroActivo = cat.id"
        >
          <Icon :icon="cat.icon" />
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </header>

    <main class="guia-content">
      <div class="places-grid">
        <div v-for="lugar in lugaresFiltrados" :key="lugar.id" class="place-card">
          <div class="card-image">
            <img :src="lugar.imagen" :alt="lugar.nombre" />
            
            <button @click="toggleLike(lugar.id)" class="btn-fav-place">
              <Icon 
                :icon="esFavorito(lugar.id) ? 'solar:heart-bold' : 'solar:heart-linear'" 
                :class="{ 'is-liked': esFavorito(lugar.id) }"
              />
            </button>

            <div class="rating">
              <Icon icon="solar:star-bold" />
              <span>{{ lugar.rating }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="category-info">
              <span class="cat-tag">{{ lugar.categoria }}</span>
              <span class="price-indicator">{{ lugar.precioRange }}</span>
            </div>
            <h3>{{ lugar.nombre }}</h3>
            <p class="location">
              <Icon icon="solar:map-point-bold-duotone" />
              {{ lugar.ubicacion }}
            </p>
            
            <div class="card-footer">
              <button class="btn-view" @click="verMapa(lugar.nombre)">
                <Icon icon="solar:streets-navigation-bold-duotone" />
                Cómo llegar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const searchQuery = ref('');
const filtroActivo = ref('todos');
const favsGuia = ref([]); // Estado reactivo de favoritos

// LÓGICA DE FAVORITOS
const cargarFavs = () => {
  const saved = localStorage.getItem('guia_favoritos');
  if (saved) favsGuia.value = JSON.parse(saved);
};

const esFavorito = (id) => favsGuia.value.includes(id);

const toggleLike = (id) => {
  const index = favsGuia.value.indexOf(id);
  if (index > -1) {
    favsGuia.value.splice(index, 1); // Quitar
  } else {
    favsGuia.value.push(id); // Agregar
  }
  localStorage.setItem('guia_favoritos', JSON.stringify(favsGuia.value));
};

onMounted(cargarFavs);

// CATEGORÍAS Y DATOS (Igual que antes)
const categorias = [
  { id: 'todos', label: 'Todos', icon: 'solar:point-on-map-bold' },
  { id: 'restaurante', label: 'Comida', icon: 'solar:chef-hat-bold' },
  { id: 'hotel', label: 'Hoteles', icon: 'solar:bed-bold' },
  { id: 'ocio', label: 'Ocio', icon: 'solar:palmtree-bold' },
];

const lugares = ref([
  { id: 1, nombre: 'Asados El Cañón', categoria: 'restaurante', ubicacion: 'Estelí', rating: 4.8, precioRange: '$$', imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500' },
  { id: 2, nombre: 'Hotel Los Pinos', categoria: 'hotel', ubicacion: 'Matagalpa', rating: 4.5, precioRange: '$$$', imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500' },
  { id: 3, nombre: 'Café de la Montaña', categoria: 'restaurante', ubicacion: 'León', rating: 4.9, precioRange: '$', imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' },
  { id: 4, nombre: 'Mirador El Crucero', categoria: 'ocio', ubicacion: 'Managua', rating: 4.7, precioRange: 'Gratis', imagen: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500' }
]);

const lugaresFiltrados = computed(() => {
  return lugares.value.filter(l => {
    const matchSearch = l.nombre.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchCat = filtroActivo.value === 'todos' || l.categoria === filtroActivo.value;
    return matchSearch && matchCat;
  });
});

const verMapa = (nombre) => window.open(`https://www.google.com/maps/search/${encodeURIComponent(nombre)}`, '_blank');
</script>

<style scoped>
/* (Se mantienen los estilos anteriores, solo añadimos el color del corazón) */
.guia-container { --primary: #d19a02; --dark: #1e293b; background: #f8fafc; min-height: 100vh; }

.btn-fav-place {
  position: absolute; top: 12px; right: 12px; background: white; border: none;
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #cbd5e1; font-size: 1.3rem; cursor: pointer; transition: 0.2s;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.btn-fav-place .is-liked {
  color: #ef4444;
  animation: heartPop 0.3s ease-out;
}

@keyframes heartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Resto de estilos del componente anterior... */
.guia-header { background: white; padding: 2rem 1.5rem 1rem; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
.search-box { background: #f1f5f9; border-radius: 1rem; padding: 0.8rem 1.2rem; display: flex; align-items: center; gap: 10px; }
.search-box input { border: none; background: transparent; outline: none; width: 100%; }
.filter-bar { display: flex; gap: 10px; overflow-x: auto; padding: 1.2rem 0 0.5rem; scrollbar-width: none; }
.filter-btn { background: white; border: 1px solid #e2e8f0; padding: 0.6rem 1.2rem; border-radius: 100px; white-space: nowrap; font-weight: 700; font-size: 0.85rem; color: #64748b; border: none; }
.filter-btn.active { background: var(--dark); color: white; }
.places-grid { display: grid; gap: 1.5rem; padding: 1.5rem; }
.place-card { background: white; border-radius: 1.5rem; overflow: hidden; border: 1px solid #e2e8f0; }
.card-image { height: 180px; position: relative; }
.card-image img { width: 100%; height: 100%; object-fit: cover; }
.rating { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); color: #ffb800; padding: 4px 10px; border-radius: 100px; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
.card-body { padding: 1.2rem; }
.cat-tag { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; color: var(--primary); }
.card-body h3 { margin: 0.5rem 0; font-size: 1.1rem; }
.btn-view { width: 100%; border: none; background: #f1f5f9; padding: 0.8rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
</style>