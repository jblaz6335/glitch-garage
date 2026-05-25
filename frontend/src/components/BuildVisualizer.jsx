import React, { useId, useMemo, useState } from 'react';

export const DEFAULT_VISUAL_CONFIG = {
  trim: '',
  body_style: 'auto',
  paint_color: '#00e5ff',
  paint_finish: 'gloss',
  wheel_style: 'auto',
  wheel_color: '#111827',
  ride_height: 'stock',
  build_style: 'street',
  aero_layers: [],
};

export const BODY_STYLES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'e92-coupe', label: 'Euro Sport Coupe' },
  { value: 'brz-86', label: 'Compact Sports' },
  { value: 'g-coupe', label: 'Long-Nose Coupe' },
  { value: 'eg-ek-hatch', label: 'Classic Hatch' },
  { value: 'gtr-profile', label: 'AWD Icon' },
  { value: 'bmw-coupe', label: 'BMW Coupe' },
  { value: 'bmw-sedan', label: 'BMW Sedan' },
  { value: 'jdm-hatch', label: 'JDM Hatch' },
  { value: 'muscle', label: 'Muscle' },
  { value: 'euro-wagon', label: 'Euro Wagon' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'modern-tuner', label: 'Modern Tuner' },
  { value: 'drift', label: 'Drift' },
  { value: 'track', label: 'Track' },
];

const BUILD_STYLES = [
  { value: 'oem-plus', label: 'OEM+' },
  { value: 'street', label: 'Street' },
  { value: 'track', label: 'Track' },
  { value: 'drift', label: 'Drift' },
  { value: 'show', label: 'Show' },
  { value: 'drag', label: 'Drag' },
  { value: 'vip', label: 'VIP' },
  { value: 'stance', label: 'Stance' },
  { value: 'time-attack', label: 'Time Attack' },
];

const PAINT_FINISHES = [
  { value: 'gloss', label: 'Gloss' },
  { value: 'satin', label: 'Satin' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'matte', label: 'Matte' },
  { value: 'pearl', label: 'Pearl' },
];

const RIDE_HEIGHTS = [
  { value: 'stock', label: 'Stock' },
  { value: 'lowered', label: 'Lowered' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'slammed', label: 'Slammed' },
  { value: 'drag', label: 'Drag' },
  { value: 'track', label: 'Track' },
];

const CAMERA_MODES = [
  { value: 'side', label: 'Side' },
  { value: 'front', label: 'Front 3/4' },
  { value: 'rear', label: 'Rear 3/4' },
];

const AERO_LAYERS = [
  { value: 'ducktail', label: 'Ducktail', styles: ['oem-plus', 'street', 'show', 'stance'], chassis: ['bmw-coupe', 'modern-tuner', 'drift'] },
  { value: 'gt-wing', label: 'GT Wing', styles: ['track', 'drift', 'time-attack'], chassis: ['modern-tuner', 'drift', 'track', 'jdm-hatch'] },
  { value: 'lip-kit', label: 'Lip Kit', styles: ['oem-plus', 'street', 'show', 'vip', 'stance'], chassis: ['bmw-coupe', 'bmw-sedan', 'jdm-hatch', 'modern-tuner', 'euro-wagon'] },
  { value: 'splitter', label: 'Splitter', styles: ['track', 'time-attack', 'street'], chassis: ['bmw-coupe', 'modern-tuner', 'track', 'muscle'] },
  { value: 'diffuser', label: 'Diffuser', styles: ['track', 'time-attack', 'street'], chassis: ['bmw-coupe', 'modern-tuner', 'track', 'drift'] },
  { value: 'hood-vents', label: 'Hood Vents', styles: ['track', 'time-attack', 'drift', 'drag'], chassis: ['muscle', 'modern-tuner', 'drift', 'track'] },
  { value: 'canards', label: 'Canards', styles: ['track', 'time-attack', 'drift'], chassis: ['modern-tuner', 'drift', 'track'] },
  { value: 'roof-spoiler', label: 'Roof Spoiler', styles: ['street', 'show', 'track'], chassis: ['jdm-hatch', 'euro-wagon', 'suv'] },
  { value: 'widebody', label: 'Widebody', styles: ['drift', 'show', 'stance', 'time-attack'], chassis: ['bmw-coupe', 'modern-tuner', 'drift', 'track', 'jdm-hatch'] },
];

const WHEEL_PRESETS = {
  euro: [
    { value: 'bbs-lm', label: 'BBS LM', type: 'mesh', depth: 0.9, finish: 'chrome-lip' },
    { value: 'apex-arc8', label: 'Apex ARC-8', type: 'split-7', depth: 0.55, finish: 'forged' },
    { value: 'oem-plus', label: 'OEM+', type: 'multi-spoke', depth: 0.35, finish: 'oem' },
    { value: 'forged-mono', label: 'Forged Mono', type: 'motorsport', depth: 0.45, finish: 'forged' },
    { value: 'directional', label: 'Directional', type: 'directional', depth: 0.5, finish: 'show' },
    { value: 'te37', label: 'TE37', type: 'six-spoke', depth: 0.45, finish: 'forged' },
  ],
  jdm: [
    { value: 'te37', label: 'TE37', type: 'six-spoke', depth: 0.45, finish: 'forged' },
    { value: 'work-emotion', label: 'Work Emotion', type: 'twin-5', depth: 0.45, finish: 'motorsport' },
    { value: 'gram-lights', label: 'Gram Lights', type: 'split-6', depth: 0.35, finish: 'forged' },
    { value: 'meister', label: 'Meister', type: 'three-piece', depth: 0.95, finish: 'chrome-lip' },
    { value: 'drift-spoke', label: 'Drift Spoke', type: 'directional', depth: 0.55, finish: 'motorsport' },
    { value: 'mesh', label: 'Mesh', type: 'mesh', depth: 0.62, finish: 'chrome-lip' },
  ],
  muscle: [
    { value: 'drag-pack', label: 'Drag Pack', type: 'five-hole', depth: 0.75, finish: 'drag' },
    { value: 'weld', label: 'Weld', type: 'drag-star', depth: 1, finish: 'chrome-lip' },
    { value: 'forgestar', label: 'Forgestar', type: 'split-5', depth: 0.5, finish: 'forged' },
    { value: 'deep-dish', label: 'Deep Dish', type: 'three-piece', depth: 0.92, finish: 'chrome-lip' },
    { value: 'magnum', label: 'Magnum', type: 'classic-5', depth: 0.65, finish: 'oem' },
    { value: 'motorsport', label: 'Road Race', type: 'motorsport', depth: 0.42, finish: 'motorsport' },
  ],
  suv: [
    { value: 'lux-10', label: 'Luxury 10', type: 'multi-spoke', depth: 0.45, finish: 'chrome-lip' },
    { value: 'forged-suv', label: 'Forged SUV', type: 'split-6', depth: 0.5, finish: 'forged' },
    { value: 'offroad-bead', label: 'Beadlock', type: 'five-hole', depth: 0.7, finish: 'oem' },
    { value: 'directional', label: 'Directional', type: 'directional', depth: 0.48, finish: 'show' },
  ],
  street: [
    { value: 'split-5', label: 'Split 5', type: 'split-5', depth: 0.45, finish: 'street' },
    { value: 'mesh', label: 'Mesh', type: 'mesh', depth: 0.55, finish: 'chrome-lip' },
    { value: 'deep-dish', label: 'Deep Dish', type: 'three-piece', depth: 0.9, finish: 'chrome-lip' },
    { value: 'motorsport', label: 'Motorsport', type: 'motorsport', depth: 0.42, finish: 'forged' },
  ],
};

