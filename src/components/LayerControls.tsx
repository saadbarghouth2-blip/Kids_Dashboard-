import clsx from "clsx";
import { GIS_GROUPS } from "../data/gis_services";

export type Layers = {
  showPlaces: boolean;
  showLabels: boolean;
  showEgypt: boolean;
  showNile: boolean;
  showDelta: boolean;
  showHeat: boolean;
  showCoords: boolean;
};

type Props = {
  layers: Layers;
  setLayers: (v: Layers) => void;
  gisEnabled: Record<string, boolean>;
  setGisEnabled: (v: Record<string, boolean>) => void;
};

export default function LayerControls({ layers, setLayers, gisEnabled, setGisEnabled }: Props) {
  const toggle = (k: keyof Layers) => setLayers({ ...layers, [k]: !layers[k] });
  const toggleGis = (id: string) => setGisEnabled({ ...gisEnabled, [id]: !gisEnabled[id] });

  const Item = (p: { k: keyof Layers; label: string; emoji?: string }) => (
    <button className={clsx("btn text-xs", layers[p.k] && "btn-active")} onClick={() => toggle(p.k)}>
      {p.emoji && <span className="mr-1">{p.emoji}</span>}
      {p.label}
    </button>
  );

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="panel-title mb-2 text-sm">🎨 طبقات الخريطة</div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Item k="showPlaces" label="أماكن" emoji="📍" />
        <Item k="showLabels" label="أسماء" emoji="🏷️" />
        <Item k="showEgypt" label="حدود مصر" emoji="🇪🇬" />
        <Item k="showNile" label="النيل" emoji="🌊" />
        <Item k="showDelta" label="الدلتا" emoji="🌾" />
        <Item k="showHeat" label="Glow" emoji="✨" />
        <Item k="showCoords" label="إحداثيات" emoji="📐" />
      </div>

      <div className="h-px bg-white/10 my-2" />

      {GIS_GROUPS.map((group) => (
        <div key={group.id} className="mb-3">
          <div className="panel-title mb-2 text-xs opacity-90 flex items-center gap-1">
            {group.emoji && <span>{group.emoji}</span>}
            <span>{group.title}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.layers.map((layer) => (
              <button
                key={layer.id}
                className={clsx(
                  "btn text-xs py-1 px-2 transition-all duration-200",
                  gisEnabled[layer.id] && "btn-active scale-105"
                )}
                onClick={() => toggleGis(layer.id)}
                title={layer.description}
              >
                {layer.emoji && <span className="mr-1">{layer.emoji}</span>}
                {layer.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
