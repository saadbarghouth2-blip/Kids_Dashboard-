import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'esri-leaflet';
import * as Esri from 'esri-leaflet';
import { GIS_GROUPS, GISLayerConfig } from '../data/gis_services';

type GISLayersProps = {
    enabledLayers: Record<string, boolean>;
};

// Helper component for a single layer to manage its own lifecycle
const FeatureLayer = ({ url, visible, style }: { url: string; visible: boolean; style?: any }) => {
    const map = useMap();
    const layerRef = useRef<any>(null);

    useEffect(() => {
        if (!layerRef.current) {
            const defaultStyle = { color: '#3b82f6', weight: 2, opacity: 0.8, fillOpacity: 0.1 }; // Default
            const customStyle = style ? { ...defaultStyle, ...style } : defaultStyle;

            layerRef.current = (Esri as any).featureLayer({
                url,
                simplifyFactor: 0.35,
                precision: 5,
                style: () => customStyle,
                onEachFeature: (feature: any, layer: any) => {
                    const props = feature.properties;
                    const title = props.Name || props.NAME || props.title || "معلم غير معروف";
                    const desc = props.Description || props.desc || "";

                    const popupContent = `
                    <div class="text-right p-1 font-[Cairo]" dir="rtl">
                      <div class="font-bold text-lg text-[#1f1a15] mb-1">📍 ${title}</div>
                      ${desc ? `<div class="text-sm text-[#6b6056] mb-2">${desc}</div>` : ''}
                      <div class="flex gap-1 mt-2">
                        ${Object.entries(props).slice(0, 3).map(([k, v]) =>
                        (k !== 'Name' && k !== 'NAME' && k !== 'OBJECTID' && typeof v !== 'object')
                            ? `<span class="badge text-[10px] bg-[#e7f2ea] text-[#0f8a7a] border border-[#0f8a7a]/30 px-1 rounded-full">${k}: ${v}</span>`
                            : ''
                    ).join('')}
                      </div>
                    </div>
                  `;
                    layer.bindPopup(popupContent, { className: 'kids-popup' });

                    layer.on('mouseover', () => {
                        layer.setStyle({ weight: 4, fillOpacity: 0.4 });
                    });
                    layer.on('mouseout', () => {
                        layer.setStyle(customStyle);
                    });
                }
            });
        }

        // Update style if it changes dynamically? Not strictly needed for now, config is static.

        if (visible) {
            layerRef.current.addTo(map);
        } else {
            layerRef.current.removeFrom(map);
        }

        return () => {
            if (layerRef.current) layerRef.current.removeFrom(map);
        };
    }, [map, url, visible]);
    // removed style from dependency to avoid re-creating on every render if style obj identity changes. 
    // Assuming style config is static from the imported constant.

    return null;
};

const MapServiceLayer = ({ url, visible }: { url: string; visible: boolean }) => {
    const map = useMap();
    const layerRef = useRef<any>(null);

    useEffect(() => {
        if (!layerRef.current) {
            layerRef.current = (Esri as any).dynamicMapLayer({
                url,
                opacity: 0.7
            });
        }

        if (visible) {
            layerRef.current.addTo(map);
        } else {
            layerRef.current.removeFrom(map);
        }

        return () => {
            if (layerRef.current) layerRef.current.removeFrom(map);
        };
    }, [map, url, visible]);

    return null;
};

const WMSLayer = ({ url, visible, layers }: { url: string; visible: boolean; layers: string }) => {
    const map = useMap();
    const layerRef = useRef<L.TileLayer.WMS | null>(null);

    useEffect(() => {
        if (!layerRef.current) {
            layerRef.current = L.tileLayer.wms(url, {
                layers: layers || '0',
                format: 'image/png',
                transparent: true,
                opacity: 0.6
            });
        }

        if (visible && layerRef.current) {
            layerRef.current.addTo(map);
        } else if (layerRef.current) {
            layerRef.current.removeFrom(map);
        }

        return () => {
            if (layerRef.current) layerRef.current.removeFrom(map);
        };
    }, [map, url, visible, layers]);

    return null;
};

export default function GISLayers({ enabledLayers }: GISLayersProps) {
    const renderLayers = GIS_GROUPS.flatMap(g => g.layers).map(config => {
        const isVisible = !!enabledLayers[config.id];
        // if (!isVisible) return null; // We can leave them unmounted or keep them mounted but removed?
        // React Leaflet usually handles mount/unmount. 
        // Here we're using effects. If we return null, the component unmounts and the cleanup runs (remove).
        // This is correct behavior.

        if (!isVisible) return null;

        if (config.type === 'feature') {
            return <FeatureLayer key={config.id} url={config.url} visible={isVisible} style={config.style} />;
        }
        if (config.type === 'map') {
            return <MapServiceLayer key={config.id} url={config.url} visible={isVisible} />;
        }
        if (config.type === 'wms') {
            return <WMSLayer key={config.id} url={config.url} layers={config.layers ?? ''} visible={isVisible} />;
        }
        return null;
    });

    return <>{renderLayers}</>;
}