export const WHEEL_STYLES = Object.values(WHEEL_PRESETS).flat();

const CHASSIS_TEMPLATES = {
  'e92-coupe': {
    label: 'Euro Sport Coupe',
    family: 'euro',
    body: 'M22 134 C48 108 82 96 126 92 L176 91 C218 95 254 114 294 134 L303 151 L24 151 Z',
    cabin: 'M84 102 C111 91 149 89 178 94 C200 99 219 112 234 125 L70 125 C74 114 79 107 84 102 Z',
    belt: 'M46 134 C112 124 208 124 282 134',
    bumper: 'M34 143 C94 138 236 138 294 144',
    hood: 'M54 126 C76 116 104 110 132 108',
    rocker: 'M66 149 C132 145 216 145 278 149',
    tail: 'M274 130 L298 135',
    wheelbase: [84, 240],
    wheelRadius: 23,
    scaleY: 0.95,
    nose: 1.05,
  },
  'brz-86': {
    label: 'Compact Sports',
    family: 'jdm',
    body: 'M26 137 C54 109 88 95 130 91 L170 91 C207 97 248 118 290 137 L299 151 L28 151 Z',
    cabin: 'M86 103 C111 91 145 89 172 95 C192 100 211 113 226 126 L72 126 C76 115 81 108 86 103 Z',
    belt: 'M50 136 C116 126 202 126 278 136',
    bumper: 'M36 145 C96 138 230 138 292 145',
    hood: 'M58 126 C88 114 113 109 136 108',
    rocker: 'M66 150 C126 146 210 146 276 150',
    tail: 'M264 130 L292 137',
    wheelbase: [84, 236],
    wheelRadius: 23,
    scaleY: 0.9,
    rake: 1,
  },
  'g-coupe': {
    label: 'Long-Nose Coupe',
    family: 'jdm',
    body: 'M22 136 C51 110 88 98 136 96 L182 97 C222 103 258 120 296 136 L306 151 L24 151 Z',
    cabin: 'M104 105 C127 95 158 93 184 99 C204 104 222 115 236 126 L88 126 C91 118 97 110 104 105 Z',
    belt: 'M46 136 C126 128 212 128 286 137',
    bumper: 'M34 144 C96 139 238 139 298 145',
    hood: 'M46 127 C78 116 116 111 150 111',
    rocker: 'M64 150 C132 146 220 146 286 150',
    tail: 'M270 130 L298 138',
    wheelbase: [86, 242],
    wheelRadius: 23,
    scaleY: 0.96,
    nose: 1.18,
  },
  'eg-ek-hatch': {
    label: 'Classic Hatch',
    family: 'jdm',
    body: 'M28 135 C50 113 76 96 112 90 L158 88 C198 97 238 116 280 135 L290 151 L30 151 Z',
    cabin: 'M72 101 C98 89 136 87 164 92 C190 99 214 113 232 126 L62 126 C65 114 69 107 72 101 Z',
    belt: 'M48 134 C102 126 190 126 268 136',
    bumper: 'M38 144 C88 139 218 139 282 145',
    hood: 'M52 126 C76 116 100 111 126 110',
    rocker: 'M66 150 C120 146 204 146 268 150',
    tail: 'M254 127 L286 137',
    wheelbase: [84, 228],
    wheelRadius: 22,
    scaleY: 0.98,
  },
  'gtr-profile': {
    label: 'AWD Icon',
    family: 'jdm',
    body: 'M20 136 C50 108 88 96 136 94 L188 95 C230 101 266 119 300 136 L310 152 L22 152 Z',
    cabin: 'M92 103 C119 93 156 91 186 97 C208 102 229 114 244 127 L76 127 C80 116 85 109 92 103 Z',
    belt: 'M44 136 C118 126 214 126 290 137',
    bumper: 'M32 145 C98 138 240 138 302 145',
    hood: 'M50 126 C84 115 118 111 150 111',
    rocker: 'M62 150 C134 146 226 146 292 150',
    tail: 'M276 130 L304 138',
    wheelbase: [80, 244],
    wheelRadius: 24,
    scaleY: 0.94,
    rake: 1,
  },
  'bmw-coupe': {
    label: 'BMW Coupe',
    family: 'euro',
    body: 'M24 134 C49 108 82 96 126 92 L174 91 C216 94 252 113 292 132 L302 151 L26 151 Z',
    cabin: 'M86 102 C112 91 147 88 176 94 C198 99 217 111 232 124 L72 124 C75 114 79 107 86 102 Z',
    belt: 'M48 134 C112 124 206 124 280 134',
    bumper: 'M34 141 C74 137 244 137 292 142',
    wheelbase: [84, 238],
    wheelRadius: 23,
    scaleY: 0.96,
  },
  'bmw-sedan': {
    label: 'BMW Sedan',
    family: 'euro',
    body: 'M24 133 C51 113 78 101 118 97 L184 96 C224 101 258 116 294 133 L302 151 L26 151 Z',
    cabin: 'M82 104 L124 94 L184 97 L228 124 L70 124 C72 115 76 108 82 104 Z',
    belt: 'M48 133 C112 126 210 126 282 134',
    bumper: 'M35 142 C90 137 230 137 292 143',
    wheelbase: [82, 240],
    wheelRadius: 22,
    scaleY: 1.01,
  },
  'jdm-hatch': {
    label: 'JDM Hatch',
    family: 'jdm',
    body: 'M28 134 C50 112 78 96 116 90 L164 88 C204 97 244 116 282 134 L292 151 L30 151 Z',
    cabin: 'M78 101 C104 89 141 87 169 92 C194 99 216 111 232 125 L66 125 C69 114 73 107 78 101 Z',
    belt: 'M48 134 C104 126 192 126 270 135',
    bumper: 'M38 143 C88 138 224 138 282 144',
    wheelbase: [86, 232],
    wheelRadius: 22,
    scaleY: 0.98,
  },
  muscle: {
    label: 'Muscle',
    family: 'muscle',
    body: 'M20 134 C43 111 78 102 126 101 L188 99 C232 101 265 116 300 134 L308 153 L22 153 Z',
    cabin: 'M92 105 C116 96 151 94 180 99 C201 103 218 113 232 126 L80 126 C82 117 86 110 92 105 Z',
    belt: 'M44 136 C118 127 210 127 288 136',
    bumper: 'M32 144 C88 139 238 139 298 145',
    wheelbase: [78, 246],
    wheelRadius: 24,
    scaleY: 0.98,
    rake: -2,
  },
  'euro-wagon': {
    label: 'Euro Wagon',
    family: 'euro',
    body: 'M22 132 C48 105 78 92 122 88 L200 90 C236 99 270 117 296 132 L306 151 L24 151 Z',
    cabin: 'M72 98 C104 88 152 86 202 92 L244 124 L60 124 C63 113 67 104 72 98 Z',
    belt: 'M46 132 C116 123 220 124 286 133',
    bumper: 'M34 142 C94 137 240 137 296 143',
    wheelbase: [84, 244],
    wheelRadius: 22,
    scaleY: 1.02,
  },
  suv: {
    label: 'SUV',
    family: 'suv',
    body: 'M24 130 L58 90 C70 80 90 76 120 76 L196 80 C236 91 270 112 296 130 L308 153 L24 153 Z',
    cabin: 'M70 92 L124 86 L192 88 L238 122 L58 122 C60 109 64 99 70 92 Z',
    belt: 'M48 130 C116 122 216 123 286 132',
    bumper: 'M36 143 C98 138 236 138 298 144',
    wheelbase: [84, 240],
    wheelRadius: 24,
    scaleY: 1.14,
  },
  truck: {
    label: 'Truck',
    family: 'muscle',
    body: 'M22 133 L58 91 C70 82 92 78 122 78 L160 86 L178 111 L244 111 C270 116 292 130 304 142 L302 154 L24 154 Z',
    cabin: 'M72 94 L124 88 L158 94 L174 122 L58 122 C61 110 66 101 72 94 Z',
    belt: 'M48 134 C98 127 220 128 288 136',
    bumper: 'M34 144 C98 139 238 139 298 145',
    wheelbase: [82, 246],
    wheelRadius: 25,
    scaleY: 1.1,
  },
  'modern-tuner': {
    label: 'Modern Tuner',
    family: 'jdm',
    body: 'M24 136 C52 108 88 93 132 89 L176 90 C216 96 252 116 292 136 L302 151 L26 151 Z',
    cabin: 'M88 101 C114 90 148 88 176 94 C197 99 214 112 228 125 L72 125 C76 114 82 106 88 101 Z',
    belt: 'M50 135 C116 124 208 124 278 135',
    bumper: 'M34 144 C96 137 234 137 292 144',
    wheelbase: [84, 238],
    wheelRadius: 23,
    scaleY: 0.93,
    rake: 1,
  },
  drift: {
    label: 'Drift',
    family: 'jdm',
    body: 'M24 136 C52 109 88 96 132 92 L180 93 C219 99 255 117 294 136 L304 151 L26 151 Z',
    cabin: 'M88 103 C114 92 150 90 180 96 C202 101 220 113 234 126 L74 126 C77 116 82 108 88 103 Z',
    belt: 'M48 136 C116 126 210 126 284 136',
    bumper: 'M32 144 C96 138 238 138 296 145',
    wheelbase: [82, 240],
    wheelRadius: 23,
    scaleY: 0.94,
    rake: 2,
  },
  track: {
    label: 'Track',
    family: 'jdm',
    body: 'M22 137 C50 108 86 94 132 91 L180 92 C220 98 258 117 296 137 L306 151 L24 151 Z',
    cabin: 'M86 102 C112 91 150 89 178 94 C202 99 222 112 238 126 L72 126 C75 116 80 108 86 102 Z',
    belt: 'M46 136 C116 124 212 124 286 136',
    bumper: 'M32 144 C98 137 236 137 296 145',
    wheelbase: [82, 240],
    wheelRadius: 23,
    scaleY: 0.91,
    rake: 1,
  },
};

