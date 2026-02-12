
export type GISServiceType = 'feature' | 'map' | 'wms' | 'wfs';

export type GISLayerConfig = {
    id: string;
    title: string;
    type: GISServiceType;
    url: string;
    layers?: string; // For WMS
    description?: string;
    defaultVisible?: boolean;
    emoji?: string; // Kid-friendly emoji for the layer
    style?: {
        color?: string;
        fillColor?: string;
        opacity?: number;
        fillOpacity?: number;
        weight?: number;
        dashArray?: string;
    };
};

export type GISGroup = {
    id: string;
    title: string;
    emoji?: string;
    layers: GISLayerConfig[];
};

export const GIS_GROUPS: GISGroup[] = [
    {
        id: 'national',
        title: '🇪🇬 خدمات وطنية',
        emoji: '🏛️',
        layers: [
            {
                id: 'egy_resource',
                title: '🗺️ خريطة الموارد',
                emoji: '💎',
                type: 'feature',
                url: 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/Eygpt_Resource_Map_WFL1/FeatureServer/0',
                description: 'موارد وطرق وأماكن مأهولة وحدود مصر',
                style: { color: '#fbbf24', weight: 2, fillColor: '#fef3c7', fillOpacity: 0.3 }
            },
            {
                id: 'egy_boundaries',
                title: '🗺️ الحدود الإدارية',
                emoji: '📍',
                type: 'feature',
                url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Egypt_Boundaries/FeatureServer/0',
                description: 'حدود مصر والمحافظات',
                style: { color: '#ef4444', weight: 2, dashArray: '5, 5', opacity: 0.8, fillOpacity: 0.1 }
            },
            {
                id: 'egy_water',
                title: '💧 مسطحات مائية',
                emoji: '🌊',
                type: 'feature',
                url: 'https://gis.wfp.org/arcgis/rest/services/Hosted/Egypt_Water_Bodies/FeatureServer/0',
                description: 'نيل، بحيرات، سواحل',
                style: { color: '#38bdf8', fillColor: '#7dd3fc', weight: 2, fillOpacity: 0.4 }
            },
            {
                id: 'egy_forest',
                title: '🌳 غطاء نباتي',
                emoji: '🌲',
                type: 'feature',
                url: 'https://services5.arcgis.com/SaBe5HMtmnbqSWlu/ArcGIS/rest/services/Egypt_Scrub_and_Forest/FeatureServer/0',
                description: 'غابات وشجيرات',
                style: { color: '#22c55e', fillColor: '#86efac', weight: 2, fillOpacity: 0.35 }
            },
            {
                id: 'egy_hydro',
                title: '💦 بيانات هيدرولوجية',
                emoji: '🚰',
                type: 'feature',
                url: 'https://pro-ags2.dfs.un.org/arcgis/rest/services/hosted/Hydro_Egypt/FeatureServer/0',
                style: { color: '#06b6d4', fillColor: '#a5f3fc', fillOpacity: 0.3 }
            },
            {
                id: 'egy_provinces_wb',
                title: '🏛️ المحافظات 2023',
                emoji: '📊',
                type: 'feature',
                url: 'https://services.arcgis.com/iQ1dY19aHwbSDYIF/arcgis/rest/services/Egypt_Province_Boundaries_2023/FeatureServer/0',
                description: 'حدود المحافظات من البنك الدولي',
                style: { color: '#f97316', weight: 2, fillOpacity: 0.15 }
            },
            {
                id: 'eg_capital_sector',
                title: '🏢 بيانات قطاعية',
                emoji: '📈',
                type: 'feature',
                url: 'https://egcapitalgis.idsc.gov.eg/server/rest/services/Hosted/egypt_user/FeatureServer/0',
                style: { color: '#a855f7', fillColor: '#e9d5ff', fillOpacity: 0.25 }
            }
        ]
    },
    {
        id: 'cairo',
        title: '🏙️ محافظة القاهرة',
        emoji: '🕌',
        layers: [
            {
                id: 'cairo_bounds',
                title: '🗺️ حدود المحافظة',
                emoji: '📍',
                type: 'map',
                url: 'https://geoportal.cairodc.gov.eg/server/rest/services/محافظة_القاهرة_بالحدود/MapServer',
                description: 'حدود محافظة القاهرة الكبرى'
            },
            {
                id: 'gamaliya',
                title: '🕌 حي الجمالية',
                emoji: '🏛️',
                type: 'map',
                url: 'https://geoportal.cairodc.gov.eg/server/rest/services/خدمات_الجمالية/MapServer',
                description: 'خدمات حي الجمالية التاريخي'
            },
            {
                id: 'maadi',
                title: '🌳 حي المعادي',
                emoji: '🏡',
                type: 'map',
                url: 'https://geoportal.cairodc.gov.eg/server/rest/services/خدمات_حى_المعادى/MapServer',
                description: 'خدمات حي المعادي'
            }
        ]
    },
    {
        id: 'global',
        title: '🌍 خدمات عالمية',
        emoji: '🗺️',
        layers: [
            {
                id: 'fao_base',
                title: '🌾 FAO Base Map',
                emoji: '🌱',
                type: 'wms',
                url: 'http://data.fao.org/maps/ows',
                layers: 'GEONETWORK:base_layers',
                description: 'خرائط منظمة الأغذية والزراعة'
            },
            {
                id: 'isric_farming',
                title: '🚜 أنظمة الزراعة',
                emoji: '🌾',
                type: 'wms',
                url: 'https://africasis.isric.org/ows/farming-systems',
                layers: 'farming-systems',
                description: 'أنظمة الزراعة في إفريقيا'
            }
        ]
    }
];
