import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

export type Localizacao = { latitude: number; longitude: number; precisao: number };

type Props = { localizacao: Localizacao };

// Mapa da localização detectada, no mesmo estilo do OpenStreetMap: marcador, círculo de precisão e um aviso.
export function MapaLocalizacao({ localizacao }: Props) {
  const elementoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = elementoRef.current;
    if (!elemento) return;

    // Leaflet só é carregado no navegador: importá-lo no servidor quebra a renderização (ele usa `navigator`/`window`).
    let mapa: Leaflet.Map | undefined;
    let cancelado = false;

    void (async () => {
      const [{ default: L }] = await Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]);
      if (cancelado) return;

      const { latitude, longitude, precisao } = localizacao;
      const posicao: Leaflet.LatLngExpression = [latitude, longitude];

      mapa = L.map(elemento, { zoomControl: true, attributionControl: true }).setView(posicao, 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);

      // Área onde o aparelho pode estar, segundo a precisão do GPS / rede.
      L.circle(posicao, {
        radius: Math.max(precisao, 20),
        color: "#14b8a6",
        fillColor: "#14b8a6",
        fillOpacity: 0.25,
        weight: 1,
      }).addTo(mapa);

      // Ponto exato da pessoa, com o aviso "Localização detectada" aberto.
      L.circleMarker(posicao, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#14b8a6",
        fillOpacity: 1,
      })
        .addTo(mapa)
        .bindPopup("Localização detectada")
        .openPopup();
    })();

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [localizacao]);

  return (
    <div
      ref={elementoRef}
      role="img"
      aria-label="Mapa com a sua localização atual"
      className="h-[30rem] w-full overflow-hidden rounded-xl border border-panel-active"
    />
  );
}