const STYLE_DEFAULTS = {
  'oem-plus': { ride: 'lowered', aero: ['lip-kit'], wheelBias: 'forged' },
  street: { ride: 'lowered', aero: ['lip-kit'], wheelBias: 'street' },
  track: { ride: 'track', aero: ['splitter', 'diffuser', 'gt-wing'], wheelBias: 'motorsport' },
  drift: { ride: 'aggressive', aero: ['widebody', 'gt-wing', 'hood-vents'], wheelBias: 'motorsport' },
  show: { ride: 'slammed', aero: ['lip-kit', 'ducktail'], wheelBias: 'chrome-lip' },
  drag: { ride: 'drag', aero: ['hood-vents'], wheelBias: 'drag' },
  vip: { ride: 'slammed', aero: ['lip-kit'], wheelBias: 'chrome-lip' },
  stance: { ride: 'slammed', aero: ['widebody', 'ducktail'], wheelBias: 'chrome-lip' },
  'time-attack': { ride: 'track', aero: ['splitter', 'canards', 'gt-wing', 'diffuser'], wheelBias: 'motorsport' },
};

const MODE_MOODS = {
  'oem-plus': { accent: '#7dd3fc', label: 'Clean factory-plus' },
  street: { accent: '#00e5ff', label: 'Street balanced' },
  track: { accent: '#ff9d00', label: 'Lap-focused' },
  drift: { accent: '#c44cff', label: 'Angle setup' },
  show: { accent: '#ff5bd6', label: 'Show floor' },
  drag: { accent: '#ffc800', label: 'Straight-line' },
  vip: { accent: '#d7b7ff', label: 'Luxury stance' },
  stance: { accent: '#9d00ff', label: 'Fitment first' },
  'time-attack': { accent: '#ff305c', label: 'Aero attack' },
};

function normalizeConfig(config) {
  return { ...DEFAULT_VISUAL_CONFIG, ...(config || {}) };
}

function vehicleText(vehicle) {
  return `${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.trim || ''}`.toLowerCase();
}

function inferPlatform(vehicle) {
  const text = vehicleText(vehicle);
  if (/(bmw|audi|mercedes|benz|volkswagen|vw|porsche|mini|euro)/.test(text)) return 'euro';
  if (/(mustang|camaro|challenger|charger|corvette|dodge|chevy|chevrolet|pontiac|firebird|mopar|coyote|hemi|truck|silverado|f-150|f150|ram)/.test(text)) return 'muscle';
  if (/(suv|4runner|tahoe|jeep|wrangler|bronco|x5|q5|rav4|cr-v|crv|escalade|navigator)/.test(text)) return 'suv';
  if (/(honda|acura|toyota|lexus|nissan|infiniti|subaru|mazda|mitsubishi|brz|fr-s|frs|86|supra|silvia|civic|integra|miata|rx-7|rx7|wrx|sti|jdm)/.test(text)) return 'jdm';
  return 'street';
}

function inferChassis(vehicle, visual) {
  if (visual.body_style && visual.body_style !== 'auto' && CHASSIS_TEMPLATES[visual.body_style]) return visual.body_style;
  const text = vehicleText(vehicle);
  const style = visual.build_style;
  if (style === 'drift') return 'drift';
  if (style === 'track' || style === 'time-attack') return 'track';
  if (/(e92|e46 coupe|335i|328i coupe|m3 coupe)/.test(text)) return 'e92-coupe';
  if (/(brz|fr-s|frs|gr86|gt86|86)/.test(text)) return 'brz-86';
  if (/(g35|g37|q60|infiniti coupe)/.test(text)) return 'g-coupe';
  if (/(ek|eg|civic hatch|integra hatch|crx)/.test(text)) return 'eg-ek-hatch';
  if (/(gtr|gt-r|r35|r34|skyline)/.test(text)) return 'gtr-profile';
  if (/(m3|m4|m2|bmw.*coupe|bmw.*2|bmw.*4|bmw.*3 coupe)/.test(text)) return 'bmw-coupe';
  if (/(bmw|m5|m340|e90|f30|g80|sedan)/.test(text) && /(bmw|m5|m340|e90|f30|g80)/.test(text)) return 'bmw-sedan';
  if (/(wagon|avant|estate|touring|allroad)/.test(text)) return 'euro-wagon';
  if (/(truck|silverado|f-150|f150|ram|tacoma|tundra|ranger|sierra)/.test(text)) return 'truck';
  if (/(suv|4runner|tahoe|jeep|wrangler|bronco|x5|q5|rav4|cr-v|crv|escalade)/.test(text)) return 'suv';
  if (/(mustang|camaro|challenger|charger|firebird|gto|corvette)/.test(text)) return 'muscle';
  if (/(gti|hatch|civic hatch|focus|golf|veloster|fiesta|wrx hatch)/.test(text)) return 'jdm-hatch';
  if (/(brz|fr-s|frs|86|miata|rx-7|rx7|s2000|supra|silvia|240sx|350z|370z|civic|integra|wrx|sti)/.test(text)) return 'modern-tuner';
  return 'modern-tuner';
}

