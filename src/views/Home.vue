<template>
  <div class="home">
    <h1>Busca tu ruta</h1>

    <div class="inputs-in-drive">
      <input v-model="origen" type="text" placeholder="Punto de partida" class="input-in-drive" />
      <input v-model="destino" type="text" placeholder="Destino" class="input-in-drive" />
    </div>

    <div class="cards" v-if="rutasFiltradas.length">
      <div
        class="card"
        v-for="ruta in rutasFiltradas"
        :key="ruta.id"
      >
        <div class="card-header">
          <h2>
            {{ ruta.origen }} → {{ ruta.destino }}
            <span>Transporte {{ ruta.empresa }}</span>
          </h2>
        </div>

        <div class="card-body">
          <p><strong>Horario:</strong> {{ ruta.horario }}</p>
          <p><strong>Costo:</strong> C$ {{ ruta.costo }}</p>
          <p><strong>Empresa:</strong> {{ ruta.empresa }}</p>
          <p><strong>Duración:</strong> {{ ruta.duracion }}</p>
          <p><strong>Frecuencia:</strong> {{ ruta.frecuencia }}</p>
          <p><strong>Tipo de unidad:</strong> {{ ruta.tipoUnidad }}</p>
          <p><strong>Paradas:</strong> {{ ruta.paradas }}</p>
          <p><strong>Recomendaciones:</strong> {{ ruta.recomendaciones }}</p>

          <button @click="ruta.mostrarMapa = !ruta.mostrarMapa" class="btn-detalles">
            {{ ruta.mostrarMapa ? 'Ocultar mapa' : 'Ver mapa' }}
          </button>
        </div>

        <div class="card-mapa" v-if="ruta.mostrarMapa">
          <iframe
            :src="ruta.mapa"
            class="mapa"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>

    <p v-else class="sin-resultados">No se encontraron rutas.</p>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const origen = ref("");
const destino = ref("");

// DATOS LOCALES DE PRUEBA
const rutas = ref([
  {
    id: 1,
    origen: "Managua",
    destino: "Masaya",
    horario: "6:00 AM - 8:00 PM",
    costo: 35,
    empresa: "Transportes del Sur",
    duracion: "45 minutos",
    frecuencia: "Cada 20 minutos",
    tipoUnidad: "Microbús",
    paradas: "Tipitapa, Nindirí",
    recomendaciones: "Viajar temprano",
    mapa: "https://www.google.com/maps?q=managua+masaya&output=embed",
    mostrarMapa: false
  },
  {
    id: 2,
    origen: "Masaya",
    destino: "Granada",
    horario: "5:30 AM - 7:30 PM",
    costo: 25,
    empresa: "Cooperativa Oriental",
    duracion: "30 minutos",
    frecuencia: "Cada 15 minutos",
    tipoUnidad: "Bus",
    paradas: "Nandaime",
    recomendaciones: "Evitar horas pico",
    mapa: "https://www.google.com/maps?q=masaya+granada&output=embed",
    mostrarMapa: false
  }
]);

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const rutasFiltradas = computed(() => {
  const o = normalizar(origen.value);
  const d = normalizar(destino.value);

  if (!o && !d) return [];

  return rutas.value.filter(r => {
    const ro = normalizar(r.origen);
    const rd = normalizar(r.destino);

    if (o && !d) return ro.includes(o) || rd.includes(o);
    if (!o && d) return ro.includes(d) || rd.includes(d);

    return (
      (ro.includes(o) && rd.includes(d)) ||
      (ro.includes(d) && rd.includes(o))
    );
  });
});
</script>
<style>
.home {
  max-width: 1100px;
  margin: auto;
  padding: 24px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f6f7f9;
}

h1 {
  text-align: center;
  margin-bottom: 25px;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

.inputs-in-drive {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 500px;
  margin: 0 auto 30px;
}

.input-in-drive {
  padding: 14px;
  font-size: 15px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  outline: none;
}

.input-in-drive:focus {
  border-color: #d19a02;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 22px;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s, box-shadow 0.25s;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 35px rgba(0, 0, 0, 0.12);
}

.card-header h2 {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  color: #d19a02;
  text-align: center;
}

.card-header span {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.card-body p {
  margin: 6px 0;
  font-size: 14px;
  color: #374151;
}

.card-body strong {
  color: #111827;
}

.btn-detalles {
  margin-top: 14px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: #d19a02;
  color: #ffffff;
  transition: background 0.2s;
}

.btn-detalles:hover {
  background: #d19a02;
}

.mapa {
  width: 100%;
  height: 260px;
  border-radius: 14px;
  margin-top: 14px;
  border: none;
}

.sin-resultados {
  text-align: center;
  font-size: 16px;
  margin-top: 40px;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 600px) {
  .inputs-in-drive {
    grid-template-columns: 1fr;
  }
}

</style>
