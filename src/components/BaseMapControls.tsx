import clsx from "clsx";

export type BaseMapId = "carto" | "osm" | "hot" | "esri";

export default function BaseMapControls(props: { baseMap: BaseMapId; setBaseMap: (v: BaseMapId) => void }) {
  const { baseMap, setBaseMap } = props;

  const Item = (p: { id: BaseMapId; label: string }) => (
    <button className={clsx("btn text-xs", baseMap === p.id && "btn-active")} onClick={() => setBaseMap(p.id)}>
      {p.label}
    </button>
  );

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="panel-title mb-2">شكل الخريطة</div>
      <div className="flex flex-wrap gap-2">
        <Item id="carto" label="Carto (أفضل)" />
        <Item id="osm" label="OSM" />
        <Item id="hot" label="OSM HOT" />
        <Item id="esri" label="Satellite" />
      </div>
    </div>
  );
}