function wheelPresetsFor(vehicle, config) {
  const platform = inferPlatform(vehicle);
  const presets = WHEEL_PRESETS[platform] || WHEEL_PRESETS.street;
  const styleDefault = STYLE_DEFAULTS[config.build_style] || STYLE_DEFAULTS.street;
  const sorted = [...presets].sort((a, b) => {
    const aScore = a.finish === styleDefault.wheelBias ? -1 : 0;
    const bScore = b.finish === styleDefault.wheelBias ? -1 : 0;
    return aScore - bScore;
  });
  const fallback = WHEEL_PRESETS.street;
  return [...sorted, ...fallback]
    .filter((item, index, arr) => arr.findIndex(other => other.value === item.value) === index)
    .slice(0, 6);
}

function wheelPreset(style) {
  return WHEEL_STYLES.find(item => item.value === style) || WHEEL_PRESETS.street[0];
}

function effectiveWheelStyle(vehicle, config) {
  if (config.wheel_style && config.wheel_style !== 'auto') return config.wheel_style;
  return wheelPresetsFor(vehicle, config)[0]?.value || WHEEL_PRESETS.street[0].value;
}

function effectiveRideHeight(config) {
  if (config.ride_height && config.ride_height !== 'stock') return config.ride_height;
  return STYLE_DEFAULTS[config.build_style]?.ride || config.ride_height || 'stock';
}

function effectiveAeroLayers(config, chassisKey) {
  const manual = Array.isArray(config.aero_layers) && config.aero_layers.length > 0;
  const candidates = manual ? config.aero_layers : (STYLE_DEFAULTS[config.build_style]?.aero || []);
  return candidates.filter(layer => {
    const spec = AERO_LAYERS.find(item => item.value === layer);
    if (!spec) return false;
    return spec.chassis.includes(chassisKey) && spec.styles.includes(config.build_style);
  });
}

function compatibleAeroLayers(style, chassisKey, requested = []) {
  const candidates = requested.length ? requested : (STYLE_DEFAULTS[style]?.aero || []);
  return candidates.filter(layer => {
    const spec = AERO_LAYERS.find(item => item.value === layer);
    return spec && spec.chassis.includes(chassisKey) && spec.styles.includes(style);
  });
}

function applyBuildModePreset(visual, mode, chassisKey) {
  const preset = STYLE_DEFAULTS[mode] || STYLE_DEFAULTS.street;
  return {
    ...visual,
    build_style: mode,
    ride_height: preset.ride,
    wheel_style: 'auto',
    aero_layers: compatibleAeroLayers(mode, chassisKey, preset.aero),
  };
}

function visualSignature(config, camera) {
  return [
    camera,
    config.paint_color,
    config.paint_finish,
    config.wheel_style,
    config.wheel_color,
    effectiveRideHeight(config),
    config.build_style,
    (config.aero_layers || []).join('-'),
  ].join('|');
}

function buildStats(config, vehicle) {
  const visual = normalizeConfig(config);
  const ride = effectiveRideHeight(visual);
  const aero = Array.isArray(visual.aero_layers) ? visual.aero_layers.length : 0;
  const styleWeights = {
    'oem-plus': [48, 28, 72, 18, 56, 42],
    street: [58, 42, 64, 28, 66, 45],
    track: [76, 86, 36, 78, 82, 64],
    drift: [86, 68, 28, 62, 76, 70],
    show: [72, 30, 52, 34, 86, 82],
    drag: [64, 46, 48, 36, 58, 66],
    vip: [70, 18, 74, 20, 82, 78],
    stance: [94, 18, 42, 30, 92, 84],
    'time-attack': [88, 96, 22, 92, 90, 74],
  };
  const rideBoost = { stock: -8, lowered: 4, aggressive: 12, slammed: 22, drag: 10, track: 14 }[ride] || 0;
  const base = styleWeights[visual.build_style] || styleWeights.street;
  const wheel = wheelPreset(effectiveWheelStyle(vehicle, visual));
  const rarity = Math.min(99, base[5] + aero * 5 + Math.round((wheel?.depth || 0.4) * 12));
  return [
    { label: 'Stance', value: Math.min(99, base[0] + rideBoost) },
    { label: 'Aggro', value: Math.min(99, base[1] + aero * 6) },
    { label: 'Track', value: Math.min(99, base[3] + (visual.build_style === 'time-attack' ? 8 : 0)) },
    { label: 'Comfort', value: Math.max(10, base[2] - Math.max(0, rideBoost)) },
    { label: 'Aero', value: Math.min(99, base[4] + aero * 8) },
    { label: 'Rarity', value: rarity },
  ];
}

function partRecommendations(vehicle, visual, chassisKey) {
  const platform = inferPlatform(vehicle);
  const wheel = wheelPresetsFor(vehicle, visual)[0];
  const aero = compatibleAeroLayers(visual.build_style, chassisKey);
  const ride = effectiveRideHeight(visual);
  const platformHint = {
    euro: 'Euro/OEM+ fitment bias',
    jdm: 'JDM motorsport catalog',
    muscle: 'Muscle/drag-safe choices',
    suv: 'Large-body wheel scale',
    street: 'Universal street setup',
  }[platform] || 'Street setup';
  return [
    `${wheel?.label || 'Platform wheel'} recommended`,
    aero.length ? `${aero.map(layer => AERO_LAYERS.find(item => item.value === layer)?.label).filter(Boolean).slice(0, 2).join(' + ')} compatible` : 'Clean aero delete compatible',
    `${platformHint} / ${ride.replace('-', ' ')} stance`,
  ];
}

function snapshotName(config, index) {
  const style = BUILD_STYLES.find(item => item.value === config.build_style)?.label || 'Street';
  return `${index + 1}. ${style} / ${effectiveRideHeight(config)}`;
}

function stanceFor(config, template) {
  const rideHeight = effectiveRideHeight(config);
  const base = {
    stock: { bodyY: 0, wheelY: 156, wheelScale: 1, track: 0, shadow: 0.38, camber: 0, tire: 1, rake: template.rake || 0 },
    lowered: { bodyY: 8, wheelY: 155, wheelScale: 1.02, track: 2, shadow: 0.46, camber: -1, tire: 0.95, rake: template.rake || 0 },
    aggressive: { bodyY: 12, wheelY: 154, wheelScale: 1.04, track: 5, shadow: 0.5, camber: -3, tire: 0.9, rake: (template.rake || 0) + 1 },
    slammed: { bodyY: 17, wheelY: 153, wheelScale: 1.05, track: 7, shadow: 0.56, camber: -5, tire: 0.84, rake: template.rake || 0 },
    drag: { bodyY: 4, wheelY: 156, wheelScale: 1.06, track: 2, shadow: 0.48, camber: 0, tire: 1.1, rake: -3 },
    track: { bodyY: 10, wheelY: 155, wheelScale: 1.03, track: 4, shadow: 0.5, camber: -2, tire: 0.92, rake: 1 },
  };
  return base[rideHeight] || base.stock;
}

function fitmentFor(config, template) {
  const style = config.build_style;
  const ride = effectiveRideHeight(config);
  const base = {
    offset: 0,
    frontScale: 1,
    rearScale: 1,
    frontCamber: 0,
    rearCamber: 0,
    tire: 1,
    caliper: '#ff4466',
  };
  if (style === 'drag' || ride === 'drag') {
    return { ...base, offset: 1, frontScale: 0.9, rearScale: 1.2, tire: 1.18, caliper: '#ffc800' };
  }
  if (style === 'stance' || style === 'vip' || ride === 'slammed') {
    return { ...base, offset: 8, frontScale: 1.05, rearScale: 1.08, frontCamber: -5, rearCamber: 5, tire: 0.78, caliper: '#c44cff' };
  }
  if (style === 'drift') {
    return { ...base, offset: 6, frontScale: 1.08, rearScale: 1.02, frontCamber: -4, rearCamber: 3, tire: 0.88, caliper: '#00e5ff' };
  }
  if (style === 'track' || style === 'time-attack' || ride === 'track') {
    return { ...base, offset: 4, frontScale: 1.06, rearScale: 1.06, frontCamber: -2, rearCamber: 2, tire: 0.9, caliper: '#ff9d00' };
  }
  if (style === 'show') {
    return { ...base, offset: 5, frontScale: 1.05, rearScale: 1.05, frontCamber: -2, rearCamber: 2, tire: 0.84, caliper: '#00e5ff' };
  }
  return { ...base, offset: template.family === 'suv' ? 1 : 2, caliper: template.family === 'euro' ? '#2f80ff' : '#ff4466' };
}

function finishStops(finish, paintColor) {
  if (finish === 'matte') return { hi: 0.16, mid: 0.86, low: 0.5, spec: 0.08 };
  if (finish === 'satin') return { hi: 0.24, mid: 0.95, low: 0.48, spec: 0.16 };
  if (finish === 'metallic') return { hi: 0.42, mid: 1, low: 0.38, spec: 0.34 };
  if (finish === 'pearl') return { hi: 0.48, mid: 1, low: 0.44, spec: 0.42, pearl: paintColor };
  return { hi: 0.38, mid: 1, low: 0.42, spec: 0.3 };
}

function wheelSpokes(type) {
  if (type === 'mesh') {
    return [
      ...Array.from({ length: 14 }, (_, i) => {
        const a = (i * 25.7) * Math.PI / 180;
        return <line key={`m-${i}`} x1={Math.cos(a) * 4} y1={Math.sin(a) * 4} x2={Math.cos(a) * 15} y2={Math.sin(a) * 15} />;
      }),
      <circle key="mesh-ring" cx="0" cy="0" r="10" fill="none" />,
    ];
  }
  if (type === 'six-spoke') {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60) * Math.PI / 180;
      return <path key={i} d={`M0 0 L${Math.cos(a - 0.11) * 4} ${Math.sin(a - 0.11) * 4} L${Math.cos(a) * 16} ${Math.sin(a) * 16} L${Math.cos(a + 0.11) * 4} ${Math.sin(a + 0.11) * 4} Z`} />;
    });
  }
  if (type === 'split-7' || type === 'split-6' || type === 'split-5') {
    const count = type === 'split-7' ? 7 : type === 'split-6' ? 6 : 5;
    return Array.from({ length: count }, (_, i) => {
      const base = (i * (360 / count)) * Math.PI / 180;
      return (
        <g key={i}>
          <line x1={Math.cos(base - 0.07) * 4} y1={Math.sin(base - 0.07) * 4} x2={Math.cos(base - 0.07) * 16} y2={Math.sin(base - 0.07) * 16} />
          <line x1={Math.cos(base + 0.07) * 4} y1={Math.sin(base + 0.07) * 4} x2={Math.cos(base + 0.07) * 16} y2={Math.sin(base + 0.07) * 16} />
        </g>
      );
    });
  }
  if (type === 'twin-5') {
    return Array.from({ length: 5 }, (_, i) => {
      const base = (i * 72) * Math.PI / 180;
      return (
        <g key={i}>
          <line x1={Math.cos(base - 0.13) * 4} y1={Math.sin(base - 0.13) * 4} x2={Math.cos(base - 0.13) * 16} y2={Math.sin(base - 0.13) * 16} />
          <line x1={Math.cos(base + 0.13) * 4} y1={Math.sin(base + 0.13) * 4} x2={Math.cos(base + 0.13) * 16} y2={Math.sin(base + 0.13) * 16} />
        </g>
      );
    });
  }
  if (type === 'three-piece') {
    return [
      <circle key="lip" cx="0" cy="0" r="15" fill="none" />,
      <circle key="bolts" cx="0" cy="0" r="11" fill="none" strokeDasharray="1.5 3.2" />,
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72) * Math.PI / 180;
        return <path key={i} d={`M0 0 L${Math.cos(a - 0.12) * 4} ${Math.sin(a - 0.12) * 4} L${Math.cos(a) * 14} ${Math.sin(a) * 14} L${Math.cos(a + 0.12) * 4} ${Math.sin(a + 0.12) * 4} Z`} />;
      }),
    ];
  }
  if (type === 'drag-star' || type === 'classic-5') {
    return Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72) * Math.PI / 180;
      const w = type === 'drag-star' ? 0.2 : 0.13;
      return <path key={i} d={`M0 0 L${Math.cos(a - w) * 5} ${Math.sin(a - w) * 5} L${Math.cos(a) * 16} ${Math.sin(a) * 16} L${Math.cos(a + w) * 5} ${Math.sin(a + w) * 5} Z`} />;
    });
  }
  if (type === 'five-hole') {
    return [
      <circle key="ring" cx="0" cy="0" r="12" fill="none" />,
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72) * Math.PI / 180;
        return <circle key={i} cx={Math.cos(a) * 8.5} cy={Math.sin(a) * 8.5} r="3.2" />;
      }),
    ];
  }
  if (type === 'motorsport') {
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i * 40) * Math.PI / 180;
      return <line key={i} x1={Math.cos(a) * 4} y1={Math.sin(a) * 4} x2={Math.cos(a) * 16} y2={Math.sin(a) * 16} />;
    });
  }
  if (type === 'directional') {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60) * Math.PI / 180;
      return <path key={i} d={`M${Math.cos(a) * 4} ${Math.sin(a) * 4} C${Math.cos(a + 0.35) * 11} ${Math.sin(a + 0.35) * 11} ${Math.cos(a + 0.12) * 16} ${Math.sin(a + 0.12) * 16} ${Math.cos(a) * 17} ${Math.sin(a) * 17}`} fill="none" />;
    });
  }
  if (type === 'multi-spoke') {
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30) * Math.PI / 180;
      return <line key={i} x1={Math.cos(a) * 4} y1={Math.sin(a) * 4} x2={Math.cos(a) * 16} y2={Math.sin(a) * 16} />;
    });
  }
  return [
    <line key="v" x1="0" y1="-16" x2="0" y2="16" />,
    <line key="h" x1="-16" y1="0" x2="16" y2="0" />,
  ];
}

function VisualWheel({ x, y, style, color, radius = 23, scale = 1, camber = 0, tire = 1, caliper = '#ff4466' }) {
  const preset = wheelPreset(style);
  const lip = Math.max(2, preset.depth * 7);
  const tireRadius = radius + 4 * tire;
  return (
    <g transform={`translate(${x} ${y}) rotate(${camber}) scale(${scale})`}>
      <ellipse cx="2" cy="4" rx={tireRadius * 0.9} ry={tireRadius * 0.34} fill="rgba(0,0,0,0.3)" />
      <ellipse cx="0" cy="0" rx={tireRadius * 0.94} ry={tireRadius} fill="#030306" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
      <path d="M10 -11 C18 -2 18 7 10 14" stroke={caliper} strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      <circle cx="0" cy="0" r={radius - 1} fill={preset.finish === 'chrome-lip' ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.12)'} />
      <circle cx="0" cy="0" r={radius - lip} fill={color} stroke="rgba(255,255,255,0.34)" strokeWidth="2" />
      <circle cx="0" cy="0" r={radius - 8} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="2" />
      <g stroke="#e0e6ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#e0e6ff" opacity="0.9">
        {wheelSpokes(preset.type)}
      </g>
      <circle cx="0" cy="0" r="4.2" fill="#050508" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </g>
  );
}

function AeroLayer({ layer, template }) {
  if (layer === 'ducktail') return <path d="M252 124 L288 116 L284 127 Z" fill="rgba(5,5,8,0.72)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />;
  if (layer === 'gt-wing') return <g><path d="M226 86 L278 78 L284 83 L230 92 Z" fill="rgba(5,5,8,0.82)" stroke="rgba(0,229,255,0.28)" strokeWidth="1.5" /><line x1="240" y1="91" x2="244" y2="121" stroke="rgba(255,255,255,0.3)" strokeWidth="2" /><line x1="270" y1="83" x2="268" y2="122" stroke="rgba(255,255,255,0.3)" strokeWidth="2" /></g>;
  if (layer === 'lip-kit') return <path d="M38 148 C98 144 226 144 292 148" stroke="rgba(0,229,255,0.42)" strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (layer === 'splitter') return <path d="M28 151 L124 151 L104 157 L20 157 Z" fill="rgba(5,5,8,0.9)" stroke="rgba(0,229,255,0.3)" strokeWidth="1.5" />;
  if (layer === 'diffuser') return <path d="M240 150 L304 151 L286 158 L250 157 Z" fill="rgba(5,5,8,0.88)" stroke="rgba(157,0,255,0.3)" strokeWidth="1.5" />;
  if (layer === 'hood-vents') return <g stroke="rgba(5,5,8,0.75)" strokeWidth="3" strokeLinecap="round"><line x1="82" y1="116" x2="114" y2="112" /><line x1="90" y1="123" x2="122" y2="119" /></g>;
  if (layer === 'canards') return <g fill="rgba(5,5,8,0.85)" stroke="rgba(0,229,255,0.3)" strokeWidth="1"><path d="M44 130 L20 124 L42 138 Z" /><path d="M48 140 L24 141 L48 146 Z" /></g>;
  if (layer === 'roof-spoiler') return <path d="M206 92 L244 86 L248 92 L210 98 Z" fill="rgba(5,5,8,0.72)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />;
  if (layer === 'widebody') return <g fill="rgba(5,5,8,0.32)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5"><path d={`M${template.wheelbase[0] - 36} 137 C${template.wheelbase[0] - 20} 124 ${template.wheelbase[0] + 20} 124 ${template.wheelbase[0] + 36} 137`} /><path d={`M${template.wheelbase[1] - 36} 137 C${template.wheelbase[1] - 20} 124 ${template.wheelbase[1] + 20} 124 ${template.wheelbase[1] + 36} 137`} /></g>;
  return null;
}

function AeroLayers({ layers = [], template }) {
  return <g className="visual-aero-layers">{layers.map(layer => <AeroLayer key={layer} layer={layer} template={template} />)}</g>;
}

function BodyDetailLines({ template, stance, chassisKey }) {
  const [front, rear] = template.wheelbase;
  const isTruck = chassisKey === 'truck' || template.family === 'suv';
  return (
    <g className="visual-body-lines" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={template.hood || `M54 126 C82 116 112 111 140 110`} stroke="rgba(5,5,8,0.46)" strokeWidth="2.2" />
      <path d={template.rocker || `M66 150 C132 146 216 146 278 150`} stroke="rgba(0,0,0,0.44)" strokeWidth="4" />
      <path d={template.tail || `M266 130 L294 138`} stroke="rgba(5,5,8,0.44)" strokeWidth="2.2" />
      <path d={`M${front - 35} 139 C${front - 22} 125 ${front + 22} 125 ${front + 35} 139`} stroke="rgba(5,5,8,0.52)" strokeWidth="3" />
      <path d={`M${rear - 35} 139 C${rear - 22} 125 ${rear + 22} 125 ${rear + 35} 139`} stroke="rgba(5,5,8,0.52)" strokeWidth="3" />
      <path d="M40 132 L62 128" stroke="rgba(224,230,255,0.72)" strokeWidth="2.6" />
      <path d="M282 132 L300 136" stroke="rgba(255,68,102,0.7)" strokeWidth="2.6" />
      <path d="M44 144 C72 140 246 140 292 144" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
      {isTruck && <path d="M174 112 L244 112" stroke="rgba(5,5,8,0.4)" strokeWidth="2" />}
      {stance.rake < -1 && <path d="M248 154 L284 154" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />}
    </g>
  );
}

export function CarPreview({ vehicle, config, compact = false, camera = 'side' }) {
  const visual = normalizeConfig(config);
  const chassisKey = inferChassis(vehicle, visual);
  const template = CHASSIS_TEMPLATES[chassisKey] || CHASSIS_TEMPLATES['modern-tuner'];
  const stance = stanceFor(visual, template);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const paintGradient = `paint-${uid}`;
  const glassGradient = `glass-${uid}`;
  const specGradient = `spec-${uid}`;
  const finish = finishStops(visual.paint_finish, visual.paint_color);
  const [frontWheelBase, rearWheelBase] = template.wheelbase;
  const fitment = fitmentFor(visual, template);
  const frontWheel = frontWheelBase - stance.track - fitment.offset;
  const rearWheel = rearWheelBase + stance.track + fitment.offset;
  const bodyTransform = `translate(0 ${stance.bodyY}) scale(1 ${template.scaleY}) rotate(${stance.rake} 160 132)`;
  const wheelStyle = effectiveWheelStyle(vehicle, visual);
  const aeroLayers = effectiveAeroLayers(visual, chassisKey);
  const cameraMode = CAMERA_MODES.some(mode => mode.value === camera) ? camera : 'side';
  const cameraTransforms = {
    side: { scene: '', frontScale: 1, rearScale: 1, frontY: 0, rearY: 0 },
    front: { scene: 'translate(-10 0) scale(0.94 1) skewY(-2)', frontScale: 1.1, rearScale: 0.88, frontY: -1, rearY: 2 },
    rear: { scene: 'translate(10 0) scale(0.94 1) skewY(2)', frontScale: 0.88, rearScale: 1.1, frontY: 2, rearY: -1 },
  };
  const cameraSetup = cameraTransforms[cameraMode];
  const signature = visualSignature(visual, cameraMode);
  const mood = MODE_MOODS[visual.build_style] || MODE_MOODS.street;

  return (
    <div
      className={`visual-preview visual-camera-${cameraMode} ${compact ? 'visual-preview-compact' : ''}`}
      style={{ '--mood-accent': mood.accent }}
    >
      <div className="visual-grid-bg" />
      <div className="visual-garage-fog" />
      <svg viewBox="0 0 320 196" className="visual-car-svg" role="img" aria-label="Digital build preview">
        <defs>
          <linearGradient id={paintGradient} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={finish.hi} />
            <stop offset="30%" stopColor={visual.paint_color} stopOpacity={finish.mid} />
            <stop offset="100%" stopColor="#050508" stopOpacity={finish.low} />
          </linearGradient>
          <linearGradient id={specGradient} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={finish.spec} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={glassGradient} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#152a42" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#050508" stopOpacity="0.72" />
          </linearGradient>
        </defs>

        <g key={signature} className="visual-scene-layer" transform={cameraSetup.scene}>
          <ellipse cx="160" cy="171" rx="136" ry="14" fill={`rgba(0,0,0,${stance.shadow})`} />
          <ellipse cx="160" cy="177" rx="116" ry="8" fill={visual.paint_color} opacity="0.08" />
          <path d="M34 155 C92 148 218 148 288 155" stroke="rgba(0,229,255,0.18)" strokeWidth="2" fill="none" />

          <g className="visual-car-layer" transform={bodyTransform}>
            <AeroLayers layers={aeroLayers.filter(layer => layer === 'widebody')} template={template} />
            <path d={template.body} fill={`url(#${paintGradient})`} stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
            <path className="visual-paint-sweep" d={template.body} fill={`url(#${specGradient})`} opacity={visual.paint_finish === 'matte' ? 0.22 : 0.78} />
            <path d={template.cabin} fill={`url(#${glassGradient})`} stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
            <path d={template.belt} stroke="rgba(255,255,255,0.32)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d={template.bumper} stroke="rgba(0,0,0,0.34)" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M68 127 C112 121 198 121 252 128" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {cameraMode === 'front' && <path d="M39 132 L67 126 L70 133 L43 141 Z" fill="rgba(255,255,255,0.24)" stroke="rgba(0,229,255,0.34)" strokeWidth="1.2" />}
            {cameraMode === 'rear' && <path d="M266 130 L300 135 L296 143 L264 138 Z" fill="rgba(255,68,102,0.28)" stroke="rgba(255,68,102,0.34)" strokeWidth="1.2" />}
            <BodyDetailLines template={template} stance={stance} chassisKey={chassisKey} />
            <AeroLayers layers={aeroLayers.filter(layer => layer !== 'widebody')} template={template} />
          </g>

          <g className="visual-wheel-set">
            <VisualWheel x={frontWheel} y={stance.wheelY + cameraSetup.frontY} style={wheelStyle} color={visual.wheel_color} radius={template.wheelRadius} scale={stance.wheelScale * fitment.frontScale * cameraSetup.frontScale} camber={stance.camber + fitment.frontCamber} tire={stance.tire * fitment.tire} caliper={fitment.caliper} />
            <VisualWheel x={rearWheel} y={stance.wheelY + cameraSetup.rearY} style={wheelStyle} color={visual.wheel_color} radius={template.wheelRadius} scale={stance.wheelScale * fitment.rearScale * cameraSetup.rearScale} camber={-stance.camber + fitment.rearCamber} tire={stance.tire * fitment.tire} caliper={fitment.caliper} />
          </g>
        </g>
      </svg>
      <div className="visual-preview-meta">
        <span>{vehicle?.year || 'Year'} {vehicle?.make || 'Make'} {vehicle?.model || 'Model'}</span>
        <span>{visual.trim || 'Base trim'} / {template.label} / {cameraMode}</span>
      </div>
    </div>
  );
}

export function BuildShareCard({ vehicle, config, budget, camera = 'side', stats = [], cinematic = false }) {
  const visual = normalizeConfig(config);
  const chassisKey = inferChassis(vehicle, visual);
  const platform = inferPlatform(vehicle);
  const mood = MODE_MOODS[visual.build_style] || MODE_MOODS.street;
  return (
    <div className={`share-build-card mood-${visual.build_style} ${cinematic ? 'cinematic' : ''}`} style={{ '--mood-accent': mood.accent }}>
      <div className="share-card-topline">
        <span>GLITCH GARAGE</span>
        <span>{platform.toUpperCase()} / {CHASSIS_TEMPLATES[chassisKey]?.label || 'Modern Tuner'} / {mood.label}</span>
      </div>
      <CarPreview vehicle={vehicle} config={visual} camera={camera} />
      {stats.length > 0 && (
        <div className="share-card-stat-strip">
          {stats.slice(0, 3).map(stat => (
            <span key={stat.label}>{stat.label} {stat.value}</span>
          ))}
        </div>
      )}
      <div className="share-card-footer">
        <div>
          <span className="share-card-label">Vehicle</span>
          <strong>{vehicle?.year} {vehicle?.make} {vehicle?.model}</strong>
        </div>
        <div>
          <span className="share-card-label">Style</span>
          <strong>{BUILD_STYLES.find(s => s.value === visual.build_style)?.label || 'Street'} / {effectiveRideHeight(visual)}</strong>
        </div>
        {budget !== undefined && (
          <div>
            <span className="share-card-label">Budget</span>
            <strong>${Number(budget || 0).toLocaleString()}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuildVisualizer({ vehicle, value, onChange, editable = true, title = 'Digital Garage' }) {
  const visual = normalizeConfig(value);
  const [camera, setCamera] = useState('side');
  const [snapshots, setSnapshots] = useState([]);
  const [compareConfig, setCompareConfig] = useState(null);
  const [favoriteIndex, setFavoriteIndex] = useState(null);
  const [cinematic, setCinematic] = useState(false);
  const rideIndex = Math.max(0, RIDE_HEIGHTS.findIndex(h => h.value === visual.ride_height));
  const platform = inferPlatform(vehicle);
  const chassisKey = inferChassis(vehicle, visual);
  const wheelPresets = wheelPresetsFor(vehicle, visual);
  const activeWheelStyle = effectiveWheelStyle(vehicle, visual);
  const availableAero = AERO_LAYERS.filter(layer => layer.chassis.includes(chassisKey) && layer.styles.includes(visual.build_style));
  const stats = useMemo(() => buildStats(visual, vehicle), [visual, vehicle]);
  const recommendations = useMemo(() => partRecommendations(vehicle, visual, chassisKey), [vehicle, visual, chassisKey]);
  const update = patch => onChange?.({ ...visual, ...patch });
  const updateBuildMode = mode => update(applyBuildModePreset(visual, mode, chassisKey));
  const saveSnapshot = () => {
    setSnapshots(current => [{ ...visual, saved_at: Date.now() }, ...current].slice(0, 5));
  };
  const revertSnapshot = snapshot => {
    const { saved_at, ...rest } = snapshot;
    update(rest);
  };
  const toggleAero = layer => {
    const current = Array.isArray(visual.aero_layers) ? visual.aero_layers : [];
    const next = current.includes(layer) ? current.filter(item => item !== layer) : [...current, layer];
    update({ aero_layers: next });
  };

  return (
    <section className="visualizer-panel">
      <div className="visualizer-header">
        <div>
          <span className="visualizer-kicker">Digital Build Visualizer</span>
          <h3>{title}</h3>
          <span className="visualizer-platform">{platform.toUpperCase()} TEMPLATE / {CHASSIS_TEMPLATES[chassisKey]?.label}</span>
        </div>
        <span className="visualizer-badge">2D Preview</span>
      </div>

      <div className="visualizer-layout">
        <div className="visualizer-showcase">
          <BuildShareCard vehicle={vehicle} config={visual} budget={vehicle?.budget} camera={camera} stats={stats} cinematic={cinematic} />

          <div className="camera-mode-row" role="group" aria-label="Preview angle">
            {CAMERA_MODES.map(mode => (
              <button
                key={mode.value}
                type="button"
                className={`camera-mode-btn ${camera === mode.value ? 'active' : ''}`}
                onClick={() => setCamera(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="visual-stats-grid">
            {stats.map(stat => (
              <div className="visual-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <i style={{ width: `${stat.value}%` }} />
              </div>
            ))}
          </div>

          <div className="visual-recommendations">
            {recommendations.map(item => <span key={item}>{item}</span>)}
          </div>

          <div className="social-ready-row">
            <button type="button" className={`camera-mode-btn ${cinematic ? 'active' : ''}`} onClick={() => setCinematic(!cinematic)}>
              Cinematic
            </button>
            <span>9:16 ready</span>
            <span>GG watermark</span>
          </div>

          {compareConfig && (
            <div className="visual-compare-row">
              <div>
                <span>Before</span>
                <CarPreview vehicle={vehicle} config={compareConfig} compact camera={camera} />
              </div>
              <div>
                <span>Now</span>
                <CarPreview vehicle={vehicle} config={visual} compact camera={camera} />
              </div>
            </div>
          )}

          {snapshots.length > 0 && (
            <div className="snapshot-strip">
              {snapshots.map((snapshot, index) => (
                <button
                  key={`${snapshot.saved_at}-${index}`}
                  type="button"
                  className={`snapshot-card ${favoriteIndex === index ? 'favorite' : ''}`}
                  onClick={() => setCompareConfig(snapshot)}
                  onDoubleClick={() => revertSnapshot(snapshot)}
                >
                  <CarPreview vehicle={vehicle} config={snapshot} compact camera={camera} />
                  <span>{snapshotName(snapshot, index)}</span>
                  <small onClick={event => { event.stopPropagation(); setFavoriteIndex(index); }}>Favorite</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {editable && (
          <div className="visualizer-controls">
            <div className="form-group">
              <label className="label">BUILD MODE</label>
              <div className="build-mode-grid">
                {BUILD_STYLES.filter(style => style.value !== 'stance').map(style => (
                  <button
                    key={style.value}
                    type="button"
                    className={`mode-chip ${visual.build_style === style.value ? 'active' : ''}`}
                    onClick={() => updateBuildMode(style.value)}
                  >
                    <span>{style.label}</span>
                    <small>{MODE_MOODS[style.value]?.label}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="snapshot-actions">
              <button type="button" className="btn-secondary small" onClick={saveSnapshot}>Save Spec</button>
              <button type="button" className="btn-secondary small" onClick={() => setCompareConfig(compareConfig ? null : snapshots[0] || visual)}>Compare</button>
              <button type="button" className="btn-secondary small" disabled={!snapshots[0]} onClick={() => snapshots[0] && revertSnapshot(snapshots[0])}>Revert</button>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="label">TRIM</label>
                <input className="input" value={visual.trim} placeholder="e.g. Sport, Si, Z71" onChange={e => update({ trim: e.target.value })} maxLength={80} />
              </div>
              <div className="form-group">
                <label className="label">CHASSIS TEMPLATE</label>
                <select className="input" value={visual.body_style} onChange={e => update({ body_style: e.target.value })}>
                  {BODY_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="label">BUILD STYLE</label>
                <select className="input" value={visual.build_style} onChange={e => updateBuildMode(e.target.value)}>
                  {BUILD_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">PAINT FINISH</label>
                <select className="input" value={visual.paint_finish} onChange={e => update({ paint_finish: e.target.value })}>
                  {PAINT_FINISHES.map(finish => <option key={finish.value} value={finish.value}>{finish.label}</option>)}
                </select>
              </div>
            </div>

            <div className="visualizer-control-grid">
              <div className="form-group">
                <label className="label">PAINT COLOR</label>
                <input className="color-input" type="color" value={visual.paint_color} onChange={e => update({ paint_color: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">WHEEL COLOR</label>
                <input className="color-input" type="color" value={visual.wheel_color} onChange={e => update({ wheel_color: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">PLATFORM WHEELS</label>
              <div className="wheel-style-grid">
                {wheelPresets.map(style => (
                  <button
                    key={style.value}
                    type="button"
                    className={`wheel-style-btn ${activeWheelStyle === style.value ? 'active' : ''}`}
                    onClick={() => update({ wheel_style: style.value })}
                  >
                    <svg viewBox="0 0 56 56" aria-hidden="true">
                      <VisualWheel x="28" y="28" style={style.value} color={visual.wheel_color} radius={18} scale={0.9} tire={1} />
                    </svg>
                    <span>{style.label}</span>
                    <small>{style.finish.replace('-', ' ')}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">STANCE</label>
              <input
                className="ride-slider"
                type="range"
                min="0"
                max={RIDE_HEIGHTS.length - 1}
                step="1"
                value={rideIndex}
                onChange={e => update({ ride_height: RIDE_HEIGHTS[Number(e.target.value)].value })}
              />
              <div className="ride-labels">
                {RIDE_HEIGHTS.map(height => (
                  <span key={height.value} className={visual.ride_height === height.value ? 'active' : ''}>{height.label}</span>
                ))}
              </div>
            </div>

            {availableAero.length > 0 && (
              <div className="form-group">
                <label className="label">AERO / BODY MODS</label>
                <div className="aero-toggle-grid">
                  {availableAero.map(layer => (
                    <button
                      key={layer.value}
                      type="button"
                      className={`aero-toggle ${visual.aero_layers?.includes(layer.value) ? 'active' : ''}`}
                      onClick={() => toggleAero(layer.value)}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
