
let settings = {
    volume: 80,
    theme: 'dark',
    msgFilter: 'all'  
};
const SETTINGS_FILE = 'Geo_settings.json';

function loadSettings() {
    try {
        const saved = localStorage.getItem('geopolitica_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            settings = { ...settings, ...parsed };
        }
    } catch(e) {}
    applySettings();
}

function saveSettingsToDisk() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = SETTINGS_FILE;
    a.click();
    URL.revokeObjectURL(url);    localStorage.setItem('geopolitica_settings', JSON.stringify(settings));
}

function resetSettings() {
    settings = { volume: 80, theme: 'dark', msgFilter: 'all' };
    applySettings();
    document.getElementById('settings-volume').value = settings.volume;
    document.getElementById('settings-theme').value = settings.theme;
    document.getElementById('settings-msgfilter').value = settings.msgFilter;
}

function applySettings() {
    document.body.className = settings.theme;
    if (audioCtx) {
        soundEnabled = settings.volume > 0;
    }
    document.body.className = settings.theme;
    window.msgFilter = settings.msgFilter;
}

let detectedUnits = {}; 
let playerVisibleNodes = new Set(); 
let sandstorms = [];
let storms = []; 
let pirateShips = []; 
let lightningFuseAvailable = false;   
let powerPlants = {};
let totalPower = 0;
let powerConsumption = 0;
let playerFaction = null;
let selectedNode = null;
let canvas, ctx;
let zoom = 1.0, panX = 0, panY = 0;
let isDragging = false, startX, startY, hasMoved = false;
let showCanvasUI = true;
let gameWon = false;
let mapImage = null, mapLoaded = false;
let discoveredBases = {};
let discoveredArmies = {};
let armies = [];
let merchantShips = [];
let airUnits = [];
let spies = [];
let guerrillaUnits = [];
let satellites = [];
let spaceStations = {};
let missileDefenses = {};
let tradeRoutes = [];
let taxTimer = 0, factoryTimer = 0, inflationTimer = 0, unTimer = 0, eventTimer = 0, climateTimer = 0;
let embargoActive = false;
let economicSanctions = {};
let radarStations = {};
let navalBases = {};
let warReport = { battles: 0, wins: 0, losses: 0, totalCasualties: 0 };
let soundEnabled = true;
let globalEvent = null;
let eventDuration = 0;
let climateState = 0;
let climateDuration = 0;
let peaceTreaties = {};
let onlineLobbyActive = false;
let lobbyPlayers = [];
let audioCtx = null;
let autoSaveInterval = null;

let techTree = {
    land_speed: { level: 0, max: 10, cost: 400, label: 'Kara Hız', researchTime: 15 },
    naval_speed: { level: 0, max: 10, cost: 500, label: 'Deniz Hız', researchTime: 30 },
    air_power: { level: 0, max: 10, cost: 600, label: 'Hava Gücü', researchTime: 50 },
    refinery_eff: { level: 0, max: 10, cost: 700, label: 'Rafineri Verim', researchTime: 30 },
    tank_tech: { level: 0, max: 2, cost: 1500, label: 'Tank Tek.', researchTime: 50},
    artillery_tech: { level: 0, max: 2, cost: 1000, label: 'Topçu Tek.', researchTime: 50},
    spy_tech: { level: 0, max: 2, cost: 1000, label: 'Casusluk', researchTime: 45},
    space_tech: { level: 0, max: 2, cost: 5000, label: 'Uzay Tek', researchTime: 100}
};
let relationsScore = {};
let nonAggressionPacts = {};
let vassalStates = {};
let blockades = {};
let airDefenses = {};
let unSanction = false;
let techLevel = { land: 0, naval: 0, air: 0, spy: 0, space: 0 };

const TAX_INTERVAL = 300;
const FACTORY_INTERVAL = 150;
const INFLATION_INTERVAL = 800;
const UN_INTERVAL = 1500;
const EVENT_INTERVAL = 1200;
const CLIMATE_INTERVAL = 2000;
const AI_TICK_INTERVAL = 5000;
const GAME_TICK_INTERVAL = 100;


const factions = {
    "TUR": { name: "Türkiye", type: "country", color: "#d63031", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5000, oil: 50, steel: 50, fighters: 85, food: 300 },
    "AZE": { name: "Azerbeycan", type: "country", color: "#00b894", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4000, oil:120, steel: 40,fighters: 0, food: 250 },
    "RUS": { name: "Rusya", type: "country", color: "#0984e3", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 8300, oil: 150, steel: 100, fighters: 180, food: 400 },
    "CHN": { name: "Çin", type: "country", color: "#e84118", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 8300,  oil: 15, steel: 120, fighters: 220, food: 500},
    "AUS": { name: "Avusturalya", type: "country", color: "#eccc68", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3600, oil: 40, steel: 70, fighters: 0, food: 400},
    "GBR": { name: "Birleşik Krallık", type: "country", color: "#2f3542", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4400,  oil: 30, steel: 60, fighters: 130, food:300},
    "GER": { name: "Almanya", type: "country", color: "#30336b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4800,  oil: 15, steel: 90, fighters: 100, food: 350},
    "FRA": { name: "Fransa", type: "country", color: "#130f40", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4200,  oil: 18, steel: 70, fighters: 110, food: 375},
    "ITA": { name: "İtalya", type: "country", color: "#10ac84", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3400,  oil: 12, steel: 55, fighters: 75, food: 350},
    "GRE": { name: "Yunanistan", type: "country", color: "#54a0ff", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4500,  oil: 8, steel: 30, fighters: 0, food: 200},
    "EGY": { name: "Mısır", type: "country", color: "#ee5253", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200,  oil: 50, steel: 35, fighters: 0, food: 300},
    "ESP": { name: "İspanya", type: "country", color: "#ff9f43", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3200,  oil: 10, steel: 45, fighters: 60, food: 325},
    "JPN": { name: "Japonya", type: "country", color: "#ff6b81", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4600, oil: 12, steel: 65, fighters: 140, food: 300},
    "IND": { name: "Hindistan", type: "country", color: "#ff4757", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3000,  oil: 60, steel: 80, fighters: 120, food: 475},
    "IRN": { name: "İran", type: "country", color: "#2ed573", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600, oil: 200, steel: 50, fighters: 0, food: 275},
    "SAU": { name: "Suudi Arabitan", type: "country", color: "#006400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4400, oil: 200, steel: 35, fighters: 0, food: 200},
    "UKR": { name: "Ukrayna", type: "country", color: "#4a69bd", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 100, steel: 60, fighters: 50, food: 450},
    "SRY": { name: "Suriye", type: "country", color: "#82ccdd", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 100, steel: 20, fighters: 0, food: 150},
    "ISR": { name: "israil", type: "org", color: "#60a3bc", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 15, steel: 38, fighters: 0, food: 225},
    "NZL": { name: "Yeni Zelanda", type: "country", color: "#1abc9c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 20, steel: 50, fighters: 0, food: 350},
    "PRT": { name: "Portekiz", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600, oil: 10, steel: 40, fighters: 0, food: 300},
    "NLD": { name: "Hollanda", type: "country", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4200, oil: 25, steel: 70, fighters: 0, food: 325},
    "BEL": { name: "Belçika", type: "country", color: "#f1c40f", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3600, oil: 12, steel: 64, fighters: 0, food: 290},
    "CHE": { name: "İsviçre", type: "country", color: "#7f8c8d", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5600, oil: 10, steel: 50, fighters: 0, food: 300},
    "AUT": { name: "Avusturya", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3400, oil: 11, steel: 58, fighters: 0, food: 310},
    "SWE": { name: "İsveç", type: "country", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4000, oil: 140, steel: 85, fighters: 0, food: 350},
    "NOR": { name: "Norveç", type: "country", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5800, oil: 180, steel: 72, fighters: 0, food: 340},
    "FIN": { name: "Finlandiya", type: "country", color: "#3498db", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3600, oil: 10, steel: 68, fighters: 0, food: 320},
    "POL": { name: "Polonya", type: "country", color: "#c0392b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5000, oil: 75, steel: 140, fighters: 55, food: 425},
    "ROU": { name: "Romanya", type: "country", color: "#9b59b6", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2400, oil: 10, steel: 50, fighters: 0, food: 390},
    "HUN": { name: "Macaristan", type: "country", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200,  oil: 12, steel: 46, fighters: 0, food: 345},
    "CZE": { name: "Çekya", type: "country", color: "#bdc3c7", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3200,  oil: 13, steel: 70, fighters: 0, food: 325},
    "KOR": { name: "Güney Kore", type: "country", color: "#34495e", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5400,  oil: 15, steel: 80, fighters: 0, food: 300},
    "PRK": { name: "Kuzey Kore", type: "country", color: "#7f8c8d", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 6000,  oil: 20, steel: 85, fighters: 0, food: 200},
    "IDN": { name: "Endonezya", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3200, oil: 80, steel: 70, fighters: 0, food: 600},
    "MYS": { name: "Malezya", type: "country", color: "#f39c12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3000,  oil: 70, steel:60, fighters: 0, food: 400},
    "PHL": { name: "Flipinler", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600,  oil: 30, steel: 55, fighters: 0, food: 450},
    "VNM": { name: "Vietnam", type: "country", color: "#c0392b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2400,  oil: 45, steel: 65, fighters: 0, food: 475},
    "THA": { name: "Tayland", type: "country", color: "#9b59b6", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 35, steel: 58, fighters: 0, food: 500},
    "PAK": { name: "Pakistan", type: "country", color: "#19b186", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5000, oil: 40, steel: 68, fighters: 0, food: 425},
    "BGD": { name: "Bangladeş", type: "country", color: "#2ecc71", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4500, oil: 15, steel: 45, fighters: 0, food: 450},
    "KAZ": { name: "Kazakistan", type: "country", color: "#00d9ff", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 120, steel: 90, fighters: 0, food: 400},
    "UZB": { name: "Özbekistan", type: "country", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200, oil: 50, steel: 60, fighters: 0, food: 375},
    "IRQ": { name: "Irak", type: "country", color: "#e74c3c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 160, steel: 48, fighters: 0, food: 250},
    "KWT": { name: "Kuveyt", type: "country", color: "#34495e", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4000, oil: 180, steel: 30, fighters: 0, food: 150},
    "ARE": { name: "Birleşik Arap Emirlikleri",type: "country", color: "#2c3e50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4800, oil: 190, steel: 45,  fighters: 0, food: 150},
    "QAT": { name: "Katar", type: "country", color: "#bdc3c7", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5000, oil: 150, steel: 35, fighters: 0, food: 160},
    "OMN": { name: "Umman", type: "country", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600, oil: 90, steel: 40, fighters: 0, food: 225},
    "YEM": { name: "Yemen", type: "country", color: "#7f8c8d", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 40, steel: 30, fighters: 0, food: 175},
    "JOR": { name: "Ürdün", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1600, oil: 20, steel: 28, fighters: 0, food: 250},
    "LBN": { name: "Lübnan", type: "country", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 15, steel: 32, fighters: 0, food: 210},
    "MAR": { name: "Fas", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2400, oil: 22, steel: 52, food: 350},
    "DZA": { name: "Cezayir", type: "country", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 110, steel: 58, fighters: 0, food: 350},
    "TUN": { name: "Tunus", type: "country", color: "#e74c3c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 30, steel: 40, fighters: 0, food: 290},
    "LBY": { name: "Libya", type: "country", color: "#2c3e50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200, oil: 130, steel: 35, fighters: 0, food: 200},
    "GEO": { name: "Gürcitan", type: "country", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 18, steel: 36, fighters: 0, food: 240},
    "ARM": { name: "Ermenistan", type: "country", color: "#8e44ad", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 10, steel: 39, fighters: 0, food: 210},
    "IRL": { name: "İrlanda", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3800, oil: 15, steel: 48, fighters: 0, food: 340},
    "DNK": { name: "Danimarka", type: "country", color: "#c0392b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4400, oil: 15, steel: 48, fighters: 0, food: 310},
    "HRV": { name: "Hırvatistan", type: "country", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3000, oil: 19, steel: 45, fighters: 0, food: 300},
    "SRB": { name: "Sırbistan", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200, oil: 17, steel: 52, fighters: 0, food: 340},
    "BGR": { name: "Bulgaristan", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 14, steel: 52, fighters: 0, food: 320},
    "ALB": { name: "Arnavutluk", type: "country", color: "#e74c3c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 10, steel: 20, fighters: 0, food: 150 },
    "BIH": { name: "Bosna-Hersek", type: "country", color: "#f39c12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 5, steel: 15, fighters: 0, food: 120 },
    "SVK": { name: "Slovakya", type: "country", color: "#1abc9c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2500, oil: 8, steel: 30, fighters: 0, food: 180 },
    "SVN": { name: "Slovenya", type: "country", color: "#2ecc71", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 5, steel: 25, fighters: 0, food: 160 },
    "MNE": { name: "Karadağ", type: "country", color: "#9b59b6", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1500, oil: 3, steel: 12, fighters: 0, food: 100 },
    "MKD": { name: "Kuzey Makedonya", type: "country", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1600, oil: 4, steel: 14, fighters: 0, food: 110 },
    "MDA": { name: "Moldova", type: "country", color: "#3498db", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 3, steel: 10, fighters: 0, food: 130 },
    "BLR": { name: "Belarus", type: "country", color: "#2c3e50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3000, oil: 15, steel: 40, fighters: 0, food: 200 },
    "ISL": { name: "İzlanda", type: "country", color: "#00bcd4", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 4000, oil: 5, steel: 10, fighters: 0, food: 80 },
    "LUX": { name: "Lüksemburg", type: "country", color: "#607d8b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 5000, oil: 2, steel: 8, fighters: 0, food: 60 },
    "CYP": { name: "Kıbrıs", type: "country", color: "#ff6b6b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2200, oil: 5, steel: 18, fighters: 0, food: 140 },
    "MLT": { name: "Malta", type: "country", color: "#ffb347", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2500, oil: 3, steel: 12, fighters: 0, food: 80 },
    "MMR": { name: "Myanmar", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2800, oil: 30, steel: 45, fighters: 0, food: 300 },
    "LAO": { name: "Laos", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 8, steel: 15, fighters: 0, food: 200 },
    "KHM": { name: "Kamboçya", type: "country", color: "#c0392b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 10, steel: 20, fighters: 0, food: 250 },
    "NPL": { name: "Nepal", type: "country", color: "#8e44ad", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1600, oil: 5, steel: 12, fighters: 0, food: 180 },
    "BTN": { name: "Bhutan", type: "country", color: "#f1c40f", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 3, steel: 8, fighters: 0, food: 100 },
    "LKA": { name: "Sri Lanka", type: "country", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600, oil: 12, steel: 25, fighters: 0, food: 220 },
    "KGZ": { name: "Kırgızistan", type: "country", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 8, steel: 18, fighters: 0, food: 150 },
    "TJK": { name: "Tacikistan", type: "country", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1600, oil: 5, steel: 14, fighters: 0, food: 130 },
    "TKM": { name: "Türkmenistan", type: "country", color: "#d4ac0d", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2600, oil: 60, steel: 30, fighters: 0, food: 160 },
    "MNG": { name: "Moğolistan", type: "country", color: "#a04000", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 10, steel: 25, fighters: 0, food: 140 },
    "BHR": { name: "Bahreyn", type: "country", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 3500, oil: 80, steel: 20, fighters: 0, food: 100 },
    "PSE": { name: "Filistin", type: "country", color: "#2c3e50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1200, oil: 3, steel: 10, fighters: 0, food: 120 },
    "PNG": { name: "Papua Yeni Gine", type: "country", color: "#f39c12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 20, steel: 15, fighters: 0, food: 200 },
    "FJI": { name: "Fiji", type: "country", color: "#3498db", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 2000, oil: 5, steel: 10, fighters: 0, food: 150 },
    "SLB": { name: "Solomon Adaları", type: "country", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 4, steel: 8, fighters: 0, food: 120 },
    "VUT": { name: "Vanuatu", type: "country", color: "#9b59b6", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1200, oil: 3, steel: 6, fighters: 0, food: 100 },
    "ESH": { name: "Batı Sahra", type: "country", color: "#FF6B35", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 5, steel: 10, fighters: 0, food: 100 },
    "MRT": { name: "Moritanya", type: "country", color: "#8B4513", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1200, oil: 15, steel: 20, fighters: 0, food: 150 },
    "MLI": { name: "Mali", type: "country", color: "#D4A017", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 900, oil: 8, steel: 15, fighters: 0, food: 180 },
    "NER": { name: "Nijer", type: "country", color: "#E67E22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 12, steel: 12, fighters: 0, food: 160 },
    "TCD": { name: "Çad", type: "country", color: "#2C3E50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 700, oil: 18, steel: 10, fighters: 0, food: 140 },
    "SDN": { name: "Sudan", type: "country", color: "#8E44AD", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1500, oil: 30, steel: 25, fighters: 0, food: 250 },
    "ERI": { name: "Eritre", type: "country", color: "#E74C3C", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 6, steel: 8, fighters: 0, food: 120 },
    "DJI": { name: "Cibuti", type: "country", color: "#1ABC9C", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 4, steel: 10, fighters: 0, food: 80 },
    "SEN": { name: "Senegal", type: "country", color: "#F1C40F", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1100, oil: 10, steel: 18, fighters: 0, food: 200 },
    "BFA": { name: "Burkina Faso", type: "country", color: "#27AE60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 5, steel: 10, fighters: 0, food: 170 },
    "ETH": { name: "Etiyopya", type: "country", color: "#F39C12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 20, steel: 30, fighters: 0, food: 300 },
    "SOM": { name: "Somali", type: "country", color: "#3498DB", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 8, steel: 12, fighters: 0, food: 150 },
    
    "DSF": { name: "Çöl Şahinleri", type: "org", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 20, steel: 10, fighters: 0, food: 120 },
    "SCU": { name: "Akrep Birliği", type: "org", color: "#f1c40f", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1200, oil: 35, steel: 15, fighters: 0, food: 80 },
    "DTH": { name: "Ölüm Levhası", type: "org", color: "#2c3e50", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1500, oil: 10, steel: 25, fighters: 0, food: 150 },
    "HKM": { name: "Hindukuş Mücahitleri", type: "org", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1800, oil: 5, steel: 35, fighters: 0, food: 250 },
    "BLR": { name: "Beluç Devrimcileri", type: "org", color: "#d35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 8, steel: 15, fighters: 0, food: 90 },
    "PME": { name: "Pamir Kartalları", type: "org", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 5, steel: 8, fighters: 0, food: 70 },
    "FGL": { name: "Fergana Lejyonu", type: "org", color: "#8e44ad", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 700, oil: 10, steel: 12, fighters: 0, food: 110 },
    "CWV": { name: "Kafkasya Kurtları", type: "org", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 12, steel: 20, fighters: 0, food: 80 },
    "SBE": { name: "Sibirya İmparatorluğu", type: "org", color: "#7f8c8d", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 400, oil: 25, steel: 10, fighters: 0, food: 50 },
    "MIA": { name: "Moro Bağımsızlık Ord.", type: "org", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 5, steel: 12, fighters: 0, food: 180 },
    "PFF": { name: "Papua Özgürlük Cephesi", type: "org", color: "#1abc9c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 300, oil: 8, steel: 5, fighters: 0, food: 120 },
    "GIR": { name: "Yeşil Ada Direnişi", type: "org", color: "#3498db", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1400, oil: 4, steel: 18, fighters: 0, food: 130 },
    "BKS": { name: "Balkan Yılanları", type: "org", color: "#e74c3c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 3, steel: 10, fighters: 0, food: 90 },
    "TER_RUS1": { name: "Rus Kurtları (Kırım)", type: "org", color: "#C0392B", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 10, steel: 20, fighters: 0, food: 60 },
    "TER_RUS2": { name: "Rus Kurtları (Sibirya)", type: "org", color: "#C0392B", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 400, oil: 8, steel: 15, fighters: 0, food: 50 },
    "TER_RUS3": { name: "Rus Kurtları (Uzak Doğu)", type: "org", color: "#C0392B", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 400, oil: 8, steel: 15, fighters: 0, food: 50 },
    "TER_CHN1": { name: "Çin Kaplanları (Doğu)", type: "org", color: "#D35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 15, steel: 25, fighters: 0, food: 80 },
    "TER_CHN2": { name: "Çin Kaplanları (Batı)", type: "org", color: "#D35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 15, steel: 25, fighters: 0, food: 80 },
    "TER_CHN3": { name: "Çin Kaplanları (Güney)", type: "org", color: "#D35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 15, steel: 25, fighters: 0, food: 80 },
    "TER_AUS1": { name: "Avustralya Yılanları (Kuzey)", type: "org", color: "#16A085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 12, steel: 20, fighters: 0, food: 70 },
    "TER_AUS2": { name: "Avustralya Yılanları (Doğu)", type: "org", color: "#16A085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 12, steel: 20, fighters: 0, food: 70 },
    "TER_AUS3": { name: "Avustralya Yılanları (Batı)", type: "org", color: "#16A085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 12, steel: 20, fighters: 0, food: 70 },
    "TER_CAUC": { name: "Kafkasya Ejderleri", type: "org", color: "#8E44AD", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 450, oil: 10, steel: 18, fighters: 0, food: 50 },
    "TER_CAS1": { name: "Orta Asya Çakalları (Kuzey)", type: "org", color: "#F39C12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 400, oil: 8, steel: 15, fighters: 0, food: 60 },
    "TER_CAS2": { name: "Orta Asya Çakalları (Güney)", type: "org", color: "#F39C12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 400, oil: 8, steel: 15, fighters: 0, food: 60 },
    "TER_ME1": { name: "Orta Doğu Aslanları (Irak)", type: "org", color: "#E67E22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 20, steel: 25, fighters: 0, food: 80 },
    "TER_ME2": { name: "Orta Doğu Aslanları (Suriye)", type: "org", color: "#E67E22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 20, steel: 25, fighters: 0, food: 80 },
    "TER_NAF1": { name: "Kuzey Afrika Şahinleri (Batı)", type: "org", color: "#D35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 15, steel: 20, fighters: 0, food: 70 },
    "TER_NAF2": { name: "Kuzey Afrika Şahinleri (Doğu)", type: "org", color: "#D35400", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 15, steel: 20, fighters: 0, food: 70 },
    "TER_OCE1": { name: "Okyanusya Devrimcileri (PNG)", type: "org", color: "#1ABC9C", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 300, oil: 5, steel: 10, fighters: 0, food: 40 },
    "TER_OCE2": { name: "Okyanusya Devrimcileri (Fiji)", type: "org", color: "#1ABC9C", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 300, oil: 5, steel: 10, fighters: 0, food: 40 },
    "TER_OCE3": { name: "Okyanusya Devrimcileri (Solomon)", type: "org", color: "#1ABC9C", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 300, oil: 5, steel: 10, fighters: 0, food: 40 },
    
    "PIR_MED1": { name: "Akdeniz Korsanları (Batı)", type: "org", color: "#007BFF", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 30, steel: 50, fighters: 0, food: 80 },
    "PIR_MED2": { name: "Akdeniz Korsanları (Doğu)", type: "org", color: "#00C8FF", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 30, steel: 50, fighters: 0, food: 80 },
    "PIR_GIB": { name: "Cebelitarık Korsanları", type: "org", color: "#FF5733", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 900, oil: 35, steel: 55, fighters: 0, food: 90 },
    "PIR_BAS": { name: "Basra Korsanları", type: "org", color: "#FFC300", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 1000, oil: 50, steel: 60, fighters: 0, food: 100 },
    "PIR_NSEA": { name: "Kuzey Denizi Korsanları", type: "org", color: "#4CB8C4", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 700, oil: 25, steel: 45, fighters: 0, food: 70 },
    "PIR_BALT": { name: "Baltık Korsanları", type: "org", color: "#6C5B7B", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 700, oil: 20, steel: 40, fighters: 0, food: 65 },
    "PIR_BENG": { name: "Bengal Korsanları", type: "org", color: "#2ECC71", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 30, steel: 50, fighters: 0, food: 80 },
    "PIR_ECHN": { name: "Doğu Çin Denizi Korsanları", type: "org", color: "#E67E22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 900, oil: 35, steel: 55, fighters: 0, food: 90 },
    "PIR_JAP": { name: "Japon Denizi Korsanları", type: "org", color: "#8E44AD", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 900, oil: 35, steel: 55, fighters: 0, food: 90 },
    "PIR_RED1": { name: "Kızıldeniz Korsanları (Kuzey)", type: "org", color: "#c0392b", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 600, oil: 30, steel: 50, fighters: 0, food: 50 },
    "PIR_RED2": { name: "Kızıldeniz Korsanları (Güney)", type: "org", color: "#e74c3c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 25, steel: 50, fighters: 0, food: 40 },
    "PIR_OMAN1": { name: "Umman Korsanları (Doğu)", type: "org", color: "#f39c12", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 700, oil: 20, steel: 50, fighters: 0, food: 60 },
    "PIR_OMAN2": { name: "Umman Korsanları (Batı)", type: "org", color: "#e67e22", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 650, oil: 22, steel: 50, fighters: 0, food: 55 },
    "PIR_ARAB1": { name: "Arap Denizi Korsanları (Kuzey)", type: "org", color: "#2980b9", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 800, oil: 35, steel: 50, fighters: 0, food: 70 },
    "PIR_ARAB2": { name: "Arap Denizi Korsanları (Güney)", type: "org", color: "#3498db", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 750, oil: 30, steel: 50, fighters: 0, food: 65 },
    "PIR_INDO1": { name: "Endonezya Korsanları (Sumatra)", type: "org", color: "#27ae60", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 15, steel: 50, fighters: 0, food: 30 },
    "PIR_INDO2": { name: "Endonezya Korsanları (Cava)", type: "org", color: "#2ecc71", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 18, steel: 50, fighters: 0, food: 35 },
    "PIR_INDO3": { name: "Endonezya Korsanları (Borneo)", type: "org", color: "#1abc9c", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 12, steel: 50, fighters: 0, food: 25 },
    "PIR_INDO4": { name: "Endonezya Korsanları (Papua)", type: "org", color: "#16a085", borderAccess: {}, relations: {}, alliances: {}, treaties: {}, money: 500, oil: 14, steel: 50, fighters: 0, food: 28 },
};

const mapNodes = [
    { id: "baku", name: "Bakü", faction: "AZE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2200000, x: (49.8671 - 49.8671) * 60, y: -(40.4093 - 40.4093) * 60, garrison: 90, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["ganja", "sumgait"] },
    { id: "ganja", name: "Gence", faction: "AZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (46.3606 - 49.8671) * 60, y: -(40.6828 - 40.4093) * 60, garrison: 65, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["baku", "nakhchivan"] },
    { id: "sumgait", name: "Sumgayıt", faction: "AZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 345000, x: (49.6686 - 49.8671) * 60, y: -(40.5897 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["baku"] },
    { id: "lankaran", name: "Lenkeran", faction: "AZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (48.8475 - 49.8671) * 60, y: -(38.7529 - 40.4093) * 60, garrison: 50, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["baku"] },
    { id: "nakhchivan", name: "Nahçıvan", faction: "AZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 95000, x: (45.4122 - 49.8671) * 60, y: -(39.2089 - 40.4093) * 60, garrison: 80, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["ganja"] },

    { id: "ankara", name: "Ankara", faction: "TUR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 5700000, x: (32.8597 - 49.8671) * 60, y: -(39.9334 - 40.4093) * 60, garrison: 95, industry: 90, resourceBonus: { steel: 2 }, refinery: false, neighbors: ["istanbul", "izmir", "trabzon"] },
    { id: "istanbul", name: "İstanbul", faction: "TUR", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 16000000, x: (28.9784 - 49.8671) * 60, y: -(41.0082 - 40.4093) * 60, garrison: 80, industry: 99, resourceBonus: { steel: 1 }, refinery: false, neighbors: ["ankara"] },
    { id: "izmir", name: "İzmir", faction: "TUR", isCapital: false, isSea: false, isCoastal: true, terrain: "PLAIN", pop: 4400000, x: (27.1428 - 49.8671) * 60, y: -(38.4237 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["ankara", "antalya"] },
    { id: "antalya", name: "Antalya", faction: "TUR", isCapital: false, isSea: false, isCoastal: true, terrain: "PLATEAU", pop: 2600000, x: (30.7133 - 49.8671) * 60, y: -(36.8969 - 40.4093) * 60, garrison: 60, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["izmir", "ankara", "kyrenia"] },
    { id: "trabzon", name: "Trabzon", faction: "TUR", isCapital: false, isSea: false, isCoastal: true, terrain: "MOUNTAIN", pop: 810000, x: (39.7168 - 49.8671) * 60, y: -(41.0027 - 40.4093) * 60, garrison: 75, industry: 65, resourceBonus: { steel: 1 }, refinery: false, neighbors: ["ankara"] },

    { id: "moscow", name: "Moskova", faction: "RUS", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 13000000, x: (37.6173 - 49.8671) * 60, y: -(55.7558 - 40.4093) * 60, garrison: 99, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["stpetersburg", "kazan", "novosibirsk"] },
    { id: "stpetersburg", name: "St. Petersburg", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 5600000, x: (30.3351 - 49.8671) * 60, y: -(59.9343 - 40.4093) * 60, garrison: 85, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["moscow"] },
    { id: "novosibirsk", name: "Novosibirsk", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (82.9357 - 49.8671) * 60, y: -(55.0084 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["moscow", "yekaterinburg"] },
    { id: "vladivostok", name: "Vladivostok", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (131.8869 - 49.8671) * 60, y: -(43.1198 - 40.4093) * 60, garrison: 90, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "sochi", name: "Soçi", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 440000, x: (39.7342 - 49.8671) * 60, y: -(43.6028 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kazan", name: "Kazan", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1250000, x: (49.0661 - 49.8671) * 60, y: -(55.8304 - 40.4093) * 60, garrison: 70, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["moscow"] },
    { id: "yekaterinburg", name: "Yekaterinburg", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (60.6057 - 49.8671) * 60, y: -(56.8389 - 40.4093) * 60, garrison: 75, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["novosibirsk"] },
    { id: "crimea", name: "Kırım", faction: "RUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 1900000, x: (34 - 49.8671) * 60, y: -(45 - 40.4093) * 60, garrison: 120, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "murmansk", name: "Murmansk", faction: "RUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 300000, x: (33 - 49.8671) * 60, y: -(68 - 40.4093) * 60, garrison: 80, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "krasnodar", name: "Krasnodar", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 900000, x: (39 - 49.8671) * 60, y: -(45 - 40.4093) * 60, garrison: 100, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "voronezh", name: "Voronezh", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (39 - 49.8671) * 60, y: -(51 - 40.4093) * 60, garrison: 90, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "rostov", name: "Rostov-na-Donu", faction: "RUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1100000, x: (39 - 49.8671) * 60, y: -(47 - 40.4093) * 60, garrison: 95, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "beijing", name: "Pekin", faction: "CHN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 21800000, x: (116.4074 - 49.8671) * 60, y: -(39.9042 - 40.4093) * 60, garrison: 99, industry: 98, resourceBonus: {}, refinery: false, neighbors: ["shanghai", "harbin"] },
    { id: "shanghai", name: "Şanghay", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 28500000, x: (121.4737 - 49.8671) * 60, y: -(31.2304 - 40.4093) * 60, garrison: 85, industry: 100, resourceBonus: {}, refinery: false, neighbors: ["beijing", "guangzhou"] },
    { id: "guangzhou", name: "Guangzhou", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 18600000, x: (113.2644 - 49.8671) * 60, y: -(23.1291 - 40.4093) * 60, garrison: 80, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["shanghai"] },
    { id: "chengdu", name: "Chengdu", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 16500000, x: (104.0668 - 49.8671) * 60, y: -(30.5728 - 40.4093) * 60, garrison: 75, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["xian"] },
    { id: "wuhan", name: "Wuhan", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 11000000, x: (114.3055 - 49.8671) * 60, y: -(30.5928 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["shanghai"] },
    { id: "xian", name: "Xi'an", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 12000000, x: (108.9398 - 49.8671) * 60, y: -(34.3416 - 40.4093) * 60, garrison: 80, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["chengdu", "beijing"] },
    { id: "harbin", name: "Harbin", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 10000000, x: (126.5350 - 49.8671) * 60, y: -(45.8038 - 40.4093) * 60, garrison: 85, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["beijing"] },

    { id: "canberra", name: "Kanberra", faction: "AUS", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 430000, x: (149.1300 - 49.8671) * 60, y: -(-35.2809 - 40.4093) * 60, garrison: 75, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["sydney", "melbourne"] },
    { id: "sydney", name: "Sidney", faction: "AUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 5300000, x: (151.2093 - 49.8671) * 60, y: -(-33.8688 - 40.4093) * 60, garrison: 65, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["canberra", "brisbane"] },
    { id: "melbourne", name: "Melbourne", faction: "AUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 5000000, x: (144.9631 - 49.8671) * 60, y: -(-37.8136 - 40.4093) * 60, garrison: 60, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["canberra"] },
    { id: "brisbane", name: "Brisbane", faction: "AUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2600000, x: (153.0260 - 49.8671) * 60, y: -(-27.4705 - 40.4093) * 60, garrison: 55, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["sydney"] },
    { id: "perth", name: "Perth", faction: "AUS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (115.8605 - 49.8671) * 60, y: -(-31.9505 - 40.4093) * 60, garrison: 70, industry: 90, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "london", name: "Londra", faction: "GBR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9000000, x: (-0.1278 - 49.8671) * 60, y: -(51.5074 - 40.4093) * 60, garrison: 92, industry: 97, resourceBonus: {}, refinery: false, neighbors: ["manchester", "cardiff"] },
    { id: "manchester", name: "Manchester", faction: "GBR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 550000, x: (-2.2426 - 49.8671) * 60, y: -(53.4808 - 40.4093) * 60, garrison: 60, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["london", "edinburgh"] },
    { id: "edinburgh", name: "Edinburgh", faction: "GBR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 480000, x: (-3.1883 - 49.8671) * 60, y: -(55.9533 - 40.4093) * 60, garrison: 65, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["manchester", "belfast"] },
    { id: "cardiff", name: "Cardiff", faction: "GBR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 360000, x: (-3.1791 - 49.8671) * 60, y: -(51.4816 - 40.4093) * 60, garrison: 55, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["london"] },
    { id: "belfast", name: "Belfast", faction: "GBR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 340000, x: (-5.9301 - 49.8671) * 60, y: -(54.5973 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["edinburgh"] },

    { id: "berlin", name: "Berlin", faction: "GER", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3700000, x: (13.4050 - 49.8671) * 60, y: -(52.5200 - 40.4093) * 60, garrison: 88, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["hamburg", "munich", "frankfurt"] },
    { id: "munich", name: "Münih", faction: "GER", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (11.5820 - 49.8671) * 60, y: -(48.1351 - 40.4093) * 60, garrison: 65, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["berlin", "stuttgart"] },
    { id: "hamburg", name: "Hamburg", faction: "GER", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (9.9937 - 49.8671) * 60, y: -(53.5511 - 40.4093) * 60, garrison: 60, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["berlin"] },
    { id: "frankfurt", name: "Frankfurt", faction: "GER", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 760000, x: (8.6821 - 49.8671) * 60, y: -(50.1109 - 40.4093) * 60, garrison: 55, industry: 99, resourceBonus: {}, refinery: false, neighbors: ["berlin", "cologne"] },
    { id: "cologne", name: "Köln", faction: "GER", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1100000, x: (6.9603 - 49.8671) * 60, y: -(50.9375 - 40.4093) * 60, garrison: 60, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["frankfurt"] },

    { id: "paris", name: "Paris", faction: "FRA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2100000, x: (2.3522 - 49.8671) * 60, y: -(48.8566 - 40.4093) * 60, garrison: 92, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["lyon", "marseille"] },
    { id: "marseille", name: "Marsilya", faction: "FRA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 860000, x: (5.3698 - 49.8671) * 60, y: -(43.2965 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["paris", "nice"] },
    { id: "lyon", name: "Lyon", faction: "FRA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 515000, x: (4.8357 - 49.8671) * 60, y: -(45.7640 - 40.4093) * 60, garrison: 60, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["paris", "toulouse"] },
    { id: "toulouse", name: "Toulouse", faction: "FRA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 480000, x: (1.4442 - 49.8671) * 60, y: -(43.6047 - 40.4093) * 60, garrison: 65, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["lyon"] },
    { id: "nice", name: "Nice", faction: "FRA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 340000, x: (7.2620 - 49.8671) * 60, y: -(43.7102 - 40.4093) * 60, garrison: 55, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["marseille"] },

    { id: "rome", name: "Roma", faction: "ITA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2800000, x: (12.4964 - 49.8671) * 60, y: -(41.9028 - 40.4093) * 60, garrison: 85, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["milan", "naples"] },
    { id: "milan", name: "Milano", faction: "ITA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1400000, x: (9.1900 - 49.8671) * 60, y: -(45.4642 - 40.4093) * 60, garrison: 65, industry: 97, resourceBonus: {}, refinery: false, neighbors: ["rome", "turin"] },
    { id: "naples", name: "Napoli", faction: "ITA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 960000, x: (14.2681 - 49.8671) * 60, y: -(40.8518 - 40.4093) * 60, garrison: 60, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["rome"] },
    { id: "turin", name: "Torino", faction: "ITA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 870000, x: (7.6869 - 49.8671) * 60, y: -(45.0703 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["milan"] },
    { id: "palermo", name: "Palermo", faction: "ITA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 660000, x: (13.3615 - 49.8671) * 60, y: -(38.1157 - 40.4093) * 60, garrison: 55, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "athens", name: "Atina", faction: "GRE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 660000, x: (23.7275 - 49.8671) * 60, y: -(37.9838 - 40.4093) * 60, garrison: 88, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["thessaloniki", "patras"] },
    { id: "thessaloniki", name: "Selanik", faction: "GRE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 320000, x: (22.9444 - 49.8671) * 60, y: -(40.6401 - 40.4093) * 60, garrison: 70, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["athens", "larissa"] },
    { id: "patras", name: "Patras", faction: "GRE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (21.7346 - 49.8671) * 60, y: -(38.2466 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["athens"] },
    { id: "heraklion", name: "Kandiye", faction: "GRE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (25.1442 - 49.8671) * 60, y: -(35.3387 - 40.4093) * 60, garrison: 60, industry: 62, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "larissa", name: "Yenişehir", faction: "GRE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 145000, x: (22.4191 - 49.8671) * 60, y: -(39.6390 - 40.4093) * 60, garrison: 65, industry: 58, resourceBonus: {}, refinery: false, neighbors: ["thessaloniki"] },

    { id: "cairo", name: "Kahire", faction: "EGY", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9500000, x: (31.2357 - 49.8671) * 60, y: -(30.0444 - 40.4093) * 60, garrison: 88, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["alexandria", "giza"] },
    { id: "alexandria", name: "İskenderiye", faction: "EGY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 5200000, x: (29.9187 - 49.8671) * 60, y: -(31.2001 - 40.4093) * 60, garrison: 75, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["cairo", "portsaid"] },
    { id: "giza", name: "Gize", faction: "EGY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 4800000, x: (31.2089 - 49.8671) * 60, y: -(30.0131 - 40.4093) * 60, garrison: 65, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["cairo"] },
    { id: "portsaid", name: "Port Said", faction: "EGY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (32.3019 - 49.8671) * 60, y: -(31.2653 - 40.4093) * 60, garrison: 70, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["alexandria"] },
    { id: "luxor", name: "Luksor", faction: "EGY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 420000, x: (32.6396 - 49.8671) * 60, y: -(25.6872 - 40.4093) * 60, garrison: 55, industry: 58, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "madrid", name: "Madrid", faction: "ESP", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3300000, x: (-3.7038 - 49.8671) * 60, y: -(40.4168 - 40.4093) * 60, garrison: 85, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["barcelona", "valencia", "seville"] },
    { id: "barcelona", name: "Barselona", faction: "ESP", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (2.1734 - 49.8671) * 60, y: -(41.3851 - 40.4093) * 60, garrison: 70, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["madrid", "zaragoza"] },
    { id: "valencia", name: "Valensiya", faction: "ESP", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 790000, x: (-0.3763 - 49.8671) * 60, y: -(39.4699 - 40.4093) * 60, garrison: 65, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["madrid"] },
    { id: "seville", name: "Sevilla", faction: "ESP", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 690000, x: (-5.9845 - 49.8671) * 60, y: -(37.3891 - 40.4093) * 60, garrison: 60, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["madrid"] },
    { id: "zaragoza", name: "Zaragoza", faction: "ESP", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 660000, x: (-0.8891 - 49.8671) * 60, y: -(41.6488 - 40.4093) * 60, garrison: 55, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["barcelona"] },

    { id: "tokyo", name: "Tokyo", faction: "JPN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 14000000, x: (139.6503 - 49.8671) * 60, y: -(35.6762 - 40.4093) * 60, garrison: 96, industry: 100, resourceBonus: {}, refinery: false, neighbors: ["osaka", "sapporo"] },
    { id: "osaka", name: "Osaka", faction: "JPN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2700000, x: (135.5022 - 49.8671) * 60, y: -(34.6937 - 40.4093) * 60, garrison: 75, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["tokyo", "kyoto"] },
    { id: "kyoto", name: "Kyoto", faction: "JPN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (135.7681 - 49.8671) * 60, y: -(35.0116 - 40.4093) * 60, garrison: 65, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["osaka"] },
    { id: "sapporo", name: "Sapporo", faction: "JPN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1900000, x: (141.3545 - 49.8671) * 60, y: -(43.0618 - 40.4093) * 60, garrison: 80, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["tokyo"] },
    { id: "fukuoka", name: "Fukuoka", faction: "JPN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (130.4017 - 49.8671) * 60, y: -(33.5904 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "newdelhi", name: "Yeni Delhi", faction: "IND", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 33000000, x: (77.2090 - 49.8671) * 60, y: -(28.6139 - 40.4093) * 60, garrison: 92, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["mumbai", "kolkata", "chennai"] },
    { id: "mumbai", name: "Mumbai", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 21000000, x: (72.8777 - 49.8671) * 60, y: -(19.0760 - 40.4093) * 60, garrison: 80, industry: 97, resourceBonus: {}, refinery: false, neighbors: ["newdelhi"] },
    { id: "bengaluru", name: "Bengaluru", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 13000000, x: (77.5946 - 49.8671) * 60, y: -(12.9716 - 40.4093) * 60, garrison: 70, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["chennai"] },
    { id: "kolkata", name: "Kalküta", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 15000000, x: (88.3639 - 49.8671) * 60, y: -(22.5726 - 40.4093) * 60, garrison: 75, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["newdelhi"] },
    { id: "chennai", name: "Chennai", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 11500000, x: (80.2707 - 49.8671) * 60, y: -(13.0827 - 40.4093) * 60, garrison: 78, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["newdelhi", "bengaluru"] },

    { id: "tehran", name: "Tahran", faction: "IRN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9000000, x: (51.3890 - 49.8671) * 60, y: -(35.6892 - 40.4093) * 60, garrison: 92, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["mashhad", "isfahan", "tabriz"] },
    { id: "mashhad", name: "Meşhed", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3100000, x: (59.6067 - 49.8671) * 60, y: -(36.2972 - 40.4093) * 60, garrison: 80, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["tehran"] },
    { id: "isfahan", name: "İsfahan", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (51.6680 - 49.8671) * 60, y: -(32.6546 - 40.4093) * 60, garrison: 75, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["tehran"] },
    { id: "shiraz", name: "Şiraz", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (52.5837 - 49.8671) * 60, y: -(29.5918 - 40.4093) * 60, garrison: 70, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tabriz", name: "Tebriz", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (46.2731 - 49.8671) * 60, y: -(38.0962 - 40.4093) * 60, garrison: 85, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["tehran"] },

    { id: "riyadh", name: "Riyad", faction: "SAU", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 7700000, x: (46.6753 - 49.8671) * 60, y: -(24.7136 - 40.4093) * 60, garrison: 94, industry: 97, resourceBonus: { oil: 10 }, refinery: false, neighbors: ["jeddah", "dammam"] },
    { id: "jeddah", name: "Cidde", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 4700000, x: (39.1728 - 49.8671) * 60, y: -(21.5433 - 40.4093) * 60, garrison: 80, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["riyadh", "mecca"] },
    { id: "mecca", name: "Mekke", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2100000, x: (39.8579 - 49.8671) * 60, y: -(21.3891 - 40.4093) * 60, garrison: 70, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["jeddah"] },
    { id: "medina", name: "Medine", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (39.5692 - 49.8671) * 60, y: -(24.5247 - 40.4093) * 60, garrison: 65, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dammam", name: "Dammam", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1300000, x: (50.0888 - 49.8671) * 60, y: -(26.4207 - 40.4093) * 60, garrison: 75, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["riyadh"] },

    { id: "kyiv", name: "Kiev", faction: "UKR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2900000, x: (30.5234 - 49.8671) * 60, y: -(50.4501 - 40.4093) * 60, garrison: 88, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["kharkiv", "odesa", "lviv"] },
    { id: "kharkiv", name: "Harkov", faction: "UKR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1400000, x: (36.2304 - 49.8671) * 60, y: -(49.9935 - 40.4093) * 60, garrison: 82, industry: 68, resourceBonus: {}, refinery: false, neighbors: ["kyiv", "dnipro"] },
    { id: "odesa", name: "Odessa", faction: "UKR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (30.7233 - 49.8671) * 60, y: -(46.4825 - 40.4093) * 60, garrison: 72, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["kyiv"] },
    { id: "dnipro", name: "Dnipro", faction: "UKR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 980000, x: (35.0462 - 49.8671) * 60, y: -(48.4647 - 40.4093) * 60, garrison: 68, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["kharkiv"] },
    { id: "lviv", name: "Lviv", faction: "UKR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 720000, x: (24.0297 - 49.8671) * 60, y: -(49.8397 - 40.4093) * 60, garrison: 78, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["kyiv"] },

    { id: "damascus", name: "Şam", faction: "SRY", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2500000, x: (36.2765 - 49.8671) * 60, y: -(33.5138 - 40.4093) * 60, garrison: 78, industry: 52, resourceBonus: {}, refinery: false, neighbors: ["aleppo", "homs"] },
    { id: "aleppo", name: "Halep", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (37.1343 - 49.8671) * 60, y: -(36.2021 - 40.4093) * 60, garrison: 72, industry: 48, resourceBonus: {}, refinery: false, neighbors: ["damascus", "latakia"] },
    { id: "homs", name: "Humus", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 800000, x: (36.7137 - 49.8671) * 60, y: -(34.7324 - 40.4093) * 60, garrison: 62, industry: 42, resourceBonus: {}, refinery: false, neighbors: ["damascus"] },
    { id: "latakia", name: "Lazkiye", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 400000, x: (35.7908 - 49.8671) * 60, y: -(35.5312 - 40.4093) * 60, garrison: 68, industry: 58, resourceBonus: {}, refinery: false, neighbors: ["aleppo"] },
    { id: "hama", name: "Hama", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 350000, x: (36.7578 - 49.8671) * 60, y: -(35.1318 - 40.4093) * 60, garrison: 58, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "jerusalem", name: "Kudüs", faction: "ISR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 950000, x: (35.2137 - 49.8671) * 60, y: -(31.7683 - 40.4093) * 60, garrison: 96, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["telaviv", "beersheba"] },
    { id: "telaviv", name: "Tel Aviv", faction: "ISR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 450000, x: (34.7818 - 49.8671) * 60, y: -(32.0853 - 40.4093) * 60, garrison: 82, industry: 99, resourceBonus: {}, refinery: false, neighbors: ["jerusalem", "haifa"] },
    { id: "haifa", name: "Hayfa", faction: "ISR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 280000, x: (34.9896 - 49.8671) * 60, y: -(32.7940 - 40.4093) * 60, garrison: 78, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["telaviv"] },
    { id: "beersheba", name: "Birüssebi", faction: "ISR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 210000, x: (34.7913 - 49.8671) * 60, y: -(31.2518 - 40.4093) * 60, garrison: 72, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["jerusalem"] },
    { id: "eilat", name: "Eylat", faction: "ISR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 52000, x: (34.9519 - 49.8671) * 60, y: -(29.5577 - 40.4093) * 60, garrison: 68, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "wellington", name: "Wellington", faction: "NZL", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 410000, x: (174.7762 - 49.8671) * 60, y: -(-41.2865 - 40.4093) * 60, garrison: 74, industry: 86, resourceBonus: {}, refinery: false, neighbors: ["auckland", "christchurch"] },
    { id: "auckland", name: "Auckland", faction: "NZL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (174.7633 - 49.8671) * 60, y: -(-36.8485 - 40.4093) * 60, garrison: 62, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["wellington"] },
    { id: "christchurch", name: "Christchurch", faction: "NZL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 380000, x: (172.6362 - 49.8671) * 60, y: -(-43.5321 - 40.4093) * 60, garrison: 58, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["wellington"] },
    { id: "hamilton_nz", name: "Hamilton", faction: "NZL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (175.2793 - 49.8671) * 60, y: -(-37.7870 - 40.4093) * 60, garrison: 50, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dunedin", name: "Dunedin", faction: "NZL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (170.5028 - 49.8671) * 60, y: -(-45.8788 - 40.4093) * 60, garrison: 55, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "lisbon", name: "Lizbon", faction: "PRT", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 505000, x: (-9.1393 - 49.8671) * 60, y: -(38.7223 - 40.4093) * 60, garrison: 80, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["porto", "amadora"] },
    { id: "porto", name: "Porto", faction: "PRT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (-8.6291 - 49.8671) * 60, y: -(41.1579 - 40.4093) * 60, garrison: 65, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["lisbon"] },
    { id: "amadora", name: "Amadora", faction: "PRT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 175000, x: (-9.2243 - 49.8671) * 60, y: -(38.7596 - 40.4093) * 60, garrison: 50, industry: 68, resourceBonus: {}, refinery: false, neighbors: ["lisbon"] },
    { id: "braga", name: "Braga", faction: "PRT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 190000, x: (-8.4201 - 49.8671) * 60, y: -(41.5503 - 40.4093) * 60, garrison: 60, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "funchal", name: "Funchal", faction: "PRT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 110000, x: (-16.9241 - 49.8671) * 60, y: -(32.6669 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "amsterdam", name: "Amsterdam", faction: "NLD", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 870000, x: (4.9041 - 49.8671) * 60, y: -(52.3676 - 40.4093) * 60, garrison: 84, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["rotterdam", "utrecht"] },
    { id: "rotterdam", name: "Rotterdam", faction: "NLD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 650000, x: (4.4777 - 49.8671) * 60, y: -(51.9244 - 40.4093) * 60, garrison: 70, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["amsterdam"] },
    { id: "thehague", name: "Lahey", faction: "NLD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 540000, x: (4.3007 - 49.8671) * 60, y: -(52.0705 - 40.4093) * 60, garrison: 80, industry: 90, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "utrecht", name: "Utrecht", faction: "NLD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 350000, x: (5.1214 - 49.8671) * 60, y: -(52.0907 - 40.4093) * 60, garrison: 60, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["amsterdam"] },
    { id: "eindhoven", name: "Eindhoven", faction: "NLD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 230000, x: (5.4697 - 49.8671) * 60, y: -(51.4416 - 40.4093) * 60, garrison: 55, industry: 92, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "brussels", name: "Brüksel", faction: "BEL", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (4.3517 - 49.8671) * 60, y: -(50.8503 - 40.4093) * 60, garrison: 88, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["antwerp", "liege"] },
    { id: "antwerp", name: "Anvers", faction: "BEL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 520000, x: (4.4025 - 49.8671) * 60, y: -(51.2194 - 40.4093) * 60, garrison: 65, industry: 91, resourceBonus: {}, refinery: false, neighbors: ["brussels"] },
    { id: "ghent", name: "Gent", faction: "BEL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 260000, x: (3.7174 - 49.8671) * 60, y: -(51.0543 - 40.4093) * 60, garrison: 55, industry: 82, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "charleroi", name: "Charleroi", faction: "BEL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (4.4446 - 49.8671) * 60, y: -(50.4108 - 40.4093) * 60, garrison: 60, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "liege", name: "Liege", faction: "BEL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 195000, x: (5.5797 - 49.8671) * 60, y: -(50.6326 - 40.4093) * 60, garrison: 58, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["brussels"] },

    { id: "bern", name: "Bern", faction: "CHE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 133000, x: (7.4474 - 49.8671) * 60, y: -(46.9480 - 40.4093) * 60, garrison: 95, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["zurich", "geneva"] },
    { id: "zurich", name: "Zürih", faction: "CHE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 415000, x: (8.5417 - 49.8671) * 60, y: -(47.3769 - 40.4093) * 60, garrison: 80, industry: 99, resourceBonus: {}, refinery: false, neighbors: ["bern"] },
    { id: "geneva", name: "Cenevre", faction: "CHE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (6.1432 - 49.8671) * 60, y: -(46.2044 - 40.4093) * 60, garrison: 75, industry: 96, resourceBonus: {}, refinery: false, neighbors: ["bern"] },
    { id: "basel", name: "Basel", faction: "CHE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 175000, x: (7.5886 - 49.8671) * 60, y: -(47.5596 - 40.4093) * 60, garrison: 70, industry: 90, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "lausanne", name: "Lozan", faction: "CHE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (6.6323 - 49.8671) * 60, y: -(46.5197 - 40.4093) * 60, garrison: 65, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "vienna", name: "Viyana", faction: "AUT", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1900000, x: (16.3738 - 49.8671) * 60, y: -(48.2082 - 40.4093) * 60, garrison: 86, industry: 93, resourceBonus: {}, refinery: false, neighbors: ["salzburg", "graz"] },
    { id: "salzburg", name: "Salzburg", faction: "AUT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 155000, x: (13.0550 - 49.8671) * 60, y: -(47.8095 - 40.4093) * 60, garrison: 60, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["vienna"] },
    { id: "innsbruck", name: "Innsbruck", faction: "AUT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (11.4041 - 49.8671) * 60, y: -(47.2692 - 40.4093) * 60, garrison: 65, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "graz", name: "Graz", faction: "AUT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 290000, x: (15.4395 - 49.8671) * 60, y: -(47.0707 - 40.4093) * 60, garrison: 55, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["vienna"] },
    { id: "linz", name: "Linz", faction: "AUT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 205000, x: (14.2858 - 49.8671) * 60, y: -(48.3069 - 40.4093) * 60, garrison: 58, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "stockholm", name: "Stokholm", faction: "SWE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 975000, x: (18.0686 - 49.8671) * 60, y: -(59.3293 - 40.4093) * 60, garrison: 90, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["gothenburg", "uppsala"] },
    { id: "gothenburg", name: "Göteborg", faction: "SWE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 580000, x: (11.9746 - 49.8671) * 60, y: -(57.7089 - 40.4093) * 60, garrison: 75, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["stockholm"] },
    { id: "malmo", name: "Malmö", faction: "SWE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 340000, x: (13.0038 - 49.8671) * 60, y: -(55.6050 - 40.4093) * 60, garrison: 60, industry: 84, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "uppsala", name: "Uppsala", faction: "SWE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 230000, x: (17.6389 - 49.8671) * 60, y: -(59.8586 - 40.4093) * 60, garrison: 65, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["stockholm"] },
    { id: "vasteras", name: "Västerås", faction: "SWE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 125000, x: (16.5448 - 49.8671) * 60, y: -(59.6099 - 40.4093) * 60, garrison: 55, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "oslo", name: "Oslo", faction: "NOR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 690000, x: (10.7522 - 49.8671) * 60, y: -(59.9139 - 40.4093) * 60, garrison: 92, industry: 97, resourceBonus: {}, refinery: false, neighbors: ["bergen", "trondheim"] },
    { id: "bergen", name: "Bergen", faction: "NOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 285000, x: (5.3221 - 49.8671) * 60, y: -(60.3913 - 40.4093) * 60, garrison: 70, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["oslo"] },
    { id: "trondheim", name: "Trondheim", faction: "NOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 205000, x: (10.3951 - 49.8671) * 60, y: -(63.4305 - 40.4093) * 60, garrison: 75, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["oslo"] },
    { id: "stavanger", name: "Stavanger", faction: "NOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (5.7331 - 49.8671) * 60, y: -(58.9700 - 40.4093) * 60, garrison: 80, industry: 92, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "drammen", name: "Drammen", faction: "NOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 70000, x: (10.2045 - 49.8671) * 60, y: -(59.7441 - 40.4093) * 60, garrison: 55, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "helsinki", name: "Helsinki", faction: "FIN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 650000, x: (24.9384 - 49.8671) * 60, y: -(60.1699 - 40.4093) * 60, garrison: 94, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["espoo", "tampere"] },
    { id: "espoo", name: "Espoo", faction: "FIN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 290000, x: (24.6559 - 49.8671) * 60, y: -(60.2055 - 40.4093) * 60, garrison: 70, industry: 91, resourceBonus: {}, refinery: false, neighbors: ["helsinki"] },
    { id: "tampere", name: "Tampere", faction: "FIN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (23.7610 - 49.8671) * 60, y: -(61.4978 - 40.4093) * 60, garrison: 65, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["helsinki"] },
    { id: "vantaa", name: "Vantaa", faction: "FIN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 230000, x: (25.0378 - 49.8671) * 60, y: -(60.2934 - 40.4093) * 60, garrison: 60, industry: 82, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "oulu", name: "Oulu", faction: "FIN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 205000, x: (25.4682 - 49.8671) * 60, y: -(65.0124 - 40.4093) * 60, garrison: 75, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "warsaw", name: "Varşova", faction: "POL", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (21.0122 - 49.8671) * 60, y: -(52.2297 - 40.4093) * 60, garrison: 92, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["krakow", "lodz", "poznan"] },
    { id: "krakow", name: "Kraków", faction: "POL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 780000, x: (19.9450 - 49.8671) * 60, y: -(50.0647 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["warsaw"] },
    { id: "lodz", name: "Lodz", faction: "POL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 680000, x: (19.4560 - 49.8671) * 60, y: -(51.7592 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["warsaw"] },
    { id: "wroclaw", name: "Wroclaw", faction: "POL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 640000, x: (17.0385 - 49.8671) * 60, y: -(51.1079 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "poznan", name: "Poznan", faction: "POL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 530000, x: (16.9252 - 49.8671) * 60, y: -(52.4064 - 40.4093) * 60, garrison: 60, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["warsaw"] },

    { id: "bucharest", name: "Bükreş", faction: "ROU", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1880000, x: (26.1025 - 49.8671) * 60, y: -(44.4268 - 40.4093) * 60, garrison: 85, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["clujnapoca", "constanta"] },
    { id: "clujnapoca", name: "Cluj-Napoca", faction: "ROU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 320000, x: (23.6236 - 49.8671) * 60, y: -(46.7712 - 40.4093) * 60, garrison: 60, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["bucharest"] },
    { id: "timisoara", name: "Timișoara", faction: "ROU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 315000, x: (21.2257 - 49.8671) * 60, y: -(45.7537 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "iasi", name: "Yaş", faction: "ROU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (27.6014 - 49.8671) * 60, y: -(47.1585 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "constanta", name: "Köstence", faction: "ROU", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 280000, x: (28.6498 - 49.8671) * 60, y: -(44.1792 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["bucharest"] },

    { id: "budapest", name: "Budapeşte", faction: "HUN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1750000, x: (19.0402 - 49.8671) * 60, y: -(47.4979 - 40.4093) * 60, garrison: 84, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["debrecen", "szeged"] },
    { id: "debrecen", name: "Debrecen", faction: "HUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (21.6273 - 49.8671) * 60, y: -(47.5316 - 40.4093) * 60, garrison: 60, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["budapest"] },
    { id: "szeged", name: "Szeged", faction: "HUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 160000, x: (20.1414 - 49.8671) * 60, y: -(46.2530 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["budapest"] },
    { id: "miskolc", name: "Miskolc", faction: "HUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 155000, x: (20.7784 - 49.8671) * 60, y: -(48.1035 - 40.4093) * 60, garrison: 58, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pecs", name: "Peçuy", faction: "HUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (18.2323 - 49.8671) * 60, y: -(46.0727 - 40.4093) * 60, garrison: 60, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "prague", name: "Prag", faction: "CZE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1300000, x: (14.4378 - 49.8671) * 60, y: -(50.0755 - 40.4093) * 60, garrison: 86, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["brno", "plzen"] },
    { id: "brno", name: "Brno", faction: "CZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 380000, x: (16.6068 - 49.8671) * 60, y: -(49.1951 - 40.4093) * 60, garrison: 60, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["prague"] },
    { id: "ostrava", name: "Ostrava", faction: "CZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 280000, x: (18.2625 - 49.8671) * 60, y: -(49.8209 - 40.4093) * 60, garrison: 65, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "plzen", name: "Pilsen", faction: "CZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (13.3736 - 49.8671) * 60, y: -(49.7384 - 40.4093) * 60, garrison: 55, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["prague"] },
    { id: "liberec", name: "Liberec", faction: "CZE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (15.0543 - 49.8671) * 60, y: -(50.7663 - 40.4093) * 60, garrison: 50, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "seoul", name: "Seul", faction: "KOR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9900000, x: (126.9780 - 49.8671) * 60, y: -(37.5665 - 40.4093) * 60, garrison: 95, industry: 98, resourceBonus: {}, refinery: false, neighbors: ["busan", "incheon"] },
    { id: "busan", name: "Busan", faction: "KOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3400000, x: (129.0756 - 49.8671) * 60, y: -(35.1796 - 40.4093) * 60, garrison: 80, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["seoul"] },
    { id: "incheon", name: "Incheon", faction: "KOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2900000, x: (126.7052 - 49.8671) * 60, y: -(37.4563 - 40.4093) * 60, garrison: 85, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["seoul"] },
    { id: "daegu", name: "Daegu", faction: "KOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2400000, x: (128.6014 - 49.8671) * 60, y: -(35.8714 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "daejeon", name: "Daejeon", faction: "KOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (127.3845 - 49.8671) * 60, y: -(36.3504 - 40.4093) * 60, garrison: 75, industry: 84, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "pyongyang", name: "Pyongyang", faction: "PRK", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2800000, x: (125.7625 - 49.8671) * 60, y: -(39.0392 - 40.4093) * 60, garrison: 98, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["hamhung", "nampo"] },
    { id: "hamhung", name: "Hamhung", faction: "PRK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 760000, x: (127.5358 - 49.8671) * 60, y: -(39.9183 - 40.4093) * 60, garrison: 80, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["pyongyang"] },
    { id: "chongjin", name: "Chongjin", faction: "PRK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 620000, x: (129.7731 - 49.8671) * 60, y: -(41.7889 - 40.4093) * 60, garrison: 85, industry: 38, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "nampo", name: "Nampo", faction: "PRK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 360000, x: (125.4078 - 49.8671) * 60, y: -(38.7322 - 40.4093) * 60, garrison: 75, industry: 42, resourceBonus: {}, refinery: false, neighbors: ["pyongyang"] },
    { id: "wonsan", name: "Wonsan", faction: "PRK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (127.4436 - 49.8671) * 60, y: -(39.1539 - 40.4093) * 60, garrison: 80, industry: 35, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "jakarta", name: "Cakarta", faction: "IDN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 10500000, x: (106.8456 - 49.8671) * 60, y: -(-6.2088 - 40.4093) * 60, garrison: 80, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["surabaya", "bandung"] },
    { id: "surabaya", name: "Surabaya", faction: "IDN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2900000, x: (112.7521 - 49.8671) * 60, y: -(-7.2575 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["jakarta"] },
    { id: "bandung", name: "Bandung", faction: "IDN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2500000, x: (107.6191 - 49.8671) * 60, y: -(-6.9175 - 40.4093) * 60, garrison: 65, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["jakarta"] },
    { id: "medan", name: "Medan", faction: "IDN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2300000, x: (98.6722 - 49.8671) * 60, y: -(3.5952 - 40.4093) * 60, garrison: 75, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "semarang", name: "Semarang", faction: "IDN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (110.4167 - 49.8671) * 60, y: -(-6.9667 - 40.4093) * 60, garrison: 60, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "kualalumpur", name: "Kuala Lumpur", faction: "MYS", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (101.6869 - 49.8671) * 60, y: -(3.1390 - 40.4093) * 60, garrison: 82, industry: 91, resourceBonus: {}, refinery: false, neighbors: ["georgetown", "johorbahru"] },
    { id: "georgetown", name: "George Town", faction: "MYS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 708000, x: (100.3288 - 49.8671) * 60, y: -(5.4141 - 40.4093) * 60, garrison: 65, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["kualalumpur"] },
    { id: "johorbahru", name: "Johor Bahru", faction: "MYS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (103.7414 - 49.8671) * 60, y: -(1.4927 - 40.4093) * 60, garrison: 70, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["kualalumpur"] },
    { id: "ipoh", name: "Ipoh", faction: "MYS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 660000, x: (101.0901 - 49.8671) * 60, y: -(4.5975 - 40.4093) * 60, garrison: 55, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kuching", name: "Kuching", faction: "MYS", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (110.3592 - 49.8671) * 60, y: -(1.5533 - 40.4093) * 60, garrison: 60, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "manila", name: "Manila", faction: "PHL", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (120.9842 - 49.8671) * 60, y: -(14.5995 - 40.4093) * 60, garrison: 84, industry: 86, resourceBonus: {}, refinery: false, neighbors: ["quezoncity", "cebucity"] },
    { id: "quezoncity", name: "Quezon City", faction: "PHL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2900000, x: (121.0437 - 49.8671) * 60, y: -(14.6760 - 40.4093) * 60, garrison: 75, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["manila"] },
    { id: "davaocity", name: "Davao City", faction: "PHL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (125.4553 - 49.8671) * 60, y: -(7.1907 - 40.4093) * 60, garrison: 70, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "cebucity", name: "Cebu City", faction: "PHL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 920000, x: (123.8854 - 49.8671) * 60, y: -(10.3157 - 40.4093) * 60, garrison: 65, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["manila"] },
    { id: "zamboangacity", name: "Zamboanga City", faction: "PHL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 860000, x: (122.0797 - 49.8671) * 60, y: -(6.9214 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "hanoi", name: "Hanoi", faction: "VNM", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 8000000, x: (105.8542 - 49.8671) * 60, y: -(21.0285 - 40.4093) * 60, garrison: 90, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["hochiminh", "haiphong"] },
    { id: "hochiminh", name: "Ho Chi Minh", faction: "VNM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9000000, x: (106.6297 - 49.8671) * 60, y: -(10.8231 - 40.4093) * 60, garrison: 80, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["hanoi"] },
    { id: "danang", name: "Da Nang", faction: "VNM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (108.2022 - 49.8671) * 60, y: -(16.0544 - 40.4093) * 60, garrison: 75, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "haiphong", name: "Haiphong", faction: "VNM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (106.6881 - 49.8671) * 60, y: -(20.8449 - 40.4093) * 60, garrison: 70, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["hanoi"] },
    { id: "cantho", name: "Can Tho", faction: "VNM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (105.7469 - 49.8671) * 60, y: -(10.0452 - 40.4093) * 60, garrison: 65, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "bangkok", name: "Bangkok", faction: "THA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 8300000, x: (100.5018 - 49.8671) * 60, y: -(13.7563 - 40.4093) * 60, garrison: 85, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["chiangmai", "hatyai"] },
    { id: "nonthaburi", name: "Nonthaburi", faction: "THA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 260000, x: (100.5217 - 49.8671) * 60, y: -(13.8591 - 40.4093) * 60, garrison: 60, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "chiangmai", name: "Chiang Mai", faction: "THA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (98.9853 - 49.8671) * 60, y: -(18.7883 - 40.4093) * 60, garrison: 65, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["bangkok"] },
    { id: "hatyai", name: "Hat Yai", faction: "THA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 160000, x: (100.4747 - 49.8671) * 60, y: -(7.0084 - 40.4093) * 60, garrison: 55, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["bangkok"] },
    { id: "korat", name: "Nakhon Ratchasima", faction: "THA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (102.0977 - 49.8671) * 60, y: -(14.9799 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "islamabad", name: "İslamabad", faction: "PAK", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (73.0479 - 49.8671) * 60, y: -(33.6844 - 40.4093) * 60, garrison: 88, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["karachi", "lahore"] },
    { id: "karachi", name: "Karaçi", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 15000000, x: (67.0011 - 49.8671) * 60, y: -(24.8607 - 40.4093) * 60, garrison: 75, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["islamabad"] },
    { id: "lahore", name: "Laor", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 11000000, x: (74.3587 - 49.8671) * 60, y: -(31.5204 - 40.4093) * 60, garrison: 80, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["islamabad"] },
    { id: "faisalabad", name: "Faysalabad", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3200000, x: (73.1350 - 49.8671) * 60, y: -(31.4504 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "rawalpindi", name: "Rawalpindi", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2100000, x: (73.0169 - 49.8671) * 60, y: -(33.5651 - 40.4093) * 60, garrison: 78, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "dhaka", name: "Dakka", faction: "BGD", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 8900000, x: (90.4125 - 49.8671) * 60, y: -(23.8103 - 40.4093) * 60, garrison: 78, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["chittagong", "khulna"] },
    { id: "chittagong", name: "Chittagong", faction: "BGD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2600000, x: (91.7832 - 49.8671) * 60, y: -(22.3569 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["dhaka"] },
    { id: "khulna", name: "Khulna", faction: "BGD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 660000, x: (89.5403 - 49.8671) * 60, y: -(22.8456 - 40.4093) * 60, garrison: 55, industry: 68, resourceBonus: {}, refinery: false, neighbors: ["dhaka"] },
    { id: "rajshahi", name: "Rajshahi", faction: "BGD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 450000, x: (88.6241 - 49.8671) * 60, y: -(24.3636 - 40.4093) * 60, garrison: 60, industry: 64, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "sylhet", name: "Sylhet", faction: "BGD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 530000, x: (91.8687 - 49.8671) * 60, y: -(24.8949 - 40.4093) * 60, garrison: 58, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "astana", name: "Astana", faction: "KAZ", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (71.4491 - 49.8671) * 60, y: -(51.1694 - 40.4093) * 60, garrison: 88, industry: 86, resourceBonus: {}, refinery: false, neighbors: ["almaty", "shymkent"] },
    { id: "almaty", name: "Almati", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (76.8512 - 49.8671) * 60, y: -(43.2220 - 40.4093) * 60, garrison: 75, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["astana"] },
    { id: "shymkent", name: "Çimkent", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (69.5901 - 49.8671) * 60, y: -(42.3249 - 40.4093) * 60, garrison: 70, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["astana"] },
    { id: "karaganda", name: "Karagandı", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (73.1094 - 49.8671) * 60, y: -(49.8047 - 40.4093) * 60, garrison: 65, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "aktobe", name: "Aktöbe", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 510000, x: (57.1670 - 49.8671) * 60, y: -(50.2839 - 40.4093) * 60, garrison: 68, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "tashkent", name: "Taşkent", faction: "UZB", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2500000, x: (69.2401 - 49.8671) * 60, y: -(41.2995 - 40.4093) * 60, garrison: 85, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["samarkand", "namangan"] },
    { id: "samarkand", name: "Semerkant", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 550000, x: (66.9597 - 49.8671) * 60, y: -(39.6542 - 40.4093) * 60, garrison: 65, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["tashkent"] },
    { id: "namangan", name: "Nemengen", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 620000, x: (71.6726 - 49.8671) * 60, y: -(40.9983 - 40.4093) * 60, garrison: 55, industry: 68, resourceBonus: {}, refinery: false, neighbors: ["tashkent"] },
    { id: "andijan", name: "Andican", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 440000, x: (72.3442 - 49.8671) * 60, y: -(40.7821 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bukhara", name: "Buhara", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 280000, x: (64.4286 - 49.8671) * 60, y: -(39.7747 - 40.4093) * 60, garrison: 65, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "baghdad", name: "Bağdat", faction: "IRQ", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 8100000, x: (44.3661 - 49.8671) * 60, y: -(33.3152 - 40.4093) * 60, garrison: 84, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["basra", "mosul"] },
    { id: "basra", name: "Basra", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1400000, x: (47.7835 - 49.8671) * 60, y: -(30.5081 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["baghdad"] },
    { id: "mosul", name: "Musul", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (43.1577 - 49.8671) * 60, y: -(36.3489 - 40.4093) * 60, garrison: 65, industry: 62, resourceBonus: {}, refinery: false, neighbors: ["baghdad", "erbil"] },
    { id: "erbil", name: "Erbil", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 880000, x: (44.0089 - 49.8671) * 60, y: -(36.1901 - 40.4093) * 60, garrison: 75, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["mosul"] },
    { id: "sulaymaniyah", name: "Süleymaniye", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 750000, x: (45.4381 - 49.8671) * 60, y: -(35.5617 - 40.4093) * 60, garrison: 60, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "kuwaitcity", name: "Kuveyt Şehri", faction: "KWT", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3000000, x: (47.9774 - 49.8671) * 60, y: -(29.3759 - 40.4093) * 60, garrison: 82, industry: 96, resourceBonus: { oil: 8 }, refinery: true, neighbors: ["jahra", "hawally"] },
    { id: "jahra", name: "Cehre", faction: "KWT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (47.6581 - 49.8671) * 60, y: -(29.3375 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["kuwaitcity"] },
    { id: "hawally", name: "Havalli", faction: "KWT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 160000, x: (48.0300 - 49.8671) * 60, y: -(29.3381 - 40.4093) * 60, garrison: 55, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["kuwaitcity"] },
    { id: "salmiya", name: "Selmiye", faction: "KWT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (48.0700 - 49.8671) * 60, y: -(29.3320 - 40.4093) * 60, garrison: 50, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "fahaheel", name: "Fehahil", faction: "KWT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 150000, x: (48.1333 - 49.8671) * 60, y: -(29.0833 - 40.4093) * 60, garrison: 58, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "abudhabi", name: "Abu Dabi", faction: "ARE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1500000, x: (54.3773 - 49.8671) * 60, y: -(24.4539 - 40.4093) * 60, garrison: 92, industry: 98, resourceBonus: { oil: 10 }, refinery: true, neighbors: ["dubai", "sharjah"] },
    { id: "dubai", name: "Dubai", faction: "ARE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3300000, x: (55.2708 - 49.8671) * 60, y: -(25.2048 - 40.4093) * 60, garrison: 80, industry: 99, resourceBonus: {}, refinery: false, neighbors: ["abudhabi"] },
    { id: "sharjah", name: "Şarika", faction: "ARE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (55.4209 - 49.8671) * 60, y: -(25.3463 - 40.4093) * 60, garrison: 70, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["abudhabi"] },
    { id: "alain", name: "El Ayn", faction: "ARE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 760000, x: (55.8023 - 49.8671) * 60, y: -(24.1302 - 40.4093) * 60, garrison: 75, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ajman", name: "Acman", faction: "ARE", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 400000, x: (55.4880 - 49.8671) * 60, y: -(25.4111 - 40.4093) * 60, garrison: 60, industry: 76, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "doha", name: "Doha", faction: "QAT", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1300000, x: (51.5310 - 49.8671) * 60, y: -(25.2854 - 40.4093) * 60, garrison: 90, industry: 99, resourceBonus: { oil: 12 }, refinery: true, neighbors: ["alwakrah", "alkhor"] },
    { id: "alwakrah", name: "Vakra", faction: "QAT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 90000, x: (51.6048 - 49.8671) * 60, y: -(25.1768 - 40.4093) * 60, garrison: 65, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["doha"] },
    { id: "alkhor", name: "Hor", faction: "QAT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (51.5058 - 49.8671) * 60, y: -(25.6839 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["doha"] },
    { id: "madinatashshamal", name: "Şemal", faction: "QAT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 10000, x: (51.2222 - 49.8671) * 60, y: -(26.1153 - 40.4093) * 60, garrison: 60, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "alrayyan", name: "Reyyan", faction: "QAT", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (51.4244 - 49.8671) * 60, y: -(25.2919 - 40.4093) * 60, garrison: 75, industry: 88, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "muscat", name: "Maskat", faction: "OMN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1400000, x: (58.4059 - 49.8671) * 60, y: -(23.5859 - 40.4093) * 60, garrison: 85, industry: 88, resourceBonus: { oil: 6 }, refinery: false, neighbors: ["sohar", "salalah"] },
    { id: "salalah", name: "Salale", faction: "OMN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 340000, x: (54.0924 - 49.8671) * 60, y: -(17.0151 - 40.4093) * 60, garrison: 70, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["muscat"] },
    { id: "sohar", name: "Suhar", faction: "OMN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 220000, x: (56.7321 - 49.8671) * 60, y: -(24.3461 - 40.4093) * 60, garrison: 65, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["muscat"] },
    { id: "nizwa", name: "Nizva", faction: "OMN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (57.5333 - 49.8671) * 60, y: -(22.9333 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "sur_omn", name: "Sur", faction: "OMN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 120000, x: (59.5289 - 49.8671) * 60, y: -(22.5667 - 40.4093) * 60, garrison: 65, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "sanaa", name: "Sana", faction: "YEM", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2500000, x: (44.1910 - 49.8671) * 60, y: -(15.3694 - 40.4093) * 60, garrison: 80, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["aden", "taiz"] },
    { id: "aden", name: "Aden", faction: "YEM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 860000, x: (45.0186 - 49.8671) * 60, y: -(12.7855 - 40.4093) * 60, garrison: 75, industry: 58, resourceBonus: {}, refinery: false, neighbors: ["sanaa"] },
    { id: "taiz", name: "Taiz", faction: "YEM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (44.0207 - 49.8671) * 60, y: -(13.5795 - 40.4093) * 60, garrison: 60, industry: 42, resourceBonus: {}, refinery: false, neighbors: ["sanaa"] },
    { id: "alhudaydah", name: "Hudeyde", faction: "YEM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 550000, x: (42.9530 - 49.8671) * 60, y: -(14.7979 - 40.4093) * 60, garrison: 65, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "mukalla", name: "Mukelle", faction: "YEM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (49.1242 - 49.8671) * 60, y: -(14.5425 - 40.4093) * 60, garrison: 55, industry: 52, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "amman", name: "Amman", faction: "JOR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 4000000, x: (35.9284 - 49.8671) * 60, y: -(31.9454 - 40.4093) * 60, garrison: 88, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["zarqa", "irbid"] },
    { id: "zarqa", name: "Zerka", faction: "JOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 630000, x: (36.1284 - 49.8671) * 60, y: -(32.0608 - 40.4093) * 60, garrison: 70, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["amman"] },
    { id: "irbid", name: "İrbid", faction: "JOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (35.8514 - 49.8671) * 60, y: -(32.5514 - 40.4093) * 60, garrison: 65, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["amman"] },
    { id: "aqaba", name: "Akabe", faction: "JOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 150000, x: (35.0078 - 49.8671) * 60, y: -(29.5319 - 40.4093) * 60, garrison: 75, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "salt", name: "Salt", faction: "JOR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (35.7272 - 49.8671) * 60, y: -(32.0392 - 40.4093) * 60, garrison: 60, industry: 66, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "beirut", name: "Beyrut", faction: "LBN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2200000, x: (35.5018 - 49.8671) * 60, y: -(33.8938 - 40.4093) * 60, garrison: 76, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["tripoli_lbn", "sidon"] },
    { id: "tripoli_lbn", name: "Trablusşam", faction: "LBN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (35.8497 - 49.8671) * 60, y: -(34.4367 - 40.4093) * 60, garrison: 65, industry: 62, resourceBonus: {}, refinery: false, neighbors: ["beirut"] },
    { id: "sidon", name: "Sayda", faction: "LBN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (35.3689 - 49.8671) * 60, y: -(33.5631 - 40.4093) * 60, garrison: 60, industry: 64, resourceBonus: {}, refinery: false, neighbors: ["beirut"] },
    { id: "tyre", name: "Sur", faction: "LBN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 160000, x: (35.1964 - 49.8671) * 60, y: -(33.2708 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "baalbek", name: "Baalbek", faction: "LBN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (36.2181 - 49.8671) * 60, y: -(34.0058 - 40.4093) * 60, garrison: 58, industry: 54, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "rabat", name: "Rabat", faction: "MAR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 580000, x: (-6.8416 - 49.8671) * 60, y: -(34.0209 - 40.4093) * 60, garrison: 85, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["casablanca", "tangier"] },
    { id: "casablanca", name: "Kazablanka", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3400000, x: (-7.5898 - 49.8671) * 60, y: -(33.5731 - 40.4093) * 60, garrison: 70, industry: 92, resourceBonus: {}, refinery: false, neighbors: ["rabat"] },
    { id: "marrakesh", name: "Marakeş", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 920000, x: (-7.9811 - 49.8671) * 60, y: -(31.6295 - 40.4093) * 60, garrison: 65, industry: 86, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "fez", name: "Fes", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1100000, x: (-5.0003 - 49.8671) * 60, y: -(34.0331 - 40.4093) * 60, garrison: 60, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tangier", name: "Tanca", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 950000, x: (-5.8340 - 49.8671) * 60, y: -(35.7595 - 40.4093) * 60, garrison: 75, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["rabat"] },

    { id: "algiers", name: "Cezayir Şehri", faction: "DZA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3400000, x: (3.0420 - 49.8671) * 60, y: -(36.7525 - 40.4093) * 60, garrison: 88, industry: 82, resourceBonus: { oil: 5 }, refinery: false, neighbors: ["oran", "constantine"] },
    { id: "oran", name: "Vahran", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 850000, x: (-0.6349 - 49.8671) * 60, y: -(35.6987 - 40.4093) * 60, garrison: 70, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["algiers"] },
    { id: "constantine", name: "Karandil", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 450000, x: (6.6147 - 49.8671) * 60, y: -(36.3650 - 40.4093) * 60, garrison: 65, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["algiers"] },
    { id: "annaba", name: "Anaba", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 260000, x: (7.7667 - 49.8671) * 60, y: -(36.9000 - 40.4093) * 60, garrison: 60, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "blida", name: "Blida", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (2.8300 - 49.8671) * 60, y: -(36.4700 - 40.4093) * 60, garrison: 62, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "tunis", name: "Tunus Şehri", faction: "TUN", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (10.1815 - 49.8671) * 60, y: -(36.8065 - 40.4093) * 60, garrison: 84, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["sfax", "sousse"] },
    { id: "sfax", name: "Sfakya", faction: "TUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (10.7600 - 49.8671) * 60, y: -(34.7400 - 40.4093) * 60, garrison: 65, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["tunis"] },
    { id: "sousse", name: "Susa", faction: "TUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 270000, x: (10.6369 - 49.8671) * 60, y: -(35.8256 - 40.4093) * 60, garrison: 60, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["tunis"] },
    { id: "kairouan", name: "Kayrevan", faction: "TUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 190000, x: (10.0963 - 49.8671) * 60, y: -(35.6781 - 40.4093) * 60, garrison: 55, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bizerte", name: "Benzert", faction: "TUN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (9.8739 - 49.8671) * 60, y: -(37.2744 - 40.4093) * 60, garrison: 60, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "tripoli_lby", name: "Trablusgarp", faction: "LBY", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (13.1913 - 49.8671) * 60, y: -(32.8872 - 40.4093) * 60, garrison: 82, industry: 75, resourceBonus: { oil: 8 }, refinery: false, neighbors: ["benghazi", "misrata"] },
    { id: "benghazi", name: "Bingazi", faction: "LBY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 630000, x: (20.0667 - 49.8671) * 60, y: -(32.1167 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["tripoli_lby"] },
    { id: "misrata", name: "Misrata", faction: "LBY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (15.0925 - 49.8671) * 60, y: -(32.3754 - 40.4093) * 60, garrison: 70, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["tripoli_lby"] },
    { id: "bayda", name: "Beyda", faction: "LBY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (21.7550 - 49.8671) * 60, y: -(32.7628 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "khoms", name: "Hums", faction: "LBY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (14.2619 - 49.8671) * 60, y: -(32.6486 - 40.4093) * 60, garrison: 55, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "tbilisi", name: "Tiflis", faction: "GEO", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1100000, x: (44.8271 - 49.8671) * 60, y: -(41.7151 - 40.4093) * 60, garrison: 84, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["batumi", "kutaisi"] },
    { id: "batumi", name: "Batum", faction: "GEO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (41.6367 - 49.8671) * 60, y: -(41.6168 - 40.4093) * 60, garrison: 70, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["tbilisi"] },
    { id: "kutaisi", name: "Kutais", faction: "GEO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 150000, x: (42.7180 - 49.8671) * 60, y: -(42.2662 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["tbilisi"] },
    { id: "rustavi", name: "Rustavi", faction: "GEO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (45.0007 - 49.8671) * 60, y: -(41.5494 - 40.4093) * 60, garrison: 65, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "zugdidi", name: "Zugdidi", faction: "GEO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (41.8649 - 49.8671) * 60, y: -(42.5088 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "yerevan", name: "Erivan", faction: "ARM", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (44.5152 - 49.8671) * 60, y: -(40.1792 - 40.4093) * 60, garrison: 86, industry: 74, resourceBonus: {}, refinery: false, neighbors: ["gyumri", "vanadzor"] },
    { id: "gyumri", name: "Gümrü", faction: "ARM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 110000, x: (43.8310 - 49.8671) * 60, y: -(40.7829 - 40.4093) * 60, garrison: 75, industry: 62, resourceBonus: {}, refinery: false, neighbors: ["yerevan"] },
    { id: "vanadzor", name: "Vanadzor", faction: "ARM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (44.4949 - 49.8671) * 60, y: -(40.8074 - 40.4093) * 60, garrison: 60, industry: 58, resourceBonus: {}, refinery: false, neighbors: ["yerevan"] },
    { id: "vagharshapat", name: "Eçmiyazin", faction: "ARM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 45000, x: (44.2942 - 49.8671) * 60, y: -(40.1633 - 40.4093) * 60, garrison: 65, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hrazdan", name: "Hrazdan", faction: "ARM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (44.7667 - 49.8671) * 60, y: -(40.5000 - 40.4093) * 60, garrison: 58, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "dublin", name: "Dublin", faction: "IRL", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 550000, x: (-6.2603 - 49.8671) * 60, y: -(53.3498 - 40.4093) * 60, garrison: 80, industry: 94, resourceBonus: {}, refinery: false, neighbors: ["cork", "limerick"] },
    { id: "cork", name: "Cork", faction: "IRL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 125000, x: (-8.4756 - 49.8671) * 60, y: -(51.8985 - 40.4093) * 60, garrison: 60, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["dublin"] },
    { id: "limerick", name: "Limerick", faction: "IRL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 95000, x: (-8.6268 - 49.8671) * 60, y: -(52.6638 - 40.4093) * 60, garrison: 55, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["dublin"] },
    { id: "galway", name: "Galway", faction: "IRL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (-9.0489 - 49.8671) * 60, y: -(53.2719 - 40.4093) * 60, garrison: 50, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "waterford", name: "Waterford", faction: "IRL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 50000, x: (-7.1101 - 49.8671) * 60, y: -(52.2593 - 40.4093) * 60, garrison: 55, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "copenhagen", name: "Kopenhag", faction: "DNK", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (12.5683 - 49.8671) * 60, y: -(55.6761 - 40.4093) * 60, garrison: 88, industry: 95, resourceBonus: {}, refinery: false, neighbors: ["aarhus", "odense"] },
    { id: "aarhus", name: "Aarhus", faction: "DNK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 280000, x: (10.2108 - 49.8671) * 60, y: -(56.1572 - 40.4093) * 60, garrison: 65, industry: 88, resourceBonus: {}, refinery: false, neighbors: ["copenhagen"] },
    { id: "odense", name: "Odense", faction: "DNK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 180000, x: (10.4024 - 49.8671) * 60, y: -(55.4038 - 40.4093) * 60, garrison: 60, industry: 84, resourceBonus: {}, refinery: false, neighbors: ["copenhagen"] },
    { id: "aalborg", name: "Aalborg", faction: "DNK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 120000, x: (9.9217 - 49.8671) * 60, y: -(57.0488 - 40.4093) * 60, garrison: 65, industry: 82, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "esbjerg", name: "Esbjerg", faction: "DNK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 72000, x: (8.4516 - 49.8671) * 60, y: -(55.4765 - 40.4093) * 60, garrison: 55, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "zagreb", name: "Zagreb", faction: "HRV", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 800000, x: (15.9819 - 49.8671) * 60, y: -(45.8150 - 40.4093) * 60, garrison: 85, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["split", "rijeka"] },
    { id: "split", name: "Split", faction: "HRV", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 180000, x: (16.4435 - 49.8671) * 60, y: -(43.5147 - 40.4093) * 60, garrison: 65, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["zagreb"] },
    { id: "rijeka", name: "Rijeka", faction: "HRV", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 130000, x: (14.4422 - 49.8671) * 60, y: -(45.3271 - 40.4093) * 60, garrison: 60, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["zagreb"] },
    { id: "osijek", name: "Osijek", faction: "HRV", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (18.6955 - 49.8671) * 60, y: -(45.5550 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "zadar", name: "Zadar", faction: "HRV", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 75000, x: (15.2314 - 49.8671) * 60, y: -(44.1194 - 40.4093) * 60, garrison: 60, industry: 74, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "belgrade", name: "Belgrad", faction: "SRB", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (20.4489 - 49.8671) * 60, y: -(44.7866 - 40.4093) * 60, garrison: 88, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["novisad", "nis"] },
    { id: "novisad", name: "Novi Sad", faction: "SRB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (19.8335 - 49.8671) * 60, y: -(45.2671 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["belgrade"] },
    { id: "nis", name: "Niş", faction: "SRB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 180000, x: (21.8954 - 49.8671) * 60, y: -(43.3209 - 40.4093) * 60, garrison: 70, industry: 72, resourceBonus: {}, refinery: false, neighbors: ["belgrade"] },
    { id: "kragujevac", name: "Kragujevac", faction: "SRB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 150000, x: (20.9114 - 49.8671) * 60, y: -(44.0128 - 40.4093) * 60, garrison: 60, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "subotica", name: "Subotica", faction: "SRB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (19.6651 - 49.8671) * 60, y: -(46.1005 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "sofia", name: "Sofya", faction: "BGR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (23.3219 - 49.8671) * 60, y: -(42.6977 - 40.4093) * 60, garrison: 86, industry: 82, resourceBonus: {}, refinery: false, neighbors: ["plovdiv", "varna"] },
    { id: "plovdiv", name: "Filibe", faction: "BGR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 350000, x: (24.7453 - 49.8671) * 60, y: -(42.1354 - 40.4093) * 60, garrison: 65, industry: 76, resourceBonus: {}, refinery: false, neighbors: ["sofia"] },
    { id: "varna", name: "Varna", faction: "BGR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (27.9147 - 49.8671) * 60, y: -(43.2141 - 40.4093) * 60, garrison: 70, industry: 78, resourceBonus: {}, refinery: false, neighbors: ["sofia", "burgas"] },
    { id: "burgas", name: "Burgaz", faction: "BGR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (27.4626 - 49.8671) * 60, y: -(42.5048 - 40.4093) * 60, garrison: 68, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["varna"] },
    { id: "ruse", name: "Rusçuk", faction: "BGR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 140000, x: (25.9657 - 49.8671) * 60, y: -(43.8356 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },


    { id: "tirana", name: "Tiran", faction: "ALB", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 420000, x: (19.8220 - 49.8671) * 60, y: -(41.3275 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["durres", "elbasan"] },
    { id: "durres", name: "Dıraç", faction: "ALB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 170000, x: (19.4400 - 49.8671) * 60, y: -(41.3200 - 40.4093) * 60, garrison: 45, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["tirana", "vlore"] },
    { id: "elbasan", name: "Elbasan", faction: "ALB", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 120000, x: (20.0800 - 49.8671) * 60, y: -(41.1100 - 40.4093) * 60, garrison: 40, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["tirana"] },
    { id: "vlore", name: "Vlora", faction: "ALB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 90000, x: (19.4900 - 49.8671) * 60, y: -(40.4700 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["durres"] },
    { id: "shkoder", name: "İşkodra", faction: "ALB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (19.5600 - 49.8671) * 60, y: -(42.0700 - 40.4093) * 60, garrison: 55, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["tirana"] },

    { id: "sarajevo", name: "Sarajevo", faction: "BIH", isCapital: true, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 380000, x: (18.4131 - 49.8671) * 60, y: -(43.8563 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["banjaluka", "zenica", "mostar"] },
    { id: "banjaluka", name: "Banja Luka", faction: "BIH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 180000, x: (17.1900 - 49.8671) * 60, y: -(44.7700 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["sarajevo", "zenica"] },
    { id: "zenica", name: "Zenica", faction: "BIH", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 120000, x: (17.9000 - 49.8671) * 60, y: -(44.2000 - 40.4093) * 60, garrison: 45, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["sarajevo", "banjaluka"] },
    { id: "mostar", name: "Mostar", faction: "BIH", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 110000, x: (17.8100 - 49.8671) * 60, y: -(43.3400 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["sarajevo"] },
    { id: "tuzla", name: "Tuzla", faction: "BIH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 90000, x: (18.6700 - 49.8671) * 60, y: -(44.5400 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["sarajevo", "zenica"] },

    { id: "bratislava", name: "Bratislava", faction: "SVK", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 430000, x: (17.1077 - 49.8671) * 60, y: -(48.1486 - 40.4093) * 60, garrison: 75, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["kosice", "zilina", "nitra"] },
    { id: "kosice", name: "Kosice", faction: "SVK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (21.2500 - 49.8671) * 60, y: -(48.7200 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["bratislava", "zilina"] },
    { id: "zilina", name: "Zilina", faction: "SVK", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 81000, x: (18.7400 - 49.8671) * 60, y: -(49.2200 - 40.4093) * 60, garrison: 50, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["bratislava", "kosice"] },
    { id: "nitra", name: "Nitra", faction: "SVK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 78000, x: (18.0900 - 49.8671) * 60, y: -(48.3100 - 40.4093) * 60, garrison: 45, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["bratislava"] },
    { id: "presov", name: "Presov", faction: "SVK", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 90000, x: (21.2400 - 49.8671) * 60, y: -(49.0000 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["kosice"] },

    { id: "ljubljana", name: "Ljubljana", faction: "SVN", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 280000, x: (14.5058 - 49.8671) * 60, y: -(46.0569 - 40.4093) * 60, garrison: 70, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["maribor", "celje", "kranj"] },
    { id: "maribor", name: "Maribor", faction: "SVN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 95000, x: (15.6500 - 49.8671) * 60, y: -(46.5600 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["ljubljana", "celje"] },
    { id: "celje", name: "Celje", faction: "SVN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 38000, x: (15.2600 - 49.8671) * 60, y: -(46.2300 - 40.4093) * 60, garrison: 45, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["ljubljana", "maribor"] },
    { id: "kranj", name: "Kranj", faction: "SVN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 37000, x: (14.3600 - 49.8671) * 60, y: -(46.2400 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["ljubljana"] },
    { id: "novogorica", name: "Nova Gorica", faction: "SVN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 13000, x: (13.6300 - 49.8671) * 60, y: -(45.9600 - 40.4093) * 60, garrison: 40, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["ljubljana"] },

    { id: "podgorica", name: "Podgorica", faction: "MNE", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 150000, x: (19.2597 - 49.8671) * 60, y: -(42.4400 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["niksic", "bar", "budva"] },
    { id: "niksic", name: "Niksic", faction: "MNE", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 57000, x: (18.9400 - 49.8671) * 60, y: -(42.7700 - 40.4093) * 60, garrison: 55, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["podgorica"] },
    { id: "bar", name: "Bar", faction: "MNE", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 42000, x: (19.0900 - 49.8671) * 60, y: -(42.1000 - 40.4093) * 60, garrison: 50, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["podgorica", "budva"] },
    { id: "budva", name: "Budva", faction: "MNE", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 19000, x: (18.8300 - 49.8671) * 60, y: -(42.2900 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["podgorica", "bar"] },
    { id: "pljevlja", name: "Pljevlja", faction: "MNE", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 21000, x: (19.3600 - 49.8671) * 60, y: -(43.3600 - 40.4093) * 60, garrison: 50, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["podgorica"] },

    { id: "skopje", name: "Üsküp", faction: "MKD", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 540000, x: (21.4333 - 49.8671) * 60, y: -(42.0000 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["bitola", "tetovo", "kumanovo"] },
    { id: "bitola", name: "Manastır", faction: "MKD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (21.3300 - 49.8671) * 60, y: -(41.0300 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["skopje"] },
    { id: "tetovo", name: "Tetovo", faction: "MKD", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 52000, x: (20.9600 - 49.8671) * 60, y: -(42.0100 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["skopje"] },
    { id: "kumanovo", name: "Kumanovo", faction: "MKD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 50000, x: (21.7100 - 49.8671) * 60, y: -(42.1300 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["skopje"] },
    { id: "prilep", name: "Prilep", faction: "MKD", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 66000, x: (21.5400 - 49.8671) * 60, y: -(41.3400 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["bitola"] },

    { id: "chisinau", name: "Kişinev", faction: "MDA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 530000, x: (28.8575 - 49.8671) * 60, y: -(47.0100 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["balti", "tiraspol", "cahul"] },
    { id: "balti", name: "Beltsy", faction: "MDA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (27.9300 - 49.8671) * 60, y: -(47.7600 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["chisinau"] },
    { id: "tiraspol", name: "Tiraspol", faction: "MDA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 135000, x: (29.6300 - 49.8671) * 60, y: -(46.8500 - 40.4093) * 60, garrison: 60, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["chisinau"] },
    { id: "cahul", name: "Cahul", faction: "MDA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 30000, x: (28.1800 - 49.8671) * 60, y: -(45.9000 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["chisinau"] },
    { id: "ungheni", name: "Ungheni", faction: "MDA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 35000, x: (27.8000 - 49.8671) * 60, y: -(47.2000 - 40.4093) * 60, garrison: 40, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["chisinau"] },

    { id: "minsk", name: "Minsk", faction: "BLR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (27.5615 - 49.8671) * 60, y: -(53.9045 - 40.4093) * 60, garrison: 85, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["homel", "brest", "grodno", "vitebsk"] },
    { id: "homel", name: "Gomel", faction: "BLR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 510000, x: (30.9800 - 49.8671) * 60, y: -(52.4400 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["minsk", "brest"] },
    { id: "brest", name: "Brest", faction: "BLR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 340000, x: (23.6800 - 49.8671) * 60, y: -(52.1000 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["minsk", "grodno"] },
    { id: "grodno", name: "Grodno", faction: "BLR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 370000, x: (23.8100 - 49.8671) * 60, y: -(53.6700 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["minsk", "brest"] },
    { id: "vitebsk", name: "Vitebsk", faction: "BLR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 360000, x: (30.2000 - 49.8671) * 60, y: -(55.1800 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["minsk"] },

    { id: "reykjavik", name: "Reykjavik", faction: "ISL", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 120000, x: (-21.9400 - 49.8671) * 60, y: -(64.1500 - 40.4093) * 60, garrison: 50, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["keflavik", "akureyri", "hofn"] },
    { id: "keflavik", name: "Keflavik", faction: "ISL", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 16000, x: (-22.6000 - 49.8671) * 60, y: -(64.0200 - 40.4093) * 60, garrison: 40, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["reykjavik"] },
    { id: "akureyri", name: "Akureyri", faction: "ISL", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 19000, x: (-18.1000 - 49.8671) * 60, y: -(65.6800 - 40.4093) * 60, garrison: 45, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["reykjavik"] },
    { id: "hofn", name: "Hofn", faction: "ISL", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 2000, x: (-15.2000 - 49.8671) * 60, y: -(64.2500 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["reykjavik"] },
    { id: "isafjordur", name: "Isafjordur", faction: "ISL", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 2600, x: (-23.1300 - 49.8671) * 60, y: -(66.0700 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["reykjavik"] },

    { id: "luxembourg", name: "Lüksemburg", faction: "LUX", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 120000, x: (6.1300 - 49.8671) * 60, y: -(49.6100 - 40.4093) * 60, garrison: 70, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["echternach", "diekirch", "esch"] },
    { id: "echternach", name: "Echternach", faction: "LUX", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 5500, x: (6.4200 - 49.8671) * 60, y: -(49.8100 - 40.4093) * 60, garrison: 40, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["luxembourg"] },
    { id: "diekirch", name: "Diekirch", faction: "LUX", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 7000, x: (6.1500 - 49.8671) * 60, y: -(49.8700 - 40.4093) * 60, garrison: 40, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["luxembourg"] },
    { id: "esch", name: "Esch-sur-Alzette", faction: "LUX", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 36000, x: (5.9800 - 49.8671) * 60, y: -(49.4900 - 40.4093) * 60, garrison: 50, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["luxembourg"] },
    { id: "dudelange", name: "Dudelange", faction: "LUX", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 21000, x: (6.0800 - 49.8671) * 60, y: -(49.4800 - 40.4093) * 60, garrison: 45, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["luxembourg"] },

    { id: "nicosia", name: "Lefkoşa", faction: "CYP", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 330000, x: (33.3650 - 49.8671) * 60, y: -(35.1800 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["limassol", "larnaca", "famagusta", "kyrenia"] },
    { id: "limassol", name: "Limasol", faction: "CYP", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 240000, x: (33.0300 - 49.8671) * 60, y: -(34.6800 - 40.4093) * 60, garrison: 60, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["nicosia", "larnaca"] },
    { id: "larnaca", name: "Larnaka", faction: "CYP", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 84000, x: (33.6300 - 49.8671) * 60, y: -(34.9200 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["nicosia", "limassol"] },
    { id: "famagusta", name: "Mağusa", faction: "CYP", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 50000, x: (33.9400 - 49.8671) * 60, y: -(35.1200 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["nicosia", "larnaca"] },
    { id: "kyrenia", name: "Girne", faction: "CYP", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 45000, x: (33.3200 - 49.8671) * 60, y: -(35.3400 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["nicosia"] },

    { id: "valletta", name: "Valletta", faction: "MLT", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 5700, x: (14.7000 - 49.8671) * 60, y: -(35.9000 - 40.4093) * 60, garrison: 40, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["sliema", "mosta", "birkirkara"] },
    { id: "sliema", name: "Sliema", faction: "MLT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 17000, x: (14.5000 - 49.8671) * 60, y: -(36.0000 - 40.4093) * 60, garrison: 35, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["valletta"] },

    { id: "naypyidaw", name: "Naypyidaw", faction: "MMR", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 925000, x: (96.1800 - 49.8671) * 60, y: -(19.7500 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["yangon", "mandalay", "bago"] },
    { id: "yangon", name: "Yangon", faction: "MMR", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 5200000, x: (96.1600 - 49.8671) * 60, y: -(16.8500 - 40.4093) * 60, garrison: 80, industry: 90, resourceBonus: {}, refinery: false, neighbors: ["naypyidaw", "bago"] },
    { id: "mandalay", name: "Mandalay", faction: "MMR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1300000, x: (96.0800 - 49.8671) * 60, y: -(21.9600 - 40.4093) * 60, garrison: 70, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["naypyidaw"] },
    { id: "bago", name: "Bago", faction: "MMR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 490000, x: (96.4700 - 49.8671) * 60, y: -(17.3300 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["naypyidaw", "yangon"] },
    { id: "mawlamyine", name: "Mawlamyine", faction: "MMR", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 300000, x: (97.6300 - 49.8671) * 60, y: -(16.4900 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["yangon"] },

    { id: "vientiane", name: "Vientiane", faction: "LAO", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 820000, x: (102.6000 - 49.8671) * 60, y: -(17.9700 - 40.4093) * 60, garrison: 70, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["luangprabang", "pakse", "savannakhet"] },
    { id: "luangprabang", name: "Luang Prabang", faction: "LAO", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 55000, x: (102.2100 - 49.8671) * 60, y: -(19.8800 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["vientiane"] },
    { id: "pakse", name: "Pakse", faction: "LAO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 90000, x: (105.7900 - 49.8671) * 60, y: -(15.1200 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["vientiane"] },
    { id: "savannakhet", name: "Savannakhet", faction: "LAO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 120000, x: (104.7500 - 49.8671) * 60, y: -(16.5500 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["vientiane"] },
    { id: "thakhek", name: "Thakhek", faction: "LAO", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (104.8300 - 49.8671) * 60, y: -(17.4000 - 40.4093) * 60, garrison: 50, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["vientiane"] },

    { id: "phnompenh", name: "Phnom Penh", faction: "KHM", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1600000, x: (104.9200 - 49.8671) * 60, y: -(11.5500 - 40.4093) * 60, garrison: 75, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["siemreap", "battambang", "sihanoukville"] },
    { id: "siemreap", name: "Siem Reap", faction: "KHM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (103.8500 - 49.8671) * 60, y: -(13.3600 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["phnompenh"] },
    { id: "battambang", name: "Battambang", faction: "KHM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (103.2000 - 49.8671) * 60, y: -(13.1000 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["phnompenh"] },
    { id: "sihanoukville", name: "Sihanoukville", faction: "KHM", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 90000, x: (103.9000 - 49.8671) * 60, y: -(10.6200 - 40.4093) * 60, garrison: 50, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["phnompenh"] },
    { id: "kratié", name: "Kratié", faction: "KHM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 38000, x: (106.0400 - 49.8671) * 60, y: -(12.4800 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["phnompenh"] },

    { id: "kathmandu", name: "Katmandu", faction: "NPL", isCapital: true, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 850000, x: (85.3300 - 49.8671) * 60, y: -(27.7100 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["pokhara", "lalitpur", "bhaktapur"] },
    { id: "pokhara", name: "Pokhara", faction: "NPL", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 350000, x: (83.9800 - 49.8671) * 60, y: -(28.2100 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["kathmandu"] },
    { id: "lalitpur", name: "Lalitpur", faction: "NPL", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 230000, x: (85.3200 - 49.8671) * 60, y: -(27.6600 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["kathmandu"] },
    { id: "bhaktapur", name: "Bhaktapur", faction: "NPL", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 80000, x: (85.4300 - 49.8671) * 60, y: -(27.6700 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["kathmandu"] },
    { id: "birgunj", name: "Birgunj", faction: "NPL", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 240000, x: (84.8700 - 49.8671) * 60, y: -(27.0100 - 40.4093) * 60, garrison: 60, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["kathmandu"] },

    { id: "thimphu", name: "Thimphu", faction: "BTN", isCapital: true, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 115000, x: (89.6400 - 49.8671) * 60, y: -(27.4700 - 40.4093) * 60, garrison: 60, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["paro", "punakha", "wangdue"] },
    { id: "paro", name: "Paro", faction: "BTN", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 25000, x: (89.4100 - 49.8671) * 60, y: -(27.4300 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["thimphu"] },
    { id: "punakha", name: "Punakha", faction: "BTN", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 22000, x: (89.8800 - 49.8671) * 60, y: -(27.5900 - 40.4093) * 60, garrison: 45, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["thimphu"] },
    { id: "wangdue", name: "Wangdue Phodrang", faction: "BTN", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 15000, x: (89.8900 - 49.8671) * 60, y: -(27.4900 - 40.4093) * 60, garrison: 40, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["thimphu"] },
    { id: "phuntsholing", name: "Phuntsholing", faction: "BTN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 27000, x: (89.3800 - 49.8671) * 60, y: -(26.8500 - 40.4093) * 60, garrison: 50, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["thimphu"] },

    { id: "colombo", name: "Colombo", faction: "LKA", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 750000, x: (79.8400 - 49.8671) * 60, y: -(6.9300 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: ["kandy", "galle", "jaffna"] },
    { id: "kandy", name: "Kandy", faction: "LKA", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 120000, x: (80.6300 - 49.8671) * 60, y: -(7.2900 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["colombo"] },
    { id: "galle", name: "Galle", faction: "LKA", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 90000, x: (80.2200 - 49.8671) * 60, y: -(6.0500 - 40.4093) * 60, garrison: 50, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["colombo"] },
    { id: "jaffna", name: "Jaffna", faction: "LKA", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 90000, x: (80.0200 - 49.8671) * 60, y: -(9.6600 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["colombo"] },
    { id: "trincomalee", name: "Trincomalee", faction: "LKA", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 50000, x: (81.2200 - 49.8671) * 60, y: -(8.5600 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["colombo"] },

    { id: "bishkek", name: "Bişkek", faction: "KGZ", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (74.5700 - 49.8671) * 60, y: -(42.8700 - 40.4093) * 60, garrison: 75, industry: 75, resourceBonus: {}, refinery: false, neighbors: ["osh", "jalalabad", "karakol"] },
    { id: "osh", name: "Oş", faction: "KGZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (72.8000 - 49.8671) * 60, y: -(40.5300 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["bishkek"] },
    { id: "jalalabad", name: "Celalabad", faction: "KGZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 110000, x: (73.0000 - 49.8671) * 60, y: -(40.9300 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["bishkek"] },
    { id: "karakol", name: "Karakol", faction: "KGZ", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 75000, x: (78.3900 - 49.8671) * 60, y: -(42.4900 - 40.4093) * 60, garrison: 55, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["bishkek"] },
    { id: "tokmok", name: "Tokmok", faction: "KGZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 60000, x: (75.2900 - 49.8671) * 60, y: -(42.8300 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["bishkek"] },

    { id: "dushanbe", name: "Duşanbe", faction: "TJK", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 780000, x: (68.7700 - 49.8671) * 60, y: -(38.5600 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["khujand", "kulob", "kurgan"] },
    { id: "khujand", name: "Hucend", faction: "TJK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (69.6200 - 49.8671) * 60, y: -(40.2800 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["dushanbe"] },
    { id: "kulob", name: "Kulob", faction: "TJK", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 100000, x: (69.7100 - 49.8671) * 60, y: -(37.9000 - 40.4093) * 60, garrison: 55, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["dushanbe"] },
    { id: "kurgan", name: "Kurgan-Tube", faction: "TJK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 75000, x: (68.7800 - 49.8671) * 60, y: -(37.8400 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["dushanbe"] },
    { id: "istravshan", name: "İstravşan", faction: "TJK", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 52000, x: (69.0000 - 49.8671) * 60, y: -(39.9100 - 40.4093) * 60, garrison: 50, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["dushanbe"] },

    { id: "ashgabat", name: "Aşkabat", faction: "TKM", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1000000, x: (58.3800 - 49.8671) * 60, y: -(37.9500 - 40.4093) * 60, garrison: 80, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["turkmenabat", "mary", "balkanabat"] },
    { id: "turkmenabat", name: "Türkmenabat", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (65.4100 - 49.8671) * 60, y: -(39.0900 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["ashgabat"] },
    { id: "mary", name: "Mary", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 120000, x: (61.8500 - 49.8671) * 60, y: -(37.6000 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["ashgabat"] },
    { id: "balkanabat", name: "Balkanabat", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 90000, x: (54.3700 - 49.8671) * 60, y: -(39.5100 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["ashgabat"] },
    { id: "dashoguz", name: "Daşoguz", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 170000, x: (59.7800 - 49.8671) * 60, y: -(41.8300 - 40.4093) * 60, garrison: 60, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["ashgabat"] },

    { id: "ulaanbaatar", name: "Ulan Batur", faction: "MNG", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1400000, x: (106.9200 - 49.8671) * 60, y: -(47.9200 - 40.4093) * 60, garrison: 80, industry: 80, resourceBonus: {}, refinery: false, neighbors: ["darkhan", "erdent", "choibalsan"] },
    { id: "darkhan", name: "Darhan", faction: "MNG", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 75000, x: (105.9200 - 49.8671) * 60, y: -(49.4900 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["ulaanbaatar"] },
    { id: "erdent", name: "Erdenet", faction: "MNG", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 95000, x: (104.0800 - 49.8671) * 60, y: -(49.0400 - 40.4093) * 60, garrison: 55, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["ulaanbaatar"] },
    { id: "choibalsan", name: "Çoybalsan", faction: "MNG", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (114.5400 - 49.8671) * 60, y: -(48.0700 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["ulaanbaatar"] },
    { id: "ovorkhangai", name: "Övörhangay", faction: "MNG", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 30000, x: (102.7300 - 49.8671) * 60, y: -(45.4900 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["ulaanbaatar"] },

    { id: "manama", name: "Manama", faction: "BHR", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (50.5800 - 49.8671) * 60, y: -(26.2200 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: { oil: 5 }, refinery: true, neighbors: ["muharraq", "rifa", "hamad"] },
    { id: "muharraq", name: "Muharraq", faction: "BHR", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 110000, x: (50.6000 - 49.8671) * 60, y: -(26.2600 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["manama"] },
    { id: "rifa", name: "Rifa", faction: "BHR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 80000, x: (50.5500 - 49.8671) * 60, y: -(26.1200 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["manama"] },
    { id: "hamad", name: "Hamad", faction: "BHR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 50000, x: (50.4800 - 49.8671) * 60, y: -(26.1100 - 40.4093) * 60, garrison: 50, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["manama"] },
    { id: "isa", name: "Isa", faction: "BHR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (50.6300 - 49.8671) * 60, y: -(26.1700 - 40.4093) * 60, garrison: 50, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["manama"] },

    { id: "ramallah", name: "Ramallah", faction: "PSE", isCapital: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 38000, x: (35.2000 - 49.8671) * 60, y: -(31.9000 - 40.4093) * 60, garrison: 50, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["gaza", "jenin", "nablus"] },
    { id: "gaza", name: "Gazze", faction: "PSE", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 590000, x: (34.4600 - 49.8671) * 60, y: -(31.5000 - 40.4093) * 60, garrison: 65, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["ramallah"] },
    { id: "jenin", name: "Cenin", faction: "PSE", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 40000, x: (35.3000 - 49.8671) * 60, y: -(32.4600 - 40.4093) * 60, garrison: 45, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["ramallah"] },
    { id: "nablus", name: "Nablus", faction: "PSE", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 156000, x: (35.2600 - 49.8671) * 60, y: -(32.2200 - 40.4093) * 60, garrison: 55, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["ramallah"] },
    { id: "hebron", name: "El Halil", faction: "PSE", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 200000, x: (35.0900 - 49.8671) * 60, y: -(31.5300 - 40.4093) * 60, garrison: 60, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["ramallah"] },

    { id: "portmoresby", name: "Port Moresby", faction: "PNG", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 360000, x: (147.1800 - 49.8671) * 60, y: -(-9.4400 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["lae", "mount", "madang"] },
    { id: "lae", name: "Lae", faction: "PNG", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 100000, x: (147.0000 - 49.8671) * 60, y: -(-6.7300 - 40.4093) * 60, garrison: 55, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["portmoresby"] },
    { id: "mount", name: "Mount Hagen", faction: "PNG", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 46000, x: (144.2000 - 49.8671) * 60, y: -(-5.8600 - 40.4093) * 60, garrison: 50, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["portmoresby"] },
    { id: "madang", name: "Madang", faction: "PNG", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 30000, x: (145.7900 - 49.8671) * 60, y: -(-5.2100 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["portmoresby"] },
    { id: "goroka", name: "Goroka", faction: "PNG", isCapital: false, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 20000, x: (145.3900 - 49.8671) * 60, y: -(-6.0800 - 40.4093) * 60, garrison: 45, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["portmoresby"] },

    { id: "suva", name: "Suva", faction: "FJI", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 88000, x: (178.4300 - 49.8671) * 60, y: -(-18.1400 - 40.4093) * 60, garrison: 60, industry: 70, resourceBonus: {}, refinery: false, neighbors: ["lautoka", "nadi", "labasa"] },
    { id: "lautoka", name: "Lautoka", faction: "FJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 52000, x: (177.4500 - 49.8671) * 60, y: -(-17.6000 - 40.4093) * 60, garrison: 50, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["suva"] },
    { id: "nadi", name: "Nadi", faction: "FJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 42000, x: (177.3200 - 49.8671) * 60, y: -(-17.8000 - 40.4093) * 60, garrison: 45, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["suva"] },
    { id: "labasa", name: "Labasa", faction: "FJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 27000, x: (179.3700 - 49.8671) * 60, y: -(-16.4300 - 40.4093) * 60, garrison: 40, industry: 50, resourceBonus: {}, refinery: false, neighbors: ["suva"] },
    { id: "levuka", name: "Levuka", faction: "FJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 8000, x: (179.3100 - 49.8671) * 60, y: -(-18.0700 - 40.4093) * 60, garrison: 35, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["suva"] },

    { id: "honiara", name: "Honiara", faction: "SLB", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 84000, x: (159.9500 - 49.8671) * 60, y: -(-9.4300 - 40.4093) * 60, garrison: 55, industry: 60, resourceBonus: {}, refinery: false, neighbors: ["auki", "gizo", "munda"] },
    { id: "auki", name: "Auki", faction: "SLB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 7000, x: (160.7000 - 49.8671) * 60, y: -(-8.7800 - 40.4093) * 60, garrison: 40, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["honiara"] },
    { id: "gizo", name: "Gizo", faction: "SLB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 6000, x: (156.8200 - 49.8671) * 60, y: -(-8.1000 - 40.4093) * 60, garrison: 40, industry: 45, resourceBonus: {}, refinery: false, neighbors: ["honiara"] },
    { id: "munda", name: "Munda", faction: "SLB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 4000, x: (157.2700 - 49.8671) * 60, y: -(-8.3300 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["honiara"] },
    { id: "kukum", name: "Kukum", faction: "SLB", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 3000, x: (159.9000 - 49.8671) * 60, y: -(-9.4500 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["honiara"] },

    { id: "portvila", name: "Port Vila", faction: "VUT", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 45000, x: (168.3200 - 49.8671) * 60, y: -(-17.7400 - 40.4093) * 60, garrison: 50, industry: 65, resourceBonus: {}, refinery: false, neighbors: ["luganville", "isangel", "lakatoro"] },
    { id: "luganville", name: "Luganville", faction: "VUT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 16000, x: (167.1600 - 49.8671) * 60, y: -(-15.5300 - 40.4093) * 60, garrison: 45, industry: 55, resourceBonus: {}, refinery: false, neighbors: ["portvila"] },
    { id: "isangel", name: "Isangel", faction: "VUT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 2000, x: (169.2800 - 49.8671) * 60, y: -(-19.5400 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["portvila"] },
    { id: "lakatoro", name: "Lakatoro", faction: "VUT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 2000, x: (169.6300 - 49.8671) * 60, y: -(-16.1000 - 40.4093) * 60, garrison: 35, industry: 40, resourceBonus: {}, refinery: false, neighbors: ["portvila"] },
    { id: "solana", name: "Solana", faction: "VUT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 1000, x: (168.6000 - 49.8671) * 60, y: -(-16.7500 - 40.4093) * 60, garrison: 30, industry: 35, resourceBonus: {}, refinery: false, neighbors: ["portvila"] },

    { id: "tamanrasset", name: "Tamanrasset", faction: "DSF", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 50000, x: (5.5 - 49.8671) * 60, y: -(22.8 - 40.4093) * 60, garrison: 350, industry: 5, resourceBonus: { oil: 3 }, refinery: true, neighbors: ["algiers"] },
    { id: "sirte", name: "Sirte", faction: "SCU", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 80000, x: (16.5 - 49.8671) * 60, y: -(31.2 - 40.4093) * 60, garrison: 500, industry: 10, resourceBonus: { oil: 5 }, refinery: true, neighbors: [] },

    { id: "idlib", name: "İdlib", faction: "DTH", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 150000, x: (36.7 - 49.8671) * 60, y: -(35.9 - 40.4093) * 60, garrison: 800, industry: 15, resourceBonus: {}, refinery: false, neighbors: ["aleppo", "hama"] },

    { id: "kandahar", name: "Kandahar", faction: "HKM", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 200000, x: (65.7 - 49.8671) * 60, y: -(31.6 - 40.4093) * 60, garrison: 1200, industry: 15, resourceBonus: {}, refinery: false, neighbors: ["islamabad"] },
    { id: "quetta", name: "Ketta", faction: "BLR", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 100000, x: (67.0 - 49.8671) * 60, y: -(30.2 - 40.4093) * 60, garrison: 400, industry: 8, resourceBonus: {}, refinery: false, neighbors: ["karachi", "islamabad"] },

    { id: "khorog", name: "Horog", faction: "PME", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 30000, x: (71.6 - 49.8671) * 60, y: -(37.5 - 40.4093) * 60, garrison: 250, industry: 5, resourceBonus: {}, refinery: false, neighbors: ["dushanbe", "osh"] },
    { id: "jalalabad_kg", name: "Celalabad", faction: "FGL", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 60000, x: (72.9 - 49.8671) * 60, y: -(41.0 - 40.4093) * 60, garrison: 300, industry: 10, resourceBonus: {}, refinery: false, neighbors: ["osh"] },

    { id: "grozny", name: "Grozni", faction: "CWV", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 120000, x: (45.7 - 49.8671) * 60, y: -(43.3 - 40.4093) * 60, garrison: 600, industry: 12, resourceBonus: { oil: 2 }, refinery: true, neighbors: ["sochi", "tbilisi"] },
    { id: "yakutsk", name: "Yakutsk", faction: "SBE", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 40000, x: (129.7 - 49.8671) * 60, y: -(62.0 - 40.4093) * 60, garrison: 150, industry: 4, resourceBonus: { oil: 4 }, refinery: true, neighbors: ["vladivostok"] },

    { id: "cotabato", name: "Cotabato", faction: "MIA", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 180000, x: (124.2 - 49.8671) * 60, y: -(7.2 - 40.4093) * 60, garrison: 700, industry: 12, resourceBonus: {}, refinery: false, neighbors: ["davaocity"] },
    { id: "jayapura", name: "Jayapura", faction: "PFF", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 60000, x: (140.7 - 49.8671) * 60, y: -(-2.5 - 40.4093) * 60, garrison: 200, industry: 4, resourceBonus: {}, refinery: false, neighbors: ["portmoresby"] },

    { id: "derry", name: "Derry", faction: "GIR", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 85000, x: (-7.3 - 49.8671) * 60, y: -(55.0 - 40.4093) * 60, garrison: 300, industry: 10, resourceBonus: {}, refinery: false, neighbors: ["belfast"] },
    { id: "pristina", name: "Priştine", faction: "BKS", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 150000, x: (21.1 - 49.8671) * 60, y: -(42.7 - 40.4093) * 60, garrison: 450, industry: 10, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "ter_rus1", name: "Kırım Terör Üssü", faction: "TER_RUS1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 10000, x: (34 - 49.8671) * 60, y: -(45 - 40.4093) * 60, garrison: 300, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_rus2", name: "Sibirya Terör Üssü", faction: "TER_RUS2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 8000, x: (82 - 49.8671) * 60, y: -(55 - 40.4093) * 60, garrison: 250, industry: 4, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_rus3", name: "Uzak Doğu Terör Üssü", faction: "TER_RUS3", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 8000, x: (131 - 49.8671) * 60, y: -(43 - 40.4093) * 60, garrison: 250, industry: 4, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_chn1", name: "Doğu Çin Terör Üssü", faction: "TER_CHN1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 12000, x: (121 - 49.8671) * 60, y: -(31 - 40.4093) * 60, garrison: 350, industry: 8, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_chn2", name: "Batı Çin Terör Üssü", faction: "TER_CHN2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 10000, x: (87 - 49.8671) * 60, y: -(43 - 40.4093) * 60, garrison: 300, industry: 6, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_chn3", name: "Güney Çin Terör Üssü", faction: "TER_CHN3", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 10000, x: (113 - 49.8671) * 60, y: -(23 - 40.4093) * 60, garrison: 300, industry: 6, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_aus1", name: "Kuzey Avustralya Terör Üssü", faction: "TER_AUS1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 8000, x: (130 - 49.8671) * 60, y: -(-12 - 40.4093) * 60, garrison: 250, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_aus2", name: "Doğu Avustralya Terör Üssü", faction: "TER_AUS2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 8000, x: (151 - 49.8671) * 60, y: -(-33 - 40.4093) * 60, garrison: 250, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_aus3", name: "Batı Avustralya Terör Üssü", faction: "TER_AUS3", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 8000, x: (115 - 49.8671) * 60, y: -(-31 - 40.4093) * 60, garrison: 250, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_cauc", name: "Kafkasya Terör Üssü", faction: "TER_CAUC", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "MOUNTAIN", pop: 6000, x: (45 - 49.8671) * 60, y: -(43 - 40.4093) * 60, garrison: 200, industry: 3, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_cas1", name: "Kuzey Orta Asya Terör Üssü", faction: "TER_CAS1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 7000, x: (71 - 49.8671) * 60, y: -(51 - 40.4093) * 60, garrison: 220, industry: 4, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_cas2", name: "Güney Orta Asya Terör Üssü", faction: "TER_CAS2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 7000, x: (69 - 49.8671) * 60, y: -(41 - 40.4093) * 60, garrison: 220, industry: 4, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_me1", name: "Irak Terör Üssü", faction: "TER_ME1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 12000, x: (44 - 49.8671) * 60, y: -(33 - 40.4093) * 60, garrison: 350, industry: 7, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_me2", name: "Suriye Terör Üssü", faction: "TER_ME2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "HILLY", pop: 10000, x: (36 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 300, industry: 6, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_naf1", name: "Batı Kuzey Afrika Terör Üssü", faction: "TER_NAF1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 9000, x: (5 - 49.8671) * 60, y: -(22 - 40.4093) * 60, garrison: 280, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_naf2", name: "Doğu Kuzey Afrika Terör Üssü", faction: "TER_NAF2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 9000, x: (32 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 280, industry: 5, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_oce1", name: "PNG Terör Üssü", faction: "TER_OCE1", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 5000, x: (147 - 49.8671) * 60, y: -(-9 - 40.4093) * 60, garrison: 180, industry: 3, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_oce2", name: "Fiji Terör Üssü", faction: "TER_OCE2", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 4000, x: (178 - 49.8671) * 60, y: -(-18 - 40.4093) * 60, garrison: 150, industry: 2, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ter_oce3", name: "Solomon Terör Üssü", faction: "TER_OCE3", isCapital: true, isOrgBase: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 4000, x: (159 - 49.8671) * 60, y: -(-9 - 40.4093) * 60, garrison: 150, industry: 2, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "pir_red_n", name: "Kızıldeniz (Kuzey Üs)", faction: "PIR_RED1", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (34.5 - 49.8671) * 60, y: -(26.0 - 40.4093) * 60, garrison: 200, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["portsaid", "jeddah"] },
    { id: "pir_red_s", name: "Kızıldeniz (Güney Üs)", faction: "PIR_RED2", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (38.0 - 49.8671) * 60, y: -(16.0 - 40.4093) * 60, garrison: 180, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["jeddah", "mukalla"] },

    { id: "pir_oman_e", name: "Umman Denizi (Doğu)", faction: "PIR_OMAN1", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (58.0 - 49.8671) * 60, y: -(22.0 - 40.4093) * 60, garrison: 250, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["muscat", "karachi"] },
    { id: "pir_oman_w", name: "Umman Denizi (Batı)", faction: "PIR_OMAN2", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (52.0 - 49.8671) * 60, y: -(24.0 - 40.4093) * 60, garrison: 220, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["doha", "abudhabi"] },

    { id: "pir_arab_n", name: "Arap Denizi (Kuzey)", faction: "PIR_ARAB1", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (64.0 - 49.8671) * 60, y: -(18.0 - 40.4093) * 60, garrison: 300, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["karachi", "mumbai"] },
    { id: "pir_arab_s", name: "Arap Denizi (Güney)", faction: "PIR_ARAB2", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (68.0 - 49.8671) * 60, y: -(10.0 - 40.4093) * 60, garrison: 280, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["mumbai", "colombo"] },

    { id: "pir_indo_sumatra", name: "Sumatra Korsan Üssü", faction: "PIR_INDO1", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (98.0 - 49.8671) * 60, y: -(1.0 - 40.4093) * 60, garrison: 150, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["medan", "kualalumpur"] },
    { id: "pir_indo_java", name: "Cava Korsan Üssü", faction: "PIR_INDO2", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (109.0 - 49.8671) * 60, y: -(-6.0 - 40.4093) * 60, garrison: 180, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["jakarta", "surabaya"] },
    { id: "pir_indo_borneo", name: "Borneo Korsan Üssü", faction: "PIR_INDO3", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (115.0 - 49.8671) * 60, y: -(2.0 - 40.4093) * 60, garrison: 160, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["kuching", "bandar_seri_begawan"] },
    { id: "pir_indo_papua", name: "Papua Korsan Üssü", faction: "PIR_INDO4", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (134.0 - 49.8671) * 60, y: -(-4.0 - 40.4093) * 60, garrison: 140, industry: 0, resourceBonus: {}, refinery: false, neighbors: ["jayapura", "portmoresby"] },

    { id: "pir_med1", name: "Akdeniz Üssü (Batı)", faction: "PIR_MED1", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (30 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 200, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_med2", name: "Akdeniz Üssü (Doğu)", faction: "PIR_MED2", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (20 - 49.8671) * 60, y: -(38 - 40.4093) * 60, garrison: 200, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_gib", name: "Cebelitarık Üssü", faction: "PIR_GIB", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (-5 - 49.8671) * 60, y: -(36 - 40.4093) * 60, garrison: 250, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_bas", name: "Basra Üssü", faction: "PIR_BAS", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (50 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 250, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_nsea", name: "Kuzey Denizi Üssü", faction: "PIR_NSEA", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (3 - 49.8671) * 60, y: -(56 - 40.4093) * 60, garrison: 220, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_balt", name: "Baltık Denizi Üssü", faction: "PIR_BALT", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (20 - 49.8671) * 60, y: -(58 - 40.4093) * 60, garrison: 220, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_beng", name: "Bengal Körfezi Üssü", faction: "PIR_BENG", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (88 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 230, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_ecn", name: "Doğu Çin Denizi Üssü", faction: "PIR_ECHN", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (125 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 230, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "pir_jap", name: "Japon Denizi Üssü", faction: "PIR_JAP", isCapital: true, isOrgBase: true, isSea: true, isCoastal: true, terrain: "SEA", pop: 3000, x: (132 - 49.8671) * 60, y: -(37 - 40.4093) * 60, garrison: 230, industry: 0, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "wuhan", name: "Wuhan", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 11000000, x: (114 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 100, industry: 90, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "chongqing", name: "Chongqing", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 32000000, x: (106 - 49.8671) * 60, y: -(29 - 40.4093) * 60, garrison: 120, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "shenzhen", name: "Shenzhen", faction: "CHN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 13000000, x: (114 - 49.8671) * 60, y: -(22 - 40.4093) * 60, garrison: 80, industry: 95, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "nanjing", name: "Nanjing", faction: "CHN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 9300000, x: (118 - 49.8671) * 60, y: -(32 - 40.4093) * 60, garrison: 85, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hangzhou", name: "Hangzhou", faction: "CHN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 12000000, x: (120 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 75, industry: 88, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "adelaide", name: "Adelaide", faction: "AUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 1400000, x: (138 - 49.8671) * 60, y: -(-34 - 40.4093) * 60, garrison: 70, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hobart", name: "Hobart", faction: "AUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 240000, x: (147 - 49.8671) * 60, y: -(-42 - 40.4093) * 60, garrison: 60, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "darwin", name: "Darwin", faction: "AUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 150000, x: (130 - 49.8671) * 60, y: -(-12 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "goldcoast", name: "Gold Coast", faction: "AUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 700000, x: (153 - 49.8671) * 60, y: -(-27 - 40.4093) * 60, garrison: 55, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "newcastle", name: "Newcastle", faction: "AUS", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 450000, x: (151 - 49.8671) * 60, y: -(-32 - 40.4093) * 60, garrison: 60, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "aktau", name: "Aktau", faction: "KAZ", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 180000, x: (51 - 49.8671) * 60, y: -(43 - 40.4093) * 60, garrison: 70, industry: 65, resourceBonus: { oil: 2 }, refinery: true, neighbors: [] },
    { id: "taraz", name: "Taraz", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 350000, x: (71 - 49.8671) * 60, y: -(42 - 40.4093) * 60, garrison: 65, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kyzylorda", name: "Kızılorda", faction: "KAZ", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 200000, x: (65 - 49.8671) * 60, y: -(44 - 40.4093) * 60, garrison: 60, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "jaipur", name: "Jaipur", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 3000000, x: (75 - 49.8671) * 60, y: -(26 - 40.4093) * 60, garrison: 80, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "lucknow", name: "Lucknow", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2800000, x: (80 - 49.8671) * 60, y: -(26 - 40.4093) * 60, garrison: 75, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bhopal", name: "Bhopal", faction: "IND", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (77 - 49.8671) * 60, y: -(23 - 40.4093) * 60, garrison: 70, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "taif", name: "Taif", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 600000, x: (40 - 49.8671) * 60, y: -(21 - 40.4093) * 60, garrison: 80, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tabuk", name: "Tabuk", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 500000, x: (36 - 49.8671) * 60, y: -(28 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hail", name: "Hail", faction: "SAU", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 400000, x: (41 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 70, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "oujda", name: "Oujda", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (-1 - 49.8671) * 60, y: -(34 - 40.4093) * 60, garrison: 70, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "agadir", name: "Agadir", faction: "MAR", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 500000, x: (-9 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 65, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "meknes", name: "Meknes", faction: "MAR", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 600000, x: (-5 - 49.8671) * 60, y: -(33 - 40.4093) * 60, garrison: 70, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tlemcen", name: "Tlemcen", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 200000, x: (-1 - 49.8671) * 60, y: -(34 - 40.4093) * 60, garrison: 65, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "batna", name: "Batna", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 300000, x: (6 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 60, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "setif", name: "Setif", faction: "DZA", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 300000, x: (5 - 49.8671) * 60, y: -(36 - 40.4093) * 60, garrison: 62, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tobruk", name: "Tobruk", faction: "LBY", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 120000, x: (24 - 49.8671) * 60, y: -(32 - 40.4093) * 60, garrison: 75, industry: 60, resourceBonus: { oil: 1 }, refinery: true, neighbors: [] },
    { id: "sabha", name: "Sabha", faction: "LBY", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 100000, x: (14 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 60, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "zawiya", name: "Zawiya", faction: "LBY", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (12 - 49.8671) * 60, y: -(32 - 40.4093) * 60, garrison: 70, industry: 62, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "asyut", name: "Asyut", faction: "EGY", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 400000, x: (31 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 65, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "suez", name: "Süveyş", faction: "EGY", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 700000, x: (32 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 80, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "damietta", name: "Damietta", faction: "EGY", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 300000, x: (31 - 49.8671) * 60, y: -(31 - 40.4093) * 60, garrison: 70, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "peshawar", name: "Peşaver", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 2000000, x: (71 - 49.8671) * 60, y: -(34 - 40.4093) * 60, garrison: 90, industry: 78, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "multan", name: "Multan", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1800000, x: (71 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 80, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hyderabad_pak", name: "Haydarabad", faction: "PAK", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 1700000, x: (68 - 49.8671) * 60, y: -(25 - 40.4093) * 60, garrison: 75, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "fergana", name: "Fergana", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (71 - 49.8671) * 60, y: -(40 - 40.4093) * 60, garrison: 70, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "jizzakh", name: "Cizzah", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 180000, x: (67 - 49.8671) * 60, y: -(40 - 40.4093) * 60, garrison: 65, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "navoiy", name: "Navoiy", faction: "UZB", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 150000, x: (65 - 49.8671) * 60, y: -(40 - 40.4093) * 60, garrison: 60, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "konye_urgench", name: "Köneürgenç", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 40000, x: (59 - 49.8671) * 60, y: -(42 - 40.4093) * 60, garrison: 55, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bereket", name: "Bereket", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 30000, x: (55 - 49.8671) * 60, y: -(39 - 40.4093) * 60, garrison: 50, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "serdar", name: "Serdar", faction: "TKM", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 20000, x: (56 - 49.8671) * 60, y: -(38 - 40.4093) * 60, garrison: 50, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kerkuk", name: "Kerkük", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 800000, x: (44 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 100, industry: 80, resourceBonus: { oil: 3 }, refinery: true, neighbors: [] },
    { id: "tikrit", name: "Tikrit", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 200000, x: (43 - 49.8671) * 60, y: -(34 - 40.4093) * 60, garrison: 80, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "najaf", name: "Necef", faction: "IRQ", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 600000, x: (44 - 49.8671) * 60, y: -(32 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "deir_ez_zor", name: "Deyrizor", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 200000, x: (40 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 70, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "rakka", name: "Rakka", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (39 - 49.8671) * 60, y: -(35 - 40.4093) * 60, garrison: 75, industry: 62, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "haseke", name: "Haseke", faction: "SRY", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (40 - 49.8671) * 60, y: -(36 - 40.4093) * 60, garrison: 70, industry: 58, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "urmia", name: "Urmiye", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 600000, x: (45 - 49.8671) * 60, y: -(37 - 40.4093) * 60, garrison: 80, industry: 72, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kerman", name: "Kerman", faction: "IRN", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 500000, x: (56 - 49.8671) * 60, y: -(30 - 40.4093) * 60, garrison: 75, industry: 68, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "rasht", name: "Reşt", faction: "IRN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 600000, x: (49 - 49.8671) * 60, y: -(37 - 40.4093) * 60, garrison: 70, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },

    { id: "layun", name: "Layun", faction: "ESH", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (-13 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 100, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dakhla", name: "Dakhla", faction: "ESH", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 100000, x: (-15 - 49.8671) * 60, y: -(23 - 40.4093) * 60, garrison: 70, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "smara", name: "Smara", faction: "ESH", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 50000, x: (-11 - 49.8671) * 60, y: -(26 - 40.4093) * 60, garrison: 60, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "boujdour", name: "Boujdour", faction: "ESH", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 40000, x: (-14 - 49.8671) * 60, y: -(26 - 40.4093) * 60, garrison: 55, industry: 42, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "elaiun", name: "El-Aaiun", faction: "ESH", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 30000, x: (-13 - 49.8671) * 60, y: -(27 - 40.4093) * 60, garrison: 60, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "nouakchott", name: "Nuakşot", faction: "MRT", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 1000000, x: (-15 - 49.8671) * 60, y: -(18 - 40.4093) * 60, garrison: 120, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "nouadhibou", name: "Nouadhibou", faction: "MRT", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 120000, x: (-17 - 49.8671) * 60, y: -(20 - 40.4093) * 60, garrison: 80, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "zouerate", name: "Zouerate", faction: "MRT", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 50000, x: (-12 - 49.8671) * 60, y: -(22 - 40.4093) * 60, garrison: 70, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kiffa", name: "Kiffa", faction: "MRT", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 40000, x: (-11 - 49.8671) * 60, y: -(16 - 40.4093) * 60, garrison: 65, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "atar", name: "Atar", faction: "MRT", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 30000, x: (-13 - 49.8671) * 60, y: -(20 - 40.4093) * 60, garrison: 60, industry: 42, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bamako", name: "Bamako", faction: "MLI", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2000000, x: (-8 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 130, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "timbuktu", name: "Timbuktu", faction: "MLI", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 50000, x: (-3 - 49.8671) * 60, y: -(16 - 40.4093) * 60, garrison: 80, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "gao", name: "Gao", faction: "MLI", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 80000, x: (0 - 49.8671) * 60, y: -(16 - 40.4093) * 60, garrison: 75, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "mopti", name: "Mopti", faction: "MLI", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 120000, x: (-4 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 70, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "sikasso", name: "Sikasso", faction: "MLI", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (-5 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 65, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "niamey", name: "Niamey", faction: "NER", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1300000, x: (2 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 120, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "zinder", name: "Zinder", faction: "NER", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 250000, x: (8 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 80, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "maradi", name: "Maradi", faction: "NER", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (7 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 75, industry: 52, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "agadez", name: "Agadez", faction: "NER", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 100000, x: (7 - 49.8671) * 60, y: -(16 - 40.4093) * 60, garrison: 70, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tahoua", name: "Tahoua", faction: "NER", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 150000, x: (5 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 65, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ndjamena", name: "N'Djamena", faction: "TCD", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 1200000, x: (15 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 110, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "moundou", name: "Moundou", faction: "TCD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 200000, x: (16 - 49.8671) * 60, y: -(8 - 40.4093) * 60, garrison: 75, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "sarh", name: "Sarh", faction: "TCD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (18 - 49.8671) * 60, y: -(9 - 40.4093) * 60, garrison: 70, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "abeche", name: "Abéché", faction: "TCD", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 80000, x: (20 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 65, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kelo", name: "Kélo", faction: "TCD", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 60000, x: (15 - 49.8671) * 60, y: -(9 - 40.4093) * 60, garrison: 60, industry: 42, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "khartoum", name: "Hartum", faction: "SDN", isCapital: true, isSea: false, isCoastal: false, terrain: "DESERT", pop: 5000000, x: (32 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 150, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "omdurman", name: "Omdurman", faction: "SDN", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 2800000, x: (32 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 120, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "portsudan", name: "Port Sudan", faction: "SDN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 500000, x: (37 - 49.8671) * 60, y: -(19 - 40.4093) * 60, garrison: 100, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kassala", name: "Kassala", faction: "SDN", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 400000, x: (36 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 80, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "elobeid", name: "El Obeid", faction: "SDN", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 300000, x: (30 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 75, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "asmara", name: "Asmara", faction: "ERI", isCapital: true, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 500000, x: (38 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 100, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "massawa", name: "Massawa", faction: "ERI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 50000, x: (39 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 70, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "keren", name: "Keren", faction: "ERI", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 100000, x: (38 - 49.8671) * 60, y: -(15 - 40.4093) * 60, garrison: 65, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "assab", name: "Assab", faction: "ERI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 50000, x: (42 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 60, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "mendefera", name: "Mendefera", faction: "ERI", isCapital: false, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 40000, x: (38 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 55, industry: 42, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "djibouti_city", name: "Cibuti", faction: "DJI", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 600000, x: (43 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 110, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ali_sabieh", name: "Ali Sabieh", faction: "DJI", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 40000, x: (42 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 60, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "tadjoura", name: "Tadjoura", faction: "DJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 20000, x: (42 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 55, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "obock", name: "Obock", faction: "DJI", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 15000, x: (43 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 50, industry: 38, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dikhil", name: "Dikhil", faction: "DJI", isCapital: false, isSea: false, isCoastal: false, terrain: "DESERT", pop: 20000, x: (42 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 50, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dakar", name: "Dakar", faction: "SEN", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 3000000, x: (-17 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 140, industry: 80, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "saintlouis", name: "Saint-Louis", faction: "SEN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (-16 - 49.8671) * 60, y: -(16 - 40.4093) * 60, garrison: 80, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "thies", name: "Thiès", faction: "SEN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (-16 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 75, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ziguinchor", name: "Ziguinchor", faction: "SEN", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (-16 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 70, industry: 62, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kaolack", name: "Kaolack", faction: "SEN", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 250000, x: (-16 - 49.8671) * 60, y: -(14 - 40.4093) * 60, garrison: 65, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "ouagadougou", name: "Ouagadougou", faction: "BFA", isCapital: true, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 2500000, x: (-1 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 130, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bobo_dioulasso", name: "Bobo-Dioulasso", faction: "BFA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (-4 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 80, industry: 60, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "koudougou", name: "Koudougou", faction: "BFA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 100000, x: (-2 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 70, industry: 55, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "banfora", name: "Banfora", faction: "BFA", isCapital: false, isSea: false, isCoastal: false, terrain: "HILLY", pop: 80000, x: (-4 - 49.8671) * 60, y: -(10 - 40.4093) * 60, garrison: 65, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "fada_ngourma", name: "Fada N'gourma", faction: "BFA", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 60000, x: (0 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 60, industry: 48, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "addisababa", name: "Addis Ababa", faction: "ETH", isCapital: true, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 3000000, x: (38 - 49.8671) * 60, y: -(9 - 40.4093) * 60, garrison: 150, industry: 85, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "dire_dawa", name: "Dire Dawa", faction: "ETH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 500000, x: (41 - 49.8671) * 60, y: -(9 - 40.4093) * 60, garrison: 100, industry: 75, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "mekelle", name: "Mekelle", faction: "ETH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 300000, x: (39 - 49.8671) * 60, y: -(13 - 40.4093) * 60, garrison: 80, industry: 70, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "gondar", name: "Gondar", faction: "ETH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 200000, x: (37 - 49.8671) * 60, y: -(12 - 40.4093) * 60, garrison: 75, industry: 65, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bahir_dar", name: "Bahir Dar", faction: "ETH", isCapital: false, isSea: false, isCoastal: false, terrain: "PLAIN", pop: 300000, x: (37 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 70, industry: 62, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "mogadishu", name: "Mogadişu", faction: "SOM", isCapital: true, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 2000000, x: (45 - 49.8671) * 60, y: -(2 - 40.4093) * 60, garrison: 130, industry: 50, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "hargeisa", name: "Hargeisa", faction: "SOM", isCapital: false, isSea: false, isCoastal: false, terrain: "PLATEAU", pop: 500000, x: (44 - 49.8671) * 60, y: -(9 - 40.4093) * 60, garrison: 80, industry: 45, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "kismayo", name: "Kismayo", faction: "SOM", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 200000, x: (42 - 49.8671) * 60, y: -(0 - 40.4093) * 60, garrison: 70, industry: 40, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "berbera", name: "Berbera", faction: "SOM", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 100000, x: (45 - 49.8671) * 60, y: -(10 - 40.4093) * 60, garrison: 65, industry: 42, resourceBonus: {}, refinery: false, neighbors: [] },
    { id: "bosaso", name: "Bosaso", faction: "SOM", isCapital: false, isSea: false, isCoastal: true, terrain: "COASTAL", pop: 150000, x: (49 - 49.8671) * 60, y: -(11 - 40.4093) * 60, garrison: 60, industry: 38, resourceBonus: {}, refinery: false, neighbors: [] }
];




mapNodes.forEach(node => {
    if (!playerVisibleNodes.has(node.id)) return;
    const fac = factions[node.faction] || { color: "#6b7280" };
    ctx.fillStyle = fac.color;
    ctx.beginPath();
    if (node.isCapital) ctx.rect(node.x-14, node.y-14, 28, 28);
    else ctx.arc(node.x, node.y, 12, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#e6edf3";
    ctx.font = "bold 10px 'Segoe UI'";
    ctx.fillText(node.name, node.x-20, node.y-18);
    if (node.isCoastal) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI*2);
        ctx.stroke();
    }
    if (node.faction === playerFaction || (factions[playerFaction] && factions[playerFaction].alliances[node.faction])) {
        if (node.refinery) { ctx.fillStyle = "#ffd700"; ctx.font = "14px sans-serif"; ctx.fillText("🛢", node.x-10, node.y-22); }
        if (airDefenses[node.id]) { ctx.fillStyle = "#58a6ff"; ctx.font = "14px sans-serif"; ctx.fillText("🛡️", node.x-20, node.y-28); }
    }
});

for (let id in detectedUnits) {
    const d = detectedUnits[id];
    const alpha = 0.3 + 0.7 * (1 - (Date.now() - d.lastSeen) / 30000);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = d.owner === playerFaction ? "#58a6ff" : "#f85149";
    ctx.beginPath();
    ctx.arc(d.x, d.y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

const DIST_THRESHOLD = 150; 
for (let i = 0; i < mapNodes.length; i++) {
    for (let j = i+1; j < mapNodes.length; j++) {
        const a = mapNodes[i], b = mapNodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < DIST_THRESHOLD) {
            if (!a.neighbors.includes(b.id)) a.neighbors.push(b.id);
            if (!b.neighbors.includes(a.id)) b.neighbors.push(a.id);
        }
    }
}

const fightersUpdate = {
    "RUS": 180, "CHN": 220, "IND": 120, "JPN": 140, "GBR": 130,
    "TUR": 85, "FRA": 110, "GER": 100, "ITA": 75, "ESP": 60, "POL": 55, "UKR": 50,
    "KOR": 90, "PRK": 70, "IRN": 65, "SAU": 60, "ISR": 70, "EGY": 50, "IRQ": 40,
    "SYR": 30, "PAK": 80, "BGD": 20, "KAZ": 35, "UZB": 25, "TKM": 20, "KGZ": 15,
    "TJK": 15, "MNG": 15, "AZE": 30, "GEO": 20, "ARM": 15, "BLR": 40, "MDA": 10,
    "GER": 100, "FRA": 110, "ITA": 75, "ESP": 60, "POR": 30, "NLD": 50, "BEL": 35,
    "CHE": 40, "AUT": 35, "SWE": 60, "NOR": 45, "FIN": 40, "DNK": 40, "IRL": 20,
    "CZE": 35, "SVK": 25, "HUN": 30, "ROU": 35, "BGR": 30, "SRB": 25, "HRV": 25,
    "SVN": 15, "BIH": 15, "MNE": 10, "MKD": 10, "ALB": 10, "GRC": 40, "CYP": 15,
    "MLT": 5, "LUX": 5, "ISL": 5,
    "MMR": 25, "THA": 35, "VNM": 30, "LAO": 10, "KHM": 10, "MYS": 35, "IDN": 40,
    "PHL": 30, "SGP": 50, "LKA": 15, "NPL": 10, "BTN": 5, "BHR": 20, "QAT": 25,
    "KWT": 20, "OMN": 20, "ARE": 35, "YEM": 15, "JOR": 20, "LBN": 15,
    "AUS": 90, "NZL": 30, "PNG": 10, "FJI": 5, "SLB": 5, "VUT": 5
};

for (let code in fightersUpdate) {
    if (factions[code]) {
        factions[code].fighters = fightersUpdate[code];
    }
}



function isAllyOrPlayer(factionCode) {
    if (!playerFaction) return false;
    if (factionCode === playerFaction) return true;
    if (factions[playerFaction] && factions[playerFaction].alliances && factions[playerFaction].alliances[factionCode]) return true;
    return false;
}

function isUnitVisible(unit) {
    if (!playerFaction) return true;
    if (unit.id && mapNodes.some(n => n.id === unit.id)) return true;
    if (unit.isOrgBase && discoveredBases[unit.id]) return true;
    if (unit.owner) {
        if (unit.owner === playerFaction) return true;
        if (factions[playerFaction] && factions[playerFaction].alliances && factions[playerFaction].alliances[unit.owner]) return true;
        if (discoveredArmies[unit.id]) return true;
        for (let rid in radarStations) {
            const r = radarStations[rid];
            if (Math.hypot(unit.x - r.x, unit.y - r.y) < 120) return true;
        }
        for (let s of satellites) {
            if (s.active && Math.hypot(unit.x - s.x, unit.y - s.y) < 200) return true;
        }
        return false;
    }
    return true;
}

function scanRadar() {
    if (!playerFaction) return;
    for (let rid in radarStations) {
        const r = radarStations[rid];
        for (let node of mapNodes) {
            if (node.isOrgBase && !discoveredBases[node.id]) {
                const dist = Math.hypot(node.x - r.x, node.y - r.y);
                if (dist < 150) {
                    discoveredBases[node.id] = true;
                    addLog(`📡 Radar, ${node.name} üssünü tespit etti!`, "#38bdf8");
                }
            }
        }
    }
}


function addLogFiltered(text, color, node, sourceFaction) {
    if (!playerFaction) { addLog(text, color); return; }
    let show = false;
    const filter = window.msgFilter || 'all';
    if (filter === 'all') show = true;
    else if (filter === 'self') {
        if (sourceFaction === playerFaction) show = true;
        else if (node && node.faction === playerFaction) show = true;
        else if (node && node.faction && factions[playerFaction] && factions[playerFaction].alliances[node.faction]) show = true;
        else if (sourceFaction && factions[playerFaction] && factions[playerFaction].alliances[sourceFaction]) show = true;
        else show = false;
    } else if (filter === 'allies') {
        if (sourceFaction === playerFaction) show = true;
        else if (node && node.faction === playerFaction) show = true;
        else if (sourceFaction && factions[playerFaction] && factions[playerFaction].alliances[sourceFaction]) show = true;
        else if (node && node.faction && factions[playerFaction] && factions[playerFaction].alliances[node.faction]) show = true;
        else show = false;
    }
    if (show) addLog(text, color);
}

function addLog(text, color) {
    const ticker = document.getElementById("notification-ticker");
    const log = document.createElement("div");
    log.className = "ticker-log";
    log.style.color = color || "#c9d1d9";
    log.innerHTML = text;
    ticker.appendChild(log);
    if (ticker.children.length > 25) ticker.removeChild(ticker.firstChild);
    playSound('click');
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        let freq = 400, dur = 100, wave = 'sine';
        if (type === 'click') { freq = 600; dur = 80; }
        else if (type === 'explosion') { freq = 150; dur = 300; wave = 'sawtooth'; }
        else if (type === 'bombardment') { freq = 200; dur = 400; wave = 'square'; }
        else if (type === 'war') { freq = 100; dur = 600; wave = 'sawtooth'; }
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur/1000);
    } catch(e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    addLog(`🔊 Ses ${soundEnabled ? 'açıldı' : 'kapatıldı'}`, "#58a6ff");
}

function buildTradeDropdown() {
    const sel = document.getElementById("trade-target-select");
    sel.innerHTML = "";
    const coastal = mapNodes.filter(n => n.isCoastal && !n.isSea && n.faction !== playerFaction);
    coastal.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.id;
        opt.text = `${n.name} (${factions[n.faction].name})`;
        sel.appendChild(opt);
    });
}

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => { if (playerFaction) saveGame(); }, 30000);
}

function saveGame() {
    const data = {
        playerFaction, factions, mapNodes, armies, merchantShips, airUnits, spies, guerrillaUnits, satellites,
        discoveredBases, discoveredArmies, gameWon, zoom, panX, panY,
        techLevel, blockades, airDefenses, unSanction, radarStations, navalBases, spaceStations, missileDefenses,
        tradeRoutes, embargoActive, techTree, relationsScore,
        nonAggressionPacts, vassalStates, warReport, globalEvent, eventDuration,
        climateState, climateDuration, peaceTreaties, economicSanctions, lobbyPlayers, onlineLobbyActive
    };
    localStorage.setItem('geopolitica_save', JSON.stringify(data));
    addLog("💾 Kaydedildi.", "#58a6ff");
}

function loadGame() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-container").style.display = "flex";
    document.getElementById("current-faction").innerText = factions[playerFaction].name;

    const raw = localStorage.getItem('geopolitica_save');
    if (!raw) { alert("Kayıt yok."); return; }
    try {
        const data = JSON.parse(raw);
        Object.assign(factions, data.factions);
        mapNodes.length = 0; mapNodes.push(...data.mapNodes);
        armies = data.armies.map(a => ({ ...a }));
        merchantShips = data.merchantShips || [];
        airUnits = data.airUnits || [];
        spies = data.spies || [];
        guerrillaUnits = data.guerrillaUnits || [];
        satellites = data.satellites || [];
        discoveredBases = data.discoveredBases || {};
        discoveredArmies = data.discoveredArmies || {};
        gameWon = data.gameWon || false;
        playerFaction = data.playerFaction;
        zoom = data.zoom || 1.0; panX = data.panX || 0; panY = data.panY || 0;
        techLevel = data.techLevel || { land: 0, naval: 0, air: 0, spy: 0, space: 0 };
        blockades = data.blockades || {};
        airDefenses = data.airDefenses || {};
        unSanction = data.unSanction || false;
        radarStations = data.radarStations || {};
        navalBases = data.navalBases || {};
        spaceStations = data.spaceStations || {};
        missileDefenses = data.missileDefenses || {};
        tradeRoutes = data.tradeRoutes || [];
        embargoActive = data.embargoActive || false;
        techTree = data.techTree || techTree;
        relationsScore = data.relationsScore || {};
        nonAggressionPacts = data.nonAggressionPacts || {};
        vassalStates = data.vassalStates || {};
        warReport = data.warReport || { battles: 0, wins: 0, losses: 0, totalCasualties: 0 };
        globalEvent = data.globalEvent || null;
        eventDuration = data.eventDuration || 0;
        climateState = data.climateState || 0;
        climateDuration = data.climateDuration || 0;
        peaceTreaties = data.peaceTreaties || {};
        economicSanctions = data.economicSanctions || {};
        lobbyPlayers = data.lobbyPlayers || [];
        onlineLobbyActive = data.onlineLobbyActive || false;
        document.getElementById("start-screen").style.display = "none";
        document.getElementById("game-container").style.display = "flex";
        document.getElementById("current-faction").innerText = factions[playerFaction].name;
        updateArmySelectDropdown();
        buildTradeDropdown();
        updateLedger();
        updateTechUI();
        updateTradeRoutesUI();
        updateAirUI();
        updateWarReport();
        updateSpaceUI();
        updateGuerrillaUI();
        updateClimateUI();
        addLog("💾 Yüklendi.", "#58a6ff");
        drawMap();
        startAutoSave();
    } catch(e) { alert("Kayıt bozuk!" + e); }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btn-play').addEventListener('click', function() {
    if (!playerFaction) { alert("Lütfen bir fraksiyon seçin!"); return; }
    startGame();
});

document.getElementById('btn-tutorial').addEventListener('click', function() {
    document.getElementById('tutorial-modal').style.display = 'flex';
    document.getElementById('tutorial-content').innerHTML = `
        <h3>GEOPOLITICA - Temel Kılavuz</h3>
        <p>Bu oyunda bir ülke veya örgütü yönetiyorsunuz. Amaç tüm başkentleri ele geçirerek dünya hakimiyeti kurmak.</p>
        <ul>
            <p><strong>GEOPOLITICA: Avrupa & Asya</strong> dünyasına hoş geldiniz Komutan! Bu gerçek zamanlı strateji simülasyonunda, seçtiğiniz devletin veya yeraltı örgütünün küresel egemenliğini sağlamak sizin elinizde.</p>
        
        <hr style="border: 0; border-top: 1px solid #30363d; margin: 15px 0;">

        <h3 style="color:#ff9f43; margin-bottom: 8px;">1. Kaynak Yönetimi & Ekonomi</h3>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li><strong>Para ($):</strong> Ordu kurmak, teknoloji araştırmak ve altyapı inşa etmek için temel birimdir. Vergilerle ve ticaretle kazanılır.</li>
            <li><strong>Petrol & Çelik:</strong> Ağır sanayi, tanklar, fırkateynler ve uzay teknolojileri için kritik hammaddelerdir. Rafineriler ve Çelik Fabrikaları kurarak üretimi artırın.</li>
            <li><strong>Yemek:</strong> Ordularınızın lojistik devamlılığı ve nüfusunuzun hayatta kalması için her saniye tüketilir.</li>
            <li><strong>Elektrik (Şarj):</strong> Uzay üsleri, radar istasyonları ve gelişmiş hava savunma sistemleri enerji harcar.</li>
        </ul>

        <h3 style="color:#f85149; margin-bottom: 8px;">2. Askeri Komuta Merkezleri</h3>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li><strong>Kara Gücü:</strong> Belirli sayıda asker devşirerek Ordu Kurun. Tank, Topçu ve Komandolarla destekleyerek sınır ötesi kara harekatları düzenleyin.</li>
            <li><strong>Deniz Gücü:</strong> Kıyı şehirlerinde <em>Deniz Üssü</em> inşa ederek Fırkateyn ve Denizaltılar üretin. Donanma butonu ile deniz yollarını kontrol edin.</li>
            <li><strong>Hava Gücü:</strong> Uçak ve İHA üreterek düşman şehirlerine <em>Keşif Uçuşu</em> yapabilir veya savunmalarını <em>Bombala</em> komutuyla çökertebilirsiniz.</li>
        </ul>

        <h3 style="color:#58a6ff; margin-bottom: 8px;">3. İstihbarat, Uzay & Siber Savaş</h3>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li><strong>Casusluk & Sabotaj:</strong> Hedef ülkelere casus göndererek tesislerini sabote edebilir veya <em>Gerilla Savaşı</em> başlatarak içten çökertebilirsiniz.</li>
            <li><strong>Uzay Yarışı:</strong> Uzay Üssü kurarak yörüngeye uydu fırlatın. Uydular haritadaki sis perdesini kaldırır. Düşman uydularını Anti-Uydu füzeleriyle vurabilir, siber üstünlük için <em>Yıldırım Füzesi</em> ateşleyebilirsiniz.</li>
        </ul>

        <h3 style="color:#cca43b; margin-bottom: 8px;">4. Diplomasi, Ticaret & Yaptırımlar</h3>
        <ul style="padding-left: 20px; margin-bottom: 15px;">
            <li>Haritadan bir şehir seçtiğinizde sağ panelde diplomasi seçenekleri açılır. Buradan <strong>İttifak</strong> kurabilir, <strong>Savaş</strong> ilan edebilir veya zayıf devletleri <strong>Haraca Bağlayabilirsiniz</strong>.</li>
            <li><strong>Liman Ticareti:</strong> Hedef bir liman seçip Kargo Türü (Petrol, Gıda, Silah, Çelik) belirleyerek ticaret gemileri gönderebilirsiniz.</li>
            <li><strong>Ambargo & Yaptırım:</strong> Rakip devletlerin ekonomisini boğmak için onlara ambargo uygulayabilir veya BM üzerinden ekonomik yaptırımlar başlatabilirsiniz.</li>
        </ul>

        <blockquote style="background: rgba(110, 118, 129, 0.1); border-left: 4px solid #1f6feb; padding: 10px; margin: 15px 0; border-radius: 4px;">
            💡 <strong>Unutmayın:</strong> Oyun her 30 saniyede bir otomatik olarak kaydedilir. Enflasyon oranını, küresel iklim krizlerini ve anlık bildirim ticker'ını sürekli takip edin. Başarılar!
        </blockquote>

        </ul>
    `;
});

document.getElementById('tutorial-close').addEventListener('click', function() {
    document.getElementById('tutorial-modal').style.display = 'none';
});

document.getElementById('btn-settings').addEventListener('click', function() {
    document.getElementById('settings-volume').value = settings.volume;
    document.getElementById('settings-theme').value = settings.theme;
    document.getElementById('settings-msgfilter').value = settings.msgFilter;
    document.getElementById('settings-modal').style.display = 'flex';
});

document.getElementById('settings-cancel').addEventListener('click', function() {
    document.getElementById('settings-modal').style.display = 'none';
});

document.getElementById('settings-save').addEventListener('click', function() {
    settings.volume = parseInt(document.getElementById('settings-volume').value);
    settings.theme = document.getElementById('settings-theme').value;
    settings.msgFilter = document.getElementById('settings-msgfilter').value;
    saveSettingsToDisk();
    applySettings();
    document.getElementById('settings-modal').style.display = 'none';
    addLog("⚙ Ayarlar kaydedildi.", "#58a6ff");
});

document.getElementById('settings-reset').addEventListener('click', function() {
    if (confirm("Fabrika ayarlarına dönmek istediğinize emin misiniz?")) {
        resetSettings();
        document.getElementById('settings-modal').style.display = 'none';
        addLog("⚙ Ayarlar sıfırlandı.", "#58a6ff");
    }
});

document.getElementById('btn-quit').addEventListener('click', function() {
    if (confirm("Oyundan çıkmak istediğinize emin misiniz?")) {
        window.close(); 
        alert("Oyun kapatılıyor... (Tarayıcıda bu işlev sınırlıdır)");
    }
});
    for (let f1 in factions) {
        factions[f1].relations = {};
        factions[f1].borderAccess = {};
        factions[f1].alliances = {};
        factions[f1].treaties = {};
        for (let f2 in factions) {
            if (f1 === f2) continue;
            factions[f1].relations[f2] = "PEACE";
            factions[f1].borderAccess[f2] = false;
            factions[f1].alliances[f2] = false;
            factions[f1].treaties[f2] = false;
            const key = f1 < f2 ? f1 + '_' + f2 : f2 + '_' + f1;
            if (!relationsScore[key]) relationsScore[key] = 0;
        }
    }
    mapNodes.forEach(n => { if (n.isOrgBase) discoveredBases[n.id] = false; });

    const cList = document.getElementById('country-select-list');
    const oList = document.getElementById('org-select-list');
    
    if (!cList || !oList) {
        console.error('❌ Liste elementleri bulunamadı!');
        return;
    }

    cList.innerHTML = '';
    oList.innerHTML = '';

    for (let code in factions) {
        const fac = factions[code];
        if (!fac) continue;

        const div = document.createElement('div');
        div.className = 'faction-option';
        div.innerText = fac.name;
        div.dataset.code = code;

        div.onclick = function() {
            document.querySelectorAll('.faction-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            playerFaction = code;
            const btn = document.getElementById('btn-start-game');
            btn.innerText = `${fac.name} Olarak Başla`;
            btn.disabled = false;
        };

        if (fac.type === 'country') {
            cList.appendChild(div);
        } else if (fac.type === 'org') {
            oList.appendChild(div);
        }
    }

    console.log(`✅ Ülkeler: ${cList.children.length}, Örgütler: ${oList.children.length}`);

    canvas = document.getElementById("geoMap");
    ctx = canvas.getContext("2d");

    canvas.addEventListener('mousedown', e => { isDragging = true; hasMoved = false; startX = e.clientX - panX; startY = e.clientY - panY; });
    canvas.addEventListener('mousemove', e => { if (isDragging) { panX = e.clientX - startX; panY = e.clientY - startY; hasMoved = true; } });
    canvas.addEventListener('mouseup', e => { isDragging = false; if (!hasMoved) handleMapClick(e); });
    canvas.addEventListener('mouseleave', () => isDragging = false);
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        const mapX = (mouseX - panX)/zoom, mapY = (mouseY - panY)/zoom;
        if (e.deltaY < 0) zoom *= 1.1; else zoom /= 1.1;
        zoom = Math.max(0.4, Math.min(zoom, 4.0));
        panX = mouseX - mapX*zoom; panY = mouseY - mapY*zoom;
    });
    window.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'h') toggleHUD(); });

    setTimeout(() => { generateTradeRoutes(); }, 1000);
});

function startGame() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-container").style.display = "flex";
    document.getElementById("current-faction").innerText = factions[playerFaction].name;
    mapNodes.forEach(n => { if (n.faction === playerFaction) discoveredBases[n.id] = true; });
    const capital = mapNodes.find(n => n.isCapital && n.faction === playerFaction);
    if (capital) {
        const count = factions[playerFaction].fighters || 0;
        for (let i = 0; i < count; i++) {
            airUnits.push({ id: "air_" + Date.now() + "_" + i, type: 'bomber', status: 'idle', x: capital.x, y: capital.y, returnX: capital.x, returnY: capital.y, targetX: null, targetY: null, progress: 0 });
        }
    }
    updateArmySelectDropdown();
    buildTradeDropdown();
    updateLedger();
    updateTechUI();
    updateTradeRoutesUI();
    updateAirUI();
    updateWarReport();
    updateSpaceUI();
    updateGuerrillaUI();
    updateClimateUI();
    startAutoSave();
    setInterval(gameTick, GAME_TICK_INTERVAL);
    setInterval(aiTick, AI_TICK_INTERVAL);
    addLog("🛰️ Oyun başladı. H ile HUD.", "#58a6ff");
}


function buildSpaceStation() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    if (spaceStations[selectedNode.id]) { alert("Zaten uzay üssü var!"); return; }
    if (factions[playerFaction].money < 5000) { alert("5000$ gerekli!"); return; }
    if (techLevel.space < 1) { alert("Uzay teknolojisi gerekli!"); return; }
    factions[playerFaction].money -= 5000;
    spaceStations[selectedNode.id] = true;
    addLogFiltered(`🚀 ${selectedNode.name}'de uzay üssü kuruldu.`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function buildMissileDefense() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    if (missileDefenses[selectedNode.id]) { alert("Zaten füze savunması var!"); return; }
    if (factions[playerFaction].money < 3000) { alert("3000$ gerekli!"); return; }
    if (techLevel.space < 1) { alert("Uzay teknolojisi gerekli!"); return; }
    factions[playerFaction].money -= 3000;
    missileDefenses[selectedNode.id] = true;
    addLogFiltered(`🛡️ ${selectedNode.name}'de füze savunma sistemi kuruldu.`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function launchSatellite() {
    if (!selectedNode) { alert("Hedef seç!"); return; }
    if (techLevel.space < 1) { alert("Uzay teknolojisi gerekli!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 10000) { alert("10000$ gerekli!"); return; }
    fac.money -= 800;
    satellites.push({ id: "sat_" + Date.now(), x: selectedNode.x, y: selectedNode.y, active: true, targetNode: selectedNode.id });
    addLogFiltered(`🛰️ Uydu ${selectedNode.name} yörüngesine yerleştirildi.`, "#38bdf8", selectedNode, playerFaction);
    updateLedger();
    updateSpaceUI();
}

function updateSpaceUI() {
    const el = document.getElementById("space-info");
    el.innerHTML = `🛰️ Uydular: ${satellites.filter(s=>s.active).length}<br>🚀 Uzay Üsleri: ${Object.keys(spaceStations).length}<br>🛡️ Füze Savunma: ${Object.keys(missileDefenses).length}`;
}

function startGuerrilla() {
    if (!selectedNode) { alert("Hedef seç!"); return; }
    if (selectedNode.faction === playerFaction || selectedNode.faction === "NEUTRAL") { alert("Düşman veya tarafsız bir hedef seçin!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 400) { alert("400$ gerekli!"); return; }
    fac.money -= 400;
    guerrillaUnits.push({ id: "guer_" + Date.now(), targetNode: selectedNode.id, progress: 0, damage: 0, active: true });
    addLogFiltered(`🎯 ${selectedNode.name}'de gerilla savaşı başlatıldı.`, "#b83280", selectedNode, playerFaction);
    updateLedger();
    updateGuerrillaUI();
}

function processGuerrilla() {
    guerrillaUnits = guerrillaUnits.filter(g => {
        if (!g.active) return false;
        const target = mapNodes.find(n => n.id === g.targetNode);
        if (!target) return false;
        g.progress += 0.02 + (techLevel.spy || 0) * 0.01;
        if (g.progress >= 1) {
            const dmg = Math.floor(500 + Math.random() * 800);
            target.garrison = Math.max(0, target.garrison - dmg);
            target.industry = Math.max(0, (target.industry || 10) - Math.floor(Math.random() * 5));
            if (target.resourceBonus && target.resourceBonus.oil) target.resourceBonus.oil = Math.max(0, target.resourceBonus.oil - 1);
            addLogFiltered(`💥 Gerilla saldırısı! ${target.name} -${dmg} asker, sanayi azaldı.`, "#da3637", target, playerFaction);
            playSound('explosion');
            g.active = false;
            return false;
        }
        return true;
    });
    updateGuerrillaUI();
}

function updateGuerrillaUI() {
    const el = document.getElementById("guerrilla-info");
    const active = guerrillaUnits.filter(g => g.active);
    el.innerHTML = active.length > 0 ? `Aktif gerilla: ${active.length}` : "Aktif yok";
}

function proposePeaceTreaty() {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Bir ülke seçin!"); return; }
    const target = selectedNode.faction;
    const my = factions[playerFaction];
    const their = factions[target];
    if (my.relations[target] !== "WAR") { alert("Sadece savaş halinde antlaşma yapılabilir!"); return; }
    if (Math.random() < 0.3) {
        const reparations = Math.floor(Math.random() * 500) + 200;
        const ceded = selectedNode;
        if (ceded && ceded.faction === target) {
            ceded.faction = playerFaction;
            ceded.garrison = Math.floor(ceded.garrison * 0.5);
            addLogFiltered(`📄 Barış antlaşması! ${their.name} ${reparations}$ tazminat ve ${ceded.name} toprağını verdi.`, "#238636", ceded, playerFaction);
            my.money += reparations;
            their.money -= reparations;
            my.relations[target] = "PEACE";
            their.relations[playerFaction] = "PEACE";
            peaceTreaties[target] = { terms: 'Toprak ve tazminat', reparations: reparations, cededNodes: [ceded.id] };
        } else {
            my.money += reparations;
            their.money -= reparations;
            my.relations[target] = "PEACE";
            their.relations[playerFaction] = "PEACE";
            addLogFiltered(`📄 Barış antlaşması! ${their.name} ${reparations}$ tazminat ödedi.`, "#238636", selectedNode, playerFaction);
        }
        playSound('click');
    } else {
        addLogFiltered(`❌ Barış antlaşması reddedildi.`, "#f85149", selectedNode, playerFaction);
    }
    updateLedger();
}

function imposeEconomicSanctions() {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Bir ülke seçin!"); return; }
    const target = selectedNode.faction;
    if (target === playerFaction) { alert("Kendine ambargo uygulayamazsın!"); return; }
    const my = factions[playerFaction];
    if (my.money < 500) { alert("500$ gerekli!"); return; }
    my.money -= 500;
    economicSanctions[target] = true;
    document.getElementById("sanction-target").innerText = `${factions[target].name} yaptırım altında`;
    addLogFiltered(`🚫 ${factions[target].name} ülkesine ekonomik yaptırım uygulandı!`, "#ffd700", selectedNode, playerFaction);
    updateLedger();
}

function processSanctions() {
    for (let target in economicSanctions) {
        if (economicSanctions[target]) {
            const fac = factions[target];
            if (fac) {
                fac.money = Math.max(0, fac.money - 50);
                fac.steel = Math.max(0, fac.steel - 5);
                fac.oil = Math.max(0, fac.oil - 3);
                if (factions[playerFaction] && factions[playerFaction].treaties[target]) {
                    factions[playerFaction].treaties[target] = false;
                    factions[target].treaties[playerFaction] = false;
                    addLogFiltered(`⛔ Yaptırımlar nedeniyle ${factions[target].name} ile ticaret anlaşması iptal edildi.`, "#f85149", null, playerFaction);
                }
            }
        }
    }
}

function processClimate() {
    climateTimer++;
    if (climateTimer >= CLIMATE_INTERVAL) {
        climateTimer = 0;
        const r = Math.random();
        if (r < 0.15) {
            const types = ["Kuraklık", "Sel", "Soğuk Hava", "Fırtına"];
            const type = types[Math.floor(Math.random() * types.length)];
            climateState = type;
            climateDuration = 300 + Math.floor(Math.random() * 200);
            addLogFiltered(`🌦️ İklim Değişikliği: ${type} başladı!`, "#ff9f43", null, playerFaction);
            document.getElementById("climateDisplay").innerText = type;
            const fac = factions[playerFaction];
            const owned = mapNodes.filter(n => n.faction === playerFaction);
            if (type === "Kuraklık") {
                fac.food = Math.max(0, (fac.food || 0) - 50);
                owned.forEach(n => { n.pop = Math.max(1000, n.pop - Math.floor(n.pop * 0.02)); });
            } else if (type === "Sel") {
                owned.forEach(n => { if (n.isCoastal) n.garrison = Math.max(0, n.garrison - Math.floor(n.garrison * 0.1)); });
            } else if (type === "Soğuk Hava") {
                fac.steel = Math.max(0, (fac.steel || 0) - 15);
                fac.oil = Math.max(0, (fac.oil || 0) - 10);
            } else if (type === "Fırtına") {
                fac.steel = Math.max(0, (fac.steel || 0) - 20);
                fac.money = Math.max(0, fac.money - 200);
            }
            if (Math.random() < 0.3) {
                const from = owned[Math.floor(Math.random() * owned.length)];
                if (from) {
                    const to = mapNodes.filter(n => n.faction !== playerFaction && n.faction !== "NEUTRAL" && Math.hypot(n.x - from.x, n.y - from.y) < 150);
                    if (to.length > 0) {
                        const target = to[Math.floor(Math.random() * to.length)];
                        const migrants = Math.floor(from.pop * 0.01);
                        from.pop = Math.max(1000, from.pop - migrants);
                        target.pop += migrants;
                        addLogFiltered(`🚶 İklim nedeniyle ${migrants} kişi ${from.name}'den ${target.name}'e göç etti.`, "#8b949e", from, playerFaction);
                    }
                }
            }
        } else if (climateDuration > 0) {
            climateDuration--;
            if (climateDuration === 0) {
                climateState = 0;
                document.getElementById("climateDisplay").innerText = "Normal";
                addLogFiltered(`🌤️ İklim normale döndü.`, "#58a6ff", null, playerFaction);
            }
        }
    }
}

function updateClimateUI() {
    document.getElementById("climateDisplay").innerText = climateState || "Normal";
}

function onlineLobby() {
    if (onlineLobbyActive) {
        onlineLobbyActive = false;
        document.getElementById("online-lobby").style.display = "none";
        document.getElementById("online-status").innerText = "Çevrimdışı";
        addLog("🌐 Lobi'den ayrıldı.", "#8b949e");
        return;
    }
    onlineLobbyActive = true;
    document.getElementById("online-lobby").style.display = "block";
    document.getElementById("online-status").innerText = "Çevrimiçi (Lobi)";
    lobbyPlayers = [];
    const names = ["Ateş", "Kar", "Rüzgar", "Toprak", "Yıldırım", "Deniz", "Dağ", "Nehir"];
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        lobbyPlayers.push({ name: names[Math.floor(Math.random() * names.length)] + (i+1), ready: Math.random() > 0.5 });
    }
    updateLobbyUI();
    addLog(`🌐 Lobi oluşturuldu, ${lobbyPlayers.length} oyuncu bağlandı.`, "#58a6ff");
}

function updateLobbyUI() {
    const el = document.getElementById("lobby-players");
    el.innerHTML = lobbyPlayers.map(p => `${p.name} ${p.ready ? '✅' : '⏳'}`).join('<br>');
}

function initiateTrade(resourceType, amount, isBuy) {
    speed: getNavalSpeed();
    const fac = factions[playerFaction];
    const targetId = document.getElementById("trade-target-select").value;
    const dest = mapNodes.find(n => n.id === targetId);
    if (!dest) { alert("Hedef liman seçin!"); return; }
    if (fac.relations[dest.faction] === "WAR") { alert("Savaşta ticaret olmaz!"); return; }
    if (embargoActive) { alert("Ambargo aktif!"); return; }
    if (economicSanctions[dest.faction]) { alert(`${factions[dest.faction].name} yaptırım altında!`); return; }
    
    const price = getDynamicPrice(resourceType, isBuy);
    const totalCost = amount * price;
    if (isBuy) {
        if (fac.money < totalCost) { alert("Yeterli para yok!"); return; }
        fac.money -= totalCost; 
    } else {
        if (fac[resourceType] < amount) { alert("Yeterli kaynak yok!"); return; }
        fac[resourceType] -= amount;
    }
    
    const port = mapNodes.find(n => n.isCoastal && n.faction === playerFaction);
    if (!port) { alert("Kendi limanınız yok!"); return; }
    
    const recamount = parseInt(document.getElementById('cargo-recamount').value) || 10;
    const realAmount = amount * 2; 
    const dprice = getDynamicPrice(cargoType, false) * 1.5;

    merchantShips.push({
        id: "trade_" + Date.now(),
        owner: playerFaction,
        x: port.x, y: port.y,
        targetX: dest.x, targetY: dest.y,
        startX: port.x, startY: port.y,
        destFaction: dest.faction,
        speed: 0.4,
        state: 'going',
        tradeType: isBuy ? 'buy' : 'sell',
        resource: resourceType,
        recamount: amount,
        price: dprice,
        totalValue: totalCost,
        cargo: { type: cargoType, recamount: realAmount },
        totalValue: realAmount * price
    });
    addLogFiltered(`🚢 Ticaret gemisi ${dest.name}'e ${resourceType} ${isBuy?'alım':'satım'} için yola çıktı.`, "#ecc94b", dest, playerFaction);
    updateLedger();
}

function getDynamicPrice(resource, isBuy) {
    const fac = factions[playerFaction];
    const stock = fac[resource] || 0;
    let basePrice = { oil: 20, food: 10, steel: 12 }[resource] || 10;
    let factor = 1 + (100 - Math.min(stock, 100)) / 200;
    if (!isBuy) factor = 1 - (Math.min(stock, 100)) / 300;  
    return Math.max(1, Math.round(basePrice * factor));
}

function buildFactory(type) {
    if (selectedNode.factory) { alert("Bu şehirde zaten fabrika var!"); return; }
    selectedNode.factory = true;
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtinizi seçin!"); return; }
    const fac = factions[playerFaction];
    const cost = { steel: 200 };
    if (fac.money < cost[type]+1500) { alert(`Yeterli bütçe yok! (${cost[type],"1500 para"})`); return; }
    fac.money -= cost[type] + 1500;
    if (type === 'steel') fac.steel = (fac.steel || 0) + 5;
    selectedNode.industry = (selectedNode.industry || 10) + 5;
    addLogFiltered(`🏗️ ${type} fabrikası kuruldu, sanayi +5`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function buildRefinery() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtinizi seçin!"); return; }
    if (selectedNode.refinery) { alert("Zaten rafineri var!"); return; }
    if (factions[playerFaction].money < 3000) { alert("3000$ gerekli!"); return; }
    factions[playerFaction].money -= 3000;
    selectedNode.refinery = true;
    addLogFiltered(`🛢️ ${selectedNode.name}'de rafineri kuruldu.`, "#ecc94b", selectedNode, playerFaction);
    updateLedger();
}

function buildPort() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtinizi seçin!"); return; }
    if (selectedNode.isCoastal) { alert("Zaten liman var!"); return; }
    if (factions[playerFaction].money < 2000) { alert("2000$ gerekli!"); return; }
    factions[playerFaction].money -= 2000;
    selectedNode.isCoastal = true;
    addLogFiltered(`🏗️ ${selectedNode.name} limanı inşa edildi.`, "#ecc94b", selectedNode, playerFaction);
    buildTradeDropdown();
    updateLedger();
}

function buildAirDefense() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    if (airDefenses[selectedNode.id]) { alert("Zaten hava savunması var!"); return; }
    if (factions[playerFaction].money < 5000) { alert("5000$ gerekli!"); return; }
    factions[playerFaction].money -= 5000;
    airDefenses[selectedNode.id] = true;
    addLogFiltered(`🛡️ ${selectedNode.name} hava savunma sistemi kuruldu.`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function buildRadar() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    if (radarStations[selectedNode.id]) { alert("Zaten radar var!"); return; }
    if (factions[playerFaction].money < 5000) { alert("5000$ gerekli!"); return; }
    factions[playerFaction].money -= 5000;
    radarStations[selectedNode.id] = { x: selectedNode.x, y: selectedNode.y };
    addLogFiltered(`📡 ${selectedNode.name}'de radar kuruldu.`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function buildNavalBase() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    if (!selectedNode.isCoastal) { alert("Sadece kıyı şehirlerine deniz üssü kurulabilir!"); return; }
    if (navalBases[selectedNode.id]) { alert("Zaten deniz üssü var!"); return; }
    if (factions[playerFaction].money < 8000) { alert("8000$ gerekli!"); return; }
    factions[playerFaction].money -= 8000;
    navalBases[selectedNode.id] = true;
    addLogFiltered(`⚓ ${selectedNode.name}'de deniz üssü kuruldu.`, "#38bdf8", selectedNode, playerFaction);
    updateLedger();
}

function buildAsset(type) {
    const fac = factions[playerFaction];
    const capital = mapNodes.find(n => n.isCapital && n.faction === playerFaction);
    if (!capital) { alert("Başkent bulunamadı!"); return; }
    if (type === 'warship' && fac.money >= 10000 && fac.steel >= 250) {
        fac.money -= 10000; fac.steel -= 250;
        const sea = mapNodes.find(n => n.isSea);
        if (!sea) { alert("Deniz bulunamadı!"); return; }
        armies.push({ id:"fl_"+Date.now(), name:"Fırkateyn", size:1, type:"FLEET", owner:playerFaction, x:sea.x, y:sea.y, targetNode:null, status:"STANDBY" });
        addLog("⚓ Fırkateyn denize indi.", "#38bdf8");
    } else if (type === 'sub' && fac.money >= 10000 && fac.steel >= 250) {
        fac.money -= 10000; fac.steel -= 250;
        const sea = mapNodes.find(n => n.isSea);
        if (!sea) { alert("Deniz bulunamadı!"); return; }
        armies.push({ id:"fl_"+Date.now(), name:"Denizaltı", size:1, type:"FLEET", owner:playerFaction, x:sea.x, y:sea.y, targetNode:null, status:"STANDBY" });
        addLog("⚓ Denizaltı göreve başladı.", "#38bdf8");
    } else if (type === 'plane' && fac.money >= 10000 && fac.steel >= 250) {
        fac.money -= 10000; fac.steel -= 250;
        const tip = confirm("Bombardıman uçağı mı? (Tamam -> Bombardıman, İptal -> Keşif)") ? 'bomber' : 'scout';
        airUnits.push({id: "air_" + Date.now(),type: tip,status: 'idle',owner: playerFaction,x: capital.x,y: capital.y,returnX: capital.x,returnY: capital.y,targetX: null,targetY: null,progress: 0});        fac.fighters = (fac.fighters || 0) + 1;
        addLog(`✈️ ${tip === 'bomber' ? 'Bombardıman' : 'Keşif'} uçağı eklendi.`, "#38bdf8");
        updateAirUI();
    } else if (type === 'tank' && fac.money >= 10000 && fac.steel >= 250 && techLevel.land >= 2) {
        fac.money -= 10000; fac.steel -= 250;
        armies.push({ id:"tk_"+Date.now(), name:"Zırhlı Tugay", size:800, type:"LAND", owner:playerFaction, x: selectedNode ? selectedNode.x : capital.x, y: selectedNode ? selectedNode.y : capital.y, targetNode:null, status:"STANDBY", isTank: true });
        addLog("🎖️ Tank birliği kuruldu.", "#ffd700");
    } else if (type === 'artillery' && fac.money >= 10000 && fac.steel >= 250 && techLevel.land >= 1) {
        fac.money -= 10000; fac.steel -= 250;
        armies.push({ id:"art_"+Date.now(), name:"Topçu Birliği", size:500, type:"LAND", owner:playerFaction, x: selectedNode ? selectedNode.x : capital.x, y: selectedNode ? selectedNode.y : capital.y, targetNode:null, status:"STANDBY", isArtillery: true });
        addLog("💥 Topçu birliği kuruldu.", "#ff9f43");
    } else if (type === 'commando' && fac.money >= 10000 && fac.steel >= 250 && fac.steel >= 30) {
        fac.money -= 10000; fac.steel -= 250; fac.steel -= 30;
        armies.push({ id:"cmd_"+Date.now(), name:"Komando Birliği", size:300, type:"LAND", owner:playerFaction, x: selectedNode ? selectedNode.x : capital.x, y: selectedNode ? selectedNode.y : capital.y, targetNode:null, status:"STANDBY", isCommando: true });
        addLog("🎯 Komando birliği kuruldu.", "#ff9f43");
    } else if (type === 'marine' && fac.money >= 10000 && fac.steel >= 250 && fac.steel >= 20) {
        fac.money -= 10000; fac.steel -= 250; fac.steel -= 20;
        armies.push({ id:"mar_"+Date.now(), name:"Deniz Piyade Tugayı", size:400, type:"LAND", owner:playerFaction, x: selectedNode ? selectedNode.x : capital.x, y: selectedNode ? selectedNode.y : capital.y, targetNode:null, status:"STANDBY", isMarine: true });
        addLog("⚓ Deniz piyade birliği kuruldu.", "#38bdf8");
    } else if (type === 'drone' && fac.money >= 10000 && fac.steel >= 250 && techLevel.air >= 1) {
        fac.money -= 10000; fac.steel -= 250;
        airUnits.push({id: "drone_" + Date.now(),type: 'drone',status: 'idle',owner: playerFaction,x: capital.x,y: capital.y,returnX: capital.x,returnY: capital.y,targetX: null,targetY: null,progress: 0});        updateAirUI();
    } else alert("Kaynak yetersiz veya teknoloji seviyesi yetersiz!");
    updateArmySelectDropdown();
    updateLedger();
}

function launchBomber() {
    if (!selectedNode) { alert("Hedef seç!"); return; }
    if (selectedNode.faction === playerFaction || selectedNode.faction === "NEUTRAL") { alert("Düşman veya tarafsız bir hedef seçin!"); return; }
    const bomber = airUnits.find(u => u.status === 'idle' && u.type === 'bomber');
    if (!bomber) { alert("Müsait bombardıman uçağı yok!"); return; }
    const fac = factions[playerFaction];
    if (fac.oil < 30) { alert("30 petrol gerekli!"); return; }
    fac.oil -= 30;
    bomber.status = 'mission';
    bomber.targetX = selectedNode.x;
    bomber.targetY = selectedNode.y;
    bomber.progress = 0;
    addLogFiltered(`✈️ Bombardıman uçağı ${selectedNode.name}'e gidiyor.`, "#ff9f43", selectedNode, playerFaction);
}

function launchScout() {
    if (!selectedNode) { alert("Keşif yapılacak hedef seç!"); return; }
    const scout = airUnits.find(u => u.status === 'idle' && (u.type === 'scout' || u.type === 'drone'));
    if (!scout) { alert("Müsait keşif uçağı veya İHA yok!"); return; }
    const fac = factions[playerFaction];
    if (fac.oil < 15) { alert("15 petrol gerekli!"); return; }
    fac.oil -= 15;
    scout.status = 'mission';
    scout.targetX = selectedNode.x;
    scout.targetY = selectedNode.y;
    scout.progress = 0;
    addLogFiltered(`🛰️ Keşif uçağı ${selectedNode.name}'e gidiyor.`, "#38bdf8", selectedNode, playerFaction);
}

function deploySpy() {
    if (!selectedNode) { alert("Hedef seç!"); return; }
    if (selectedNode.faction === playerFaction || selectedNode.faction === "NEUTRAL") { alert("Düşman veya tarafsız bir hedef seçin!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 1000) { alert("1000$ gerekli!"); return; }
    if (techLevel.spy < 1) { alert("Casusluk teknolojisi gerekli!"); return; }
    fac.money -= 1000;
    spies.push({ id: "spy_" + Date.now(), targetNode: selectedNode.id, progress: 0, success: false });
    addLogFiltered(`🕵️ Casus ${selectedNode.name}'e gönderildi.`, "#8b949e", selectedNode, playerFaction);
    updateLedger();
}

function processSpies() {
    spies = spies.filter(s => {
        const target = mapNodes.find(n => n.id === s.targetNode);
        if (!target) return false;
        s.progress += 0.02 + (techLevel.spy || 0) * 0.01;
        if (s.progress >= 1) {
            const info = {
                garrison: target.garrison,
                industry: target.industry,
                money: factions[target.faction] ? factions[target.faction].money : 0,
                food: factions[target.faction] ? factions[target.faction].food : 0
            };
            addLogFiltered(`🕵️ Casus ${target.name} bilgilerini çaldı: Garnizon ${info.garrison}, Sanayi ${info.industry}`, "#8b949e", target, playerFaction);
            return false;
        }
        return true;
    });
}

function recruitTroops() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi semtini seç!"); return; }
    const amount = parseInt(document.getElementById("recruit-amount").value);
    const max = Math.floor(selectedNode.pop * 0.10);
    if (amount > max) { alert(`Maks ${max} asker!`); return; }
    const costGold = Math.floor(amount * 1.0);
    const costArms = Math.floor(amount * 2.0);
    const fac = factions[playerFaction];
    if (fac.money < costGold || fac.steel < costArms) { alert("Yetersiz kaynak!"); return; }
    fac.money -= costGold; fac.steel -= costArms;
    armies.push({ id: "army_" + Date.now() + Math.random(), name: `${armies.filter(a=>a.owner===playerFaction).length+1}. Kolordu`, size: amount, type: "LAND", owner: playerFaction, x: selectedNode.x, y: selectedNode.y, targetNode: null, status: "STANDBY" });
    addLogFiltered(`🪖 ${selectedNode.name}'de ordu kuruldu.`, "#58a6ff", selectedNode, playerFaction);
    updateArmySelectDropdown();
    updateLedger();
}

function orderMove(unitType) {
    const select = document.getElementById('army-select');
    const armyId = select.value;
    const army = armies.find(a => a.id === armyId);
    if (!army) { alert("Ordu seç!"); return; }
    if (!selectedNode) { alert("Hedef seç!"); return; }
    if (unitType === 'LAND' && selectedNode.isSea) { alert("Kara denize açılamaz!"); return; }
    if (unitType === 'FLEET' && !selectedNode.isSea && !selectedNode.isCoastal) { alert("Donanma sadece liman kentlerine veya denize gidebilir!"); return; }
    const armyi = armies.find(a => a.owner === playerFaction && a.status === "STANDBY" && a.type === unitType);
    if (!army) { alert(`Hazır ${unitType} birliği yok!`); return; }
    const currentNode = mapNodes.find(n => n.x === army.x && n.y === army.y);
    if (!currentNode) { alert("Birliğin bulunduğu şehir bulunamadı!"); return; }
    if (!currentNode.neighbors || !currentNode.neighbors.includes(selectedNode.id)) {
        alert(`${selectedNode.name} şehrine doğrudan bağlantı yok! Sadece komşu şehirlere gidilebilir.`);
        return;
    }
    if (selectedNode.faction !== playerFaction && selectedNode.faction !== "NEUTRAL") {
        const rel = factions[playerFaction].relations[selectedNode.faction];
        const key = playerFaction < selectedNode.faction ? playerFaction + '_' + selectedNode.faction : selectedNode.faction + '_' + playerFaction;
        if (rel !== "WAR" && !factions[selectedNode.faction].borderAccess[playerFaction] && !nonAggressionPacts[key]) {
            alert("Askeri geçiş izni yok!");
            return;
        }
    }
    army.targetNode = selectedNode;
    army.status = "MOVING";
    addLogFiltered(`🏹 ${army.name} ${selectedNode.name}'e yürüyor.`, "#ff9f43", selectedNode, playerFaction);
}


function sabotageNode() {
    if (!selectedNode || selectedNode.faction === playerFaction) { alert("Düşman veya tarafsız bir bölge seçin!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 300) { alert("300$ gerekli!"); return; }
    fac.money -= 300;
    const target = selectedNode;
    const damage = Math.floor(Math.random() * 500) + 200;
    target.garrison = Math.max(0, target.garrison - damage);
    if (target.industry) target.industry = Math.max(0, target.industry - Math.floor(Math.random() * 10));
    if (target.resourceBonus && target.resourceBonus.oil) target.resourceBonus.oil = Math.max(0, target.resourceBonus.oil - 1);
    addLogFiltered(`💣 ${target.name} sabotaj! -${damage} asker, sanayi azaldı.`, "#f85149", target, playerFaction);
    playSound('explosion');
    updateLedger();
}

function blockadePort() {
    if (!selectedNode || !selectedNode.isCoastal || selectedNode.faction === playerFaction) { alert("Düşman limanı seçin!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 400) { alert("400$ gerekli!"); return; }
    const fleet = armies.find(a => a.owner === playerFaction && a.type === "FLEET" && a.status === "STANDBY");
    if (!fleet) { alert("Hazır donanma birliği yok!"); return; }
    fac.money -= 400;
    blockades[selectedNode.id] = true;
    fleet.targetNode = selectedNode;
    fleet.status = "MOVING";
    addLogFiltered(`⛔ ${selectedNode.name} limanı ablukaya alınıyor.`, "#ecc94b", selectedNode, playerFaction);
    updateLedger();
}

function toggleEmbargo() {
    embargoActive = !embargoActive;
    document.getElementById("embargo-status").innerText = embargoActive ? "✅ Aktif" : "Kapalı";
    addLog(`⛔ Ambargo ${embargoActive ? 'etkinleştirildi' : 'devre dışı'}.`, "#ecc94b");
}

function launchManualTradeShip() {
    speed: getNavalSpeed();
    const fac = factions[playerFaction];
    const targetId = document.getElementById("trade-target-select").value;
    const dest = mapNodes.find(n => n.id === targetId);
    if (!dest) { alert("Hedef liman seçin!"); return; }

    const cargoType = document.getElementById('cargo-type').value;
    let cargoAmount = parseInt(document.getElementById('cargo-amount').value);
    if (isNaN(cargoAmount) || cargoAmount <= 0) {
        alert("Geçerli miktar girin!");
        return;
    }

    const realAmount = cargoAmount * 2;

    if (fac.relations[dest.faction] === "WAR") { alert("Savaşta ticaret olmaz!"); return; }
    if (embargoActive) { alert("Ambargo aktif!"); return; }
    if (economicSanctions[dest.faction]) { alert(`${factions[dest.faction].name} yaptırım altında!`); return; }
    if (fac.money < 200) { alert("Lojistik için 200$ gerekli!"); return; }
    if (fac[cargoType] < realAmount) { alert(`Yetersiz ${cargoType}!`); return; }

    const port = mapNodes.find(n => n.isCoastal && n.faction === playerFaction);
    if (!port) { alert("Kendi limanınız yok!"); return; }

    fac[cargoType] -= realAmount;
    fac.money -= 200;

    const price = getDynamicPrice(cargoType, false) * 1.5; 
    merchantShips.push({
        id: "ship_" + Date.now(),
        owner: playerFaction,
        x: port.x, y: port.y,
        targetX: dest.x, targetY: dest.y,
        startX: port.x, startY: port.y,
        destFaction: dest.faction,
        speed: 0.3,
        state: 'going',
        cargo: { type: cargoType, amount: realAmount },
        totalValue: realAmount * price,
        tradeType: 'sell'
    });

    addLogFiltered(`🚢 Kargo gemisi ${dest.name}'e gidiyor (${realAmount} ${cargoType}).`, "#ecc94b", dest, playerFaction);
    updateLedger();
}

function negotiatePeace() {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Bir ülke seçin!"); return; }
    const target = selectedNode.faction;
    const my = factions[playerFaction];
    const their = factions[target];
    const key = playerFaction < target ? playerFaction + '_' + target : target + '_' + playerFaction;
    if (my.relations[target] !== "WAR") { alert("Zaten barış durumundasınız!"); return; }
    if (Math.random() < 0.4 + (relationsScore[key] || 0) / 200) {
        my.relations[target] = "PEACE";
        their.relations[playerFaction] = "PEACE";
        their.borderAccess[playerFaction] = false;
        relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 15);
        addLogFiltered(`🤝 ${their.name} ile barış sağlandı (müzakere).`, "#238636", selectedNode, playerFaction);
        playSound('click');
    } else {
        addLogFiltered(`❌ ${their.name} barış teklifini reddetti.`, "#f85149", selectedNode, playerFaction);
    }
    updateLedger();
}

function callUN() {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Bir ülke seçin!"); return; }
    const target = selectedNode.faction;
    const my = factions[playerFaction];
    const their = factions[target];
    if (my.relations[target] !== "WAR") { alert("Sadece savaş halinde BM'ye başvurabilirsiniz!"); return; }
    if (Math.random() < 0.3) {
        unSanction = true;
        their.money = Math.max(0, their.money - 2000);
        addLogFiltered(`🇺🇳 BM, ${their.name} ülkesine yaptırım uyguladı! -2000$`, "#ffd700", selectedNode, playerFaction);
        playSound('war');
    } else {
        addLogFiltered(`🇺🇳 BM talebiniz reddedildi.`, "#8b949e", selectedNode, playerFaction);
    }
    updateLedger();
}

function dipAction(type) {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Geçerli hedef seçin!"); return; }
    const target = selectedNode.faction;
    const my = factions[playerFaction];
    const their = factions[target];
    const key = playerFaction < target ? playerFaction + '_' + target : target + '_' + playerFaction;

    if (type === 'war') {
        my.relations[target] = "WAR";
        their.relations[playerFaction] = "WAR";
        my.alliances[target] = false;
        relationsScore[key] = Math.max(-100, (relationsScore[key] || 0) - 30);
        for (let f in factions) {
            if (f !== playerFaction && f !== target && my.alliances[f]) {
                factions[f].relations[target] = "WAR";
                factions[target].relations[f] = "WAR";
                addLogFiltered(`⚔️ Müttefik ${factions[f].name} savaşa katıldı!`, "#f85149", selectedNode, playerFaction);
            }
        }
        addLogFiltered(`🚨 Savaş ilan edildi!`, "#f85149", selectedNode, playerFaction);
    } else if (type === 'alliance') {
        if (my.relations[target] === "WAR") { alert("Savaşta ittifak olmaz!"); return; }
        if (Math.random() < 0.4 + (relationsScore[key] || 0) / 200) {
            my.alliances[target] = true;
            their.alliances[playerFaction] = true;
            relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 20);
            addLogFiltered("🤝 İttifak kuruldu.", "#58a6ff", selectedNode, playerFaction);
        } else addLogFiltered("İttifak reddedildi.", "#8b949e", selectedNode, playerFaction);
    } else if (type === 'treaty') {
        if (Math.random() < 0.5 + (relationsScore[key] || 0) / 200) {
            my.treaties[target] = true;
            their.treaties[playerFaction] = true;
            relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 10);
            addLogFiltered("📜 Ticaret anlaşması.", "#238636", selectedNode, playerFaction);
        } else addLogFiltered("Anlaşma reddedildi.", "#8b949e", selectedNode, playerFaction);
    } else if (type === 'access') {
        if (Math.random() < 0.35 + (relationsScore[key] || 0) / 200) {
            their.borderAccess[playerFaction] = true;
            relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 5);
            addLogFiltered("🔓 Geçiş izni alındı.", "#38bdf8", selectedNode, playerFaction);
        } else addLogFiltered("Geçiş izni reddedildi.", "#f85149", selectedNode, playerFaction);
    } else if (type === 'peace') {
        my.relations[target] = "PEACE";
        their.relations[playerFaction] = "PEACE";
        their.borderAccess[playerFaction] = false;
        relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 15);
        addLogFiltered("🕊️ Barış sağlandı.", "#58a6ff", selectedNode, playerFaction);
    } else if (type === 'nonaggression') {
        if (my.relations[target] === "WAR") { alert("Savaşta saldırmazlık olmaz!"); return; }
        if (Math.random() < 0.5 + (relationsScore[key] || 0) / 200) {
            nonAggressionPacts[key] = true;
            relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 10);
            addLogFiltered("📜 Saldırmazlık paktı imzalandı.", "#2d3748", selectedNode, playerFaction);
        } else addLogFiltered("Saldırmazlık reddedildi.", "#8b949e", selectedNode, playerFaction);
    } else if (type === 'vassal') {
        if (my.relations[target] === "WAR") { alert("Savaşta haraca bağlama olmaz!"); return; }
        if (their.money < 1000 && Math.random() < 0.3) {
            vassalStates[key] = true;
            relationsScore[key] = Math.min(100, (relationsScore[key] || 0) + 5);
            addLogFiltered(`👑 ${their.name} haraca bağlandı!`, "#b83280", selectedNode, playerFaction);
        } else addLogFiltered("Haraca bağlama başarısız.", "#8b949e", selectedNode, playerFaction);
    }
    updateLedger();
    updateDiplomacyUI(target);
}

function updateDiplomacyUI(target) {
    const key = playerFaction < target ? playerFaction + '_' + target : target + '_' + playerFaction;
    const score = relationsScore[key] || 0;
    const bar = document.getElementById("dip-bar");
    const pct = Math.max(0, Math.min(100, 50 + score / 2));
    bar.style.width = pct + '%';
    bar.style.background = score > 30 ? '#238636' : (score < -30 ? '#f85149' : '#58a6ff');
    document.getElementById("dip-score").innerText = score;
}

let researchQueue = null;

function researchTechTree(techId) {
    const tech = techTree[techId];
    if (!tech) return;
    if (tech.level >= tech.max) { alert("Maksimum seviye!"); return; }
    if (researchQueue) { alert("Zaten bir araştırma devam ediyor!"); return; }

    const fac = factions[playerFaction];
    const cost = tech.cost + tech.level * 200;
    if (fac.money < cost) { alert(`Yeterli para yok! (${cost}$)`); return; }

    fac.money -= cost;
    researchQueue = { techId, remainingTime: tech.researchTime };
    addLogFiltered(`🔬 ${tech.icon} ${tech.label} araştırması başladı (${cost}$)`, "#58a6ff", null, playerFaction);
    updateTechUI();
    updateLedger();
}

function updateResearch() {
    if (!researchQueue) return;
    
    researchQueue.remainingTime--;
    if (researchQueue.remainingTime <= 0) {
        const techId = researchQueue.techId;
        const tech = techTree[techId];
        
        tech.level++;  
        
        if (techId === 'land_speed') techLevel.land = tech.level;
        else if (techId === 'naval_speed') {
            techLevel.naval = tech.level;
            updateNavalSpeeds(); 
        }
        else if (techId === 'air_power') techLevel.air = tech.level;
        else if (techId === 'spy_tech') techLevel.spy = tech.level;
        else if (techId === 'space_tech') techLevel.space = tech.level;

        addLogFiltered(`✅ ${tech.icon} ${tech.label} seviye ${tech.level} tamamlandı!`, "#58a6ff", null, playerFaction);
        researchQueue = null;
        updateTechUI();
        updateLedger();
    }
}

setInterval(updateResearch, 1000);


function updateTechUI() {
    const grid = document.getElementById("tech-tree-grid");
    const items = grid.querySelectorAll(".tech-item");
    let totalLevel = 0;
    items.forEach(el => {
        const tid = el.dataset.tech;
        const tech = techTree[tid];
        if (tech) {
            totalLevel += tech.level;
            el.classList.toggle("unlocked", tech.level > 0);
            const costEl = el.querySelector(".tech-cost");
            if (costEl) {
                const cost = tech.cost + tech.level * 150;
                costEl.textContent = tech.level >= tech.max ? 'MAX' : cost + '$';
            }
            el.style.borderColor = tech.level >= tech.max ? '#238636' : (tech.level > 0 ? '#58a6ff' : '#21262d');
        }
    });
    document.getElementById("techStatus").innerText = `Araştırma: ${totalLevel} seviye`;
}

function generateTradeRoutes() {
    const nodes = mapNodes.filter(n => !n.isSea && n.faction !== "NEUTRAL");
    const newRoutes = [];
    for (let i = 0; i < Math.min(8, nodes.length); i++) {
        const from = nodes[Math.floor(Math.random() * nodes.length)];
        let candidates = nodes.filter(n => n.faction !== from.faction && n.isCoastal && n.faction !== "NEUTRAL");
        if (candidates.length === 0) continue;
        const to = candidates[Math.floor(Math.random() * candidates.length)];
        const val = Math.floor(50 + Math.random() * 150);
        newRoutes.push({ from: from.id, to: to.id, value: val, fromFaction: from.faction, toFaction: to.faction });
    }
    tradeRoutes = newRoutes;
    updateTradeRoutesUI();
}

function updateTradeRoutesUI() {
    const list = document.getElementById("trade-route-list");
    list.innerHTML = "";
    if (tradeRoutes.length === 0) { list.innerHTML = "Aktif rota yok"; return; }
    tradeRoutes.forEach(r => {
        const div = document.createElement("div");
        div.style.cssText = "display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px dotted #1c212a;font-size:9px;";
        div.innerHTML = `<span>${r.from} ➔ ${r.to}</span><span style="color:#ffd700;">${r.value}💰</span>`;
        list.appendChild(div);
    });
}

function updateLedger() {
    if (!playerFaction) return;
    const fac = factions[playerFaction];
    if (!fac) return;
    document.getElementById("res-money").innerHTML = Math.round(fac.money);
    document.getElementById("res-oil").innerHTML = fac.oil;
    document.getElementById("res-steel").innerHTML = fac.steel || 0;
    document.getElementById("res-fighters").innerHTML = fac.fighters || 0;
    document.getElementById("res-food").innerHTML = fac.food || 0;

    const list = document.getElementById("army-ledger-list");
    list.innerHTML = "";
    const myArmies = armies.filter(a => a.owner === playerFaction);
    myArmies.forEach(a => {
        const d = document.createElement("div");
        let label = '';
        if (a.isTank) label = '🎖️';
        else if (a.isArtillery) label = '💥';
        else if (a.isCommando) label = '🎯';
        else if (a.isMarine) label = '⚓';
        d.innerText = `• ${label}${a.name} [${a.size}] ${a.status}`;
        list.appendChild(d);
    });
}

function updateArmySelectDropdown() {
    const select = document.getElementById('army-select');
    if (!select) return;
    const currentVal = select.value; 
    select.innerHTML = '';
    const standbyArmies = armies.filter(a => a.owner === playerFaction && a.status === "STANDBY");
    standbyArmies.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.text = `${a.name} (${a.size})`;
        select.appendChild(opt);
    });
    if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
        select.value = currentVal;
    }
}

function updateAirUI() {
    const list = document.getElementById("air-unit-list");
    list.innerHTML = "";
    if (airUnits.length === 0) { list.innerHTML = "Uçak yok"; return; }
    airUnits.forEach(u => {
        const div = document.createElement("div");
        div.style.cssText = "font-size:10px;padding:2px 0;border-bottom:1px dotted #1c212a;";
        const tip = u.type === 'bomber' ? '💣' : (u.type === 'drone' ? '🛸' : '🛰️');
        div.innerText = `${tip} ${u.type.toUpperCase()} ${u.status === 'idle' ? '🟢 Hazır' : '🔴 Görevde'}`;
        list.appendChild(div);
    });
}

function updateWarReport() {
    document.getElementById("war-report").innerHTML = `
        ⚔️ Savaş: ${warReport.battles}<br>
        ✅ Galibiyet: ${warReport.wins}<br>
        ❌ Mağlubiyet: ${warReport.losses}<br>
        💀 Kayıp: ${warReport.totalCasualties}
    `;
}

function getTerrainBonus(node, type) {
    if (!node) return 1;
    if (type === 'defense') {
        if (node.terrain === 'MOUNTAIN') return 1.4;
        if (node.terrain === 'HILLY') return 1.2;
        if (node.terrain === 'PLATEAU') return 1.1;
        return 1;
    }
    if (type === 'movement') {
        if (node.terrain === 'PLAIN') return 1.3;
        if (node.terrain === 'DESERT') return 0.8;
        if (node.terrain === 'MOUNTAIN') return 0.5;
        return 1;
    }
    return 1;
}

function getLogisticsCost(fromNode, toNode) {
    if (!fromNode || !toNode) return 1;
    const dist = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y);
    const baseCost = 1 + Math.floor(dist / 200) * 0.1;
    return Math.min(baseCost, 2.5);
}

function triggerGlobalEvent() {
    const events = [
        { name: "Ekonomik Kriz", effect: (f) => { f.money = Math.floor(f.money * 0.8); }, msg: "📉 Ekonomik kriz! Tüm ülkelerin parası %20 azaldı." },
        { name: "Salgın", effect: (f) => { f.steel = Math.floor(f.steel * 0.9); f.pop = Math.max(1000, f.pop - Math.floor(f.pop * 0.02)); }, msg: "🦠 Salgın! Askeri güç %10 azaldı, nüfus azaldı." },
        { name: "Altın Buluntusu", effect: (f) => { f.money += 500; }, msg: "💰 Altın buluntusu! +500$." },
        { name: "Teknoloji Keşfi", effect: (f) => { if (f === factions[playerFaction]) techLevel.air += 1; }, msg: "🔬 Teknoloji keşfi! Hava teknolojisi +1." },
    ];
    const evt = events[Math.floor(Math.random() * events.length)];
    globalEvent = evt.name;
    eventDuration = 300;
    for (let code in factions) {
        const fac = factions[code];
        if (fac.type === 'org') continue;
        evt.effect(fac);
    }
    addLogFiltered(`🌍 Küresel Olay: ${evt.msg}`, "#ffd700", null, null);
    document.getElementById("globalEventDisplay").innerText = evt.name;
}

function gameTick() {
    if (gameWon) return;
    updateVisibility();
    
    if (Math.random() < 0.003) {
    const desertNodes = mapNodes.filter(n => n.terrain === "DESERT" && n.refinery);
    if (desertNodes.length > 0) {
        const target = desertNodes[Math.floor(Math.random() * desertNodes.length)];
        sandstorms.push({ nodeId: target.id, duration: 200 + Math.random() * 300 });
        addLogFiltered(`🌪️ ${target.name} çölünde kum fırtınası! Rafineri üretimi düşecek.`, "#ff9f43", target, null);
    }
}
sandstorms = sandstorms.filter(s => {
    s.duration--;
    const node = mapNodes.find(n => n.id === s.nodeId);
    if (node && node.refinery) {
        node.sandstormActive = true;
        if (s.duration <= 0) {
            node.sandstormActive = false;
            return false;
        }
        return true;
    }
    return false;
});

if (Math.random() < 0.005) { 
    const seaNodes = mapNodes.filter(n => n.isSea);
    if (seaNodes.length > 0) {
        const center = seaNodes[Math.floor(Math.random() * seaNodes.length)];
        storms.push({
            x: center.x,
            y: center.y,
            radius: 100 + Math.random() * 150,
            duration: 300 + Math.random() * 400,
            intensity: 0.5 + Math.random() * 0.5
        });
        addLogFiltered(`🌪️ ${center.name} bölgesinde fırtına oluştu!`, "#ff9f43", center, null);
    }
}

storms = storms.filter(s => {
    s.duration--;
    merchantShips.forEach(ship => {
        const dist = Math.hypot(ship.x - s.x, ship.y - s.y);
        if (dist < s.radius) {
            ship.speed = Math.max(0.05, ship.speed * 0.8); 
            if (Math.random() < 0.01 * s.intensity) {
                if (ship.owner === playerFaction) {
                    addLogFiltered(`🌊 Fırtına geminize hasar verdi! (${ship.id})`, "#f85149", null, playerFaction);
                }
                if (Math.random() < 0.1) {
                    return false; 
                }
            }
        }
    });
    armies.filter(a => a.type === "FLEET").forEach(fleet => {
        const dist = Math.hypot(fleet.x - s.x, fleet.y - s.y);
        if (dist < s.radius) {
            fleet.size = Math.max(0, fleet.size - Math.floor(s.intensity * 5));
            if (fleet.size <= 0) {
                fleet.status = "DESTROYED";
            }
        }
    });
    return s.duration > 0;
});

for (let pShip of pirateShips) {
    if (pShip.state === 'idle') {
        for (let mShip of merchantShips) {
            if (mShip.owner === pShip.owner) continue;
            const dist = Math.hypot(pShip.x - mShip.x, pShip.y - mShip.y);
            if (dist < 50) {
                if (Math.random() < 0.7) {
                    const cargo = mShip.cargo || { type: 'money', amount: 100 };
                    const owner = factions[pShip.owner];
                    if (cargo.type === 'money') owner.money += cargo.amount * 2;
                    else if (cargo.type === 'oil') owner.oil = (owner.oil || 0) + cargo.amount;
                    else if (cargo.type === 'food') owner.food = (owner.food || 0) + cargo.amount;
                    else if (cargo.type === 'steel') owner.steel = (owner.steel || 0) + cargo.amount;
                    addLogFiltered(`🏴‍☠️ ${factions[pShip.owner].name} ${mShip.owner} gemisini yağmaladı! (+${cargo.amount} ${cargo.type})`, "#ff9f43", null, pShip.owner);
                    const idx = merchantShips.indexOf(mShip);
                    if (idx > -1) merchantShips.splice(idx, 1);
                    pShip.state = 'returning';
                } else {
                    addLogFiltered(`💥 ${factions[pShip.owner].name} saldırısı püskürtüldü!`, "#da3637", null, pShip.owner);
                }
                break;
            }
        }
    } else if (pShip.state === 'attacking') {
        let targetNode = null;
        if (pShip.targetType === 'port') {
            targetNode = mapNodes.find(n => n.id === pShip.targetId);
        } else if (pShip.targetType === 'ship') {
            const targetShip = merchantShips.find(s => s.id === pShip.targetId);
            if (targetShip) {
                targetNode = { x: targetShip.x, y: targetShip.y };
            }
        }
        if (!targetNode) {
            pShip.state = 'returning';
            continue;
        }
        const dx = targetNode.x - pShip.x;
        const dy = targetNode.y - pShip.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            pShip.x += (dx / dist) * pShip.speed;
            pShip.y += (dy / dist) * pShip.speed;
        } else {
            if (pShip.targetType === 'port') {
                const port = mapNodes.find(n => n.id === pShip.targetId);
                if (port && port.faction !== pShip.owner) {
                    const dmg = Math.floor(200 + Math.random() * 400);
                    port.garrison = Math.max(0, port.garrison - dmg);
                    const targetFac = factions[port.faction];
                    if (targetFac) {
                        const lootMoney = Math.floor(100 + Math.random() * 400);
                        const lootOil = Math.floor(5 + Math.random() * 20);
                        const lootSteel = Math.floor(5 + Math.random() * 15);
                        const lootFood = Math.floor(10 + Math.random() * 30);
                        targetFac.money = Math.max(0, targetFac.money - lootMoney);
                        targetFac.oil = Math.max(0, targetFac.oil - lootOil);
                        targetFac.steel = Math.max(0, targetFac.steel - lootSteel);
                        targetFac.food = Math.max(0, targetFac.food - lootFood);
                        const owner = factions[pShip.owner];
                        if (owner) {
                            owner.money += lootMoney;
                            owner.oil = (owner.oil || 0) + lootOil;
                            owner.steel = (owner.steel || 0) + lootSteel;
                            owner.food = (owner.food || 0) + lootFood;
                        }
                        addLogFiltered(`🏴‍☠️ ${port.name} limanı yağmalandı! -${dmg} garnizon, +$${lootMoney}, +${lootOil} petrol, +${lootSteel} çelik, +${lootFood} gıda`, "#ff9f43", port, pShip.owner);
                        playSound('explosion');
                    }
                }
            } else if (pShip.targetType === 'ship') {
                const targetShip = merchantShips.find(s => s.id === pShip.targetId);
                if (targetShip) {
                    const cargo = targetShip.cargo || { type: 'money', amount: 100 };
                    const owner = factions[pShip.owner];
                    if (cargo.type === 'money') owner.money += cargo.amount * 2;
                    else if (cargo.type === 'oil') owner.oil = (owner.oil || 0) + cargo.amount;
                    else if (cargo.type === 'food') owner.food = (owner.food || 0) + cargo.amount;
                    else if (cargo.type === 'steel') owner.steel = (owner.steel || 0) + cargo.amount;
                    addLogFiltered(`🏴‍☠️ ${factions[pShip.owner].name} ${targetShip.owner} gemisini yağmaladı!`, "#ff9f43", null, pShip.owner);
                    const idx = merchantShips.indexOf(targetShip);
                    if (idx > -1) merchantShips.splice(idx, 1);
                }
            }
            pShip.state = 'returning';
            pShip.targetType = null;
            pShip.targetId = null;
        }
    } else if (pShip.state === 'returning') {
        const base = mapNodes.find(n => n.faction === pShip.owner && n.isOrgBase);
        if (base) {
            const dx = base.x - pShip.x, dy = base.y - pShip.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 5) {
                pShip.x += (dx / dist) * pShip.speed;
                pShip.y += (dy / dist) * pShip.speed;
            } else {
                pShip.state = 'idle';
                pShip.x = base.x;
                pShip.y = base.y;
                pShip.targetType = null;
                pShip.targetId = null;
                addLogFiltered(`🏴‍☠️ Korsan gemisi ${base.name} üssüne döndü.`, "#58a6ff", base, pShip.owner);
            }
        } else {
            return false;
        }
    }
}
    
    if (researchQueue) {
        researchQueue.remainingTime--;
        if (researchQueue.remainingTime <= 0) {
            const tech = techTree[researchQueue.techId];
            if (tech) {
                tech.level++;
                addLog(`🔬 ${tech.label} araştırması tamamlandı! Seviye ${tech.level}`, "#58a6ff");
            }
            researchQueue = null;
            updateTechUI();
            updateLedger();
        }
    }
    
    taxTimer++;
    if (taxTimer >= TAX_INTERVAL) {
        taxTimer = 0;
        const fac = factions[playerFaction];
        const owned = mapNodes.filter(n => n.faction === playerFaction);
        let tax = 0;
        owned.forEach(n => { tax += Math.floor(n.pop / 100000) * 8 + 50; });
        if (unSanction) tax = Math.floor(tax * 0.8);
        fac.money += tax;
        addLogFiltered(`💰 Vergi +$${tax}`, "#238636", null, playerFaction);
    }

    factoryTimer++;
    if (factoryTimer % 10 === 0) {
    let totalOutput = 0;
    for (let id in powerPlants) {
        totalOutput += powerPlants[id].output;
    }
    let consumption = 0;
    const owned = mapNodes.filter(n => n.faction === playerFaction);
    owned.forEach(n => {
        if (n.hasFactory) consumption += 5;
        if (n.refinery) consumption += 3;
        if (navalBases[n.id]) consumption += 2;
        if (spaceStations[n.id]) consumption += 10;
        if (missileDefenses[n.id]) consumption += 4;
    });
    totalPower = totalOutput;
    powerConsumption = consumption;
    const charge = Math.max(0, totalOutput - consumption);
    factions[playerFaction].charge = charge;}
    if (factoryTimer >= FACTORY_INTERVAL) {
        factoryTimer = 0;
        const fac = factions[playerFaction];
        const owned = mapNodes.filter(n => n.faction === playerFaction);
        owned.forEach(n => {
            if (n.industry > 0) {
                fac.steel = (fac.steel || 0) + Math.floor(n.industry * 0.15);
                fac.food = (fac.food || 0) + Math.floor(n.industry * 0.05);
            }
            if (n.refinery && n.resourceBonus && n.resourceBonus.oil) {
                const eff = 1 + (techTree.refinery_eff ? techTree.refinery_eff.level * 0.2 : 0);
                fac.oil += n.resourceBonus.oil * 1.5 * eff;
            }
        });
    }

    inflationTimer++;
    if (inflationTimer >= INFLATION_INTERVAL) {
        inflationTimer = 0;
        let rate = (Math.random() * 8) + 3;
        const atWar = Object.values(factions[playerFaction].relations).some(r => r === "WAR");
        if (atWar) rate *= 1.5;
    }

    unTimer++;
    if (unTimer >= UN_INTERVAL) {
        unTimer = 0;
        if (unSanction) { unSanction = false; addLogFiltered(`🇺🇳 BM yaptırımları kaldırıldı.`, "#58a6ff", null, playerFaction); document.getElementById("sanctionDisplay").innerText = "Yok"; }
    }

    eventTimer++;
    if (eventTimer >= EVENT_INTERVAL) {
        eventTimer = 0;
        if (Math.random() < 0.3) triggerGlobalEvent();
    }
    if (globalEvent && eventDuration > 0) {
        eventDuration--;
        if (eventDuration === 0) { globalEvent = null; document.getElementById("globalEventDisplay").innerText = "Yok"; }
    }

    processClimate();
    processSpies();
    processGuerrilla();
    processSanctions();

armies = armies.filter(a => {
    if (a.size <= 0 || a.status === "DESTROYED") return false;

    if (a.status === "MOVING" && a.targetNode) {
        const dx = a.targetNode.x - a.x, dy = a.targetNode.y - a.y;
        const dist = Math.hypot(dx, dy);
        
        let speed = 0.4 + (techLevel.land || 0) * 0.05;
        if (a.type === "FLEET") speed = 0.7 + (techLevel.naval || 0) * 0.05;
        if (a.isTank) speed += 0.1;
        if (a.isCommando) speed += 0.15;
        if (a.isMarine) speed += 0.1;

        const fromNode = mapNodes.find(n => n.x === a.x && n.y === a.y);
        if (fromNode) speed *= getTerrainBonus(fromNode, 'movement');

        if (dist > 2) {
            a.x += (dx / dist) * speed;
            a.y += (dy / dist) * speed;
        } else {
            a.x = a.targetNode.x;
            a.y = a.targetNode.y;
            const targetNode = a.targetNode;
            
            const hasEnemy = (targetNode.faction !== a.owner && targetNode.garrison > 0) ||
                armies.some(oth => oth.owner !== a.owner && oth.targetNode && oth.targetNode.id === targetNode.id && oth.status === "STANDBY");            
            if (hasEnemy) {
                resolveBattle(a, targetNode);
            } else {
                a.status = "STANDBY";
                a.targetNode = null;
                if (targetNode.faction !== a.owner) {
                    targetNode.faction = a.owner;
                    targetNode.garrison = a.size;
                    a.size = 0;
                    addLogFiltered(`🏴 ${targetNode.name} işgal edildi.`, "#58a6ff", targetNode, a.owner);
                    checkVictory();
                    checkAllianceVictory();
                }
                updateLedger();
            }
        }
    }
    return true; 
});

    merchantShips = merchantShips.filter(ship => {
        const targetNode = mapNodes.find(n => n.x === ship.targetX && n.y === ship.targetY);
        if (targetNode && blockades[targetNode.id] && ship.owner !== playerFaction) {
            if (isAllyOrPlayer(targetNode.faction)) {
                addLogFiltered(`⛔ ${targetNode.name} abluka altında, gemi geri döndü.`, "#f85149", targetNode, null);
            }
            return false;
        }
        if (embargoActive && ship.owner === playerFaction) {
            addLogFiltered(`⛔ Ambargo nedeniyle ticaret iptal.`, "#f85149", null, playerFaction);
            return false;
        }
        if (economicSanctions[ship.destFaction] && ship.owner === playerFaction) {
            addLogFiltered(`⛔ Yaptırımlar nedeniyle ${factions[ship.destFaction].name} ile ticaret engellendi.`, "#f85149", null, playerFaction);
            return false;
        }
        let dx, dy, dist;
        if (ship.state === 'going') {
            dx = ship.targetX - ship.x; dy = ship.targetY - ship.y;
            dist = Math.hypot(dx, dy);
            if (dist > 2) {
                ship.x += (dx/dist) * ship.speed;
                ship.y += (dy/dist) * ship.speed;
                return true;
            } else {
                ship.state = 'returning';
                ship.x = ship.targetX; ship.y = ship.targetY;
                return true;
            }
        } else {
            dx = ship.startX - ship.x; dy = ship.startY - ship.y;
            dist = Math.hypot(dx, dy);
            if (dist > 2) {
                ship.x += (dx/dist) * ship.speed;
                ship.y += (dy/dist) * ship.speed;
                return true;
            } else {
                if (ship.owner === playerFaction) {
                    const fac = factions[playerFaction];
                    if (ship.tradeType === 'buy') {
                        fac[ship.resource] = (fac[ship.resource] || 0) + ship.amount;
                        addLogFiltered(`💰 ${ship.amount} ${ship.resource} alındı (değerli kargo)!`, "#238636", null, playerFaction);
                    } else {
                        const bonus = Math.floor(ship.amount * 0.2); 
                        fac.money += ship.totalValue + bonus;
                        addLogFiltered(`💰 ${ship.resource} satıldı, +${ship.totalValue + bonus}$ (prim dahil)!`, "#238636", null, playerFaction);
                    }
                }
                return false;
            }
        }
    });

airUnits.forEach(unit => {

    if (unit.status === 'mission' && unit.targetX !== null && unit.targetY !== null) {
        ctx.strokeStyle = "rgba(255, 215, 0, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(unit.x, unit.y);
        ctx.lineTo(unit.targetX, unit.targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "rgba(0, 229, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(unit.x, unit.y);
        ctx.lineTo(unit.returnX, unit.returnY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    let icon = '✈️';
    if (unit.type === 'bomber') icon = '💣';
    else if (unit.type === 'drone') icon = '🛸';
    else if (unit.type === 'scout') icon = '🔭';

    const color = unit.status === 'idle' ? '#58a6ff' : '#ff9f43';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(icon, unit.x, unit.y - 6);
    ctx.shadowBlur = 0;

    if (unit.status === 'mission') {
        ctx.fillStyle = '#ffd700';
        ctx.font = '8px monospace';
        ctx.fillText('▶', unit.x + 14, unit.y - 6);
    }
});

    if (checkAllianceVictory()) return;

    mapNodes.forEach(n => {
        if (n.resourceBonus && n.resourceBonus.oil && n.resourceBonus.oil > 0) {
            const neighbors = mapNodes.filter(m => m.faction !== n.faction && m.faction !== "NEUTRAL" && Math.hypot(m.x - n.x, m.y - n.y) < 100);
            if (neighbors.length > 0 && Math.random() < 0.005) {
                const attacker = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (factions[attacker.faction] && factions[attacker.faction].relations[n.faction] !== "WAR") {
                    factions[attacker.faction].relations[n.faction] = "WAR";
                    factions[n.faction].relations[attacker.faction] = "WAR";
                    addLogFiltered(`🔥 ${factions[attacker.faction].name} ${n.name} petrolü için savaş ilan etti!`, "#f85149", n, attacker.faction);
                }
            }
        }
    });

    updateWarReport();
    updateClimateUI();
    drawMap();
    updateLedger();
    updateAirUI();
    updateSpaceUI();
    updateGuerrillaUI();
    if (onlineLobbyActive) updateLobbyUI();
}
function calculatePower(army, node) {
    let power = army.size;
    if (army.isTank) power += 500;
    if (army.isArtillery) power += 300;
    if (army.isCommando) power += 200;
    if (army.isMarine) power += 250;
    if (army.owner === playerFaction) {
        if (army.type === "LAND") power *= (1 + techLevel.land * 0.05);
        else if (army.type === "FLEET") power *= (1 + techLevel.naval * 0.05);
    }
    const defBonus = getTerrainBonus(node, 'defense');
    power *= defBonus;
    return power;
}
function resolveBattle(army, node) {
    const hasEnemyGarrison = node.garrison > 0 && node.faction !== army.owner;
    const hasEnemyArmy = armies.some(a => a.owner !== army.owner && a.targetNode && a.targetNode.id === node.id && a.status === "STANDBY");
    if (!hasEnemyGarrison && !hasEnemyArmy) {
        army.x = node.x;
        army.y = node.y;
        army.status = "STANDBY";
        army.targetNode = null;
        if (node.faction !== army.owner) {
            node.faction = army.owner;
            node.garrison = army.size;
            army.size = 0;
            if (isAllyOrPlayer(army.owner) || isAllyOrPlayer(node.faction)) {
                addLogFiltered(`🏴 ${node.name} ele geçirildi!`, "#58a6ff", node, army.owner);
        }
    updateArmySelectDropdown()
    checkVictory();
    checkAllianceVictory();
}
        updateLedger();
        return;
    }

    if (army.type === "FLEET" && node.isCoastal) {
        const damage = Math.floor(500 + Math.random() * 1000);
        node.garrison = Math.max(0, node.garrison - damage);
        node.industry = Math.max(0, (node.industry || 10) - Math.floor(Math.random() * 5));
        addLogFiltered(`⚓ Donanma ${node.name}'i bombaladı! -${damage} asker, sanayi azaldı.`, "#38bdf8", node, army.owner);
        army.status = "STANDBY";
        army.targetNode = null;
        updateLedger();
        return;
    }

    const enemies = armies.filter(a => a.owner !== army.owner && a.targetNode === node && a.status === "STANDBY");
    let totalEnemy = enemies.reduce((s, a) => s + a.size, 0);
    totalEnemy += node.garrison; 

    let attackBonus = 1;
    if (army.owner === playerFaction) {
        if (army.type === "LAND") attackBonus += techLevel.land * 0.1;
        else if (army.type === "FLEET") attackBonus += techLevel.naval * 0.1;
    }
    if (army.isTank) attackBonus += 0.3;
    if (army.isArtillery) attackBonus += 0.2;
    if (army.isCommando) attackBonus += 0.25;
    if (army.isMarine) attackBonus += 0.15;

    const defenseBonus = getTerrainBonus(node, 'defense');
    const myPower = army.size * attackBonus;
    const enemyPower = totalEnemy * defenseBonus;

    warReport.battles++;

    if (myPower > enemyPower) {
        const loss = Math.floor(army.size * 0.1);
        army.size -= loss;
        enemies.forEach(e => e.size = 0);
        node.garrison = 0;
        warReport.wins++;
        warReport.totalCasualties += Math.floor(totalEnemy * 0.5);
        if (isAllyOrPlayer(army.owner) || isAllyOrPlayer(node.faction)) {
            addLogFiltered(`⚔️ ${army.name} (${army.size} kaldı) zafer!`, "#238636", node, army.owner);
            playSound('explosion');
        }
        if (node.faction !== army.owner && node.faction !== "NEUTRAL") {
            node.faction = army.owner;
            node.garrison = army.size;
            army.size = 0;
            if (isAllyOrPlayer(army.owner) || isAllyOrPlayer(node.faction)) {
                addLogFiltered(`🏴 ${node.name} ele geçirildi!`, "#58a6ff", node, army.owner);
            }
            checkVictory();
            checkAllianceVictory();
        }
    } else {
        const loss = Math.floor(totalEnemy * 0.2);
        army.size = Math.max(0, army.size - loss);
        enemies.forEach(e => e.size = Math.max(0, e.size - Math.floor(e.size * 0.15)));
        node.garrison = Math.max(0, node.garrison - Math.floor(node.garrison * 0.15));
        warReport.losses++;
        warReport.totalCasualties += Math.floor(army.size * 0.2);
        if (isAllyOrPlayer(army.owner) || isAllyOrPlayer(node.faction)) {
            addLogFiltered(`💀 ${army.name} yenildi! (${army.size} kaldı)`, "#da3637", node, army.owner);
        }
        if (army.size <= 0) {
            army.status = "DESTROYED";
        } else {
            const capital = mapNodes.find(n => n.isCapital && n.faction === army.owner);
            if (capital) {
                army.targetNode = capital;
                army.status = "MOVING";
                addLogFiltered(`🏃 ${army.name} ${capital.name} mevzisine çekiliyor.`, "#ecc94b", capital, army.owner);
            }
        }
    }
    updateLedger();
    updateWarReport();
}

function checkVictory() {
    const capitals = mapNodes.filter(n => n.isCapital && n.faction !== "NEUTRAL");
    const allMine = capitals.every(n => n.faction === playerFaction);
    if (allMine && !gameWon) {
        gameWon = true;
        addLog("🏆 TÜM BAŞKENTLER ELE GEÇİRİLDİ! ZAFER!", "#ffd700");
        document.getElementById("victory-status").innerText = "🏆 ZAFER!";
        document.getElementById("victory-detail").innerText = "Dünya sizin!";
        playSound('war');
    } else {
        document.getElementById("victory-status").innerText = "Devam ediyor...";
        document.getElementById("victory-detail").innerText = "";
    }
}

function checkAllianceVictory() {
    if (!playerFaction) return false;
    const myAllies = Object.keys(factions).filter(f => factions[playerFaction].alliances[f]);
    myAllies.push(playerFaction);
    const capitals = mapNodes.filter(n => n.isCapital && n.faction !== "NEUTRAL");
    const alliedCapitals = capitals.filter(n => myAllies.includes(n.faction));
    if (alliedCapitals.length === capitals.length && capitals.length > 0) {
        gameWon = true;
        addLog("🏆 İTTİFAK ZAFERİ! Tüm başkentler müttefiklerin elinde!", "#ffd700");
        document.getElementById("victory-status").innerText = "🏆 İTTİFAK ZAFERİ!";
        document.getElementById("victory-detail").innerText = `${factions[playerFaction].name} ve müttefikleri dünyaya hükmediyor!`;
        playSound('war');
        return true;
    }
    return false;
}

function aiTick() {
    orgRaid();

for (let code in factions) {
    if (code === playerFaction) continue;
    const fac = factions[code];
    if (fac.type === 'org') continue;

    const neighbors = mapNodes.filter(n => n.faction === code);
    let neighborCountries = new Set();
    neighbors.forEach(node => {
        node.neighbors.forEach(nid => {
            const neighborNode = mapNodes.find(m => m.id === nid);
            if (neighborNode && neighborNode.faction !== code && neighborNode.faction !== "NEUTRAL") {
                neighborCountries.add(neighborNode.faction);
            }
        });
    });

    const myPower = calculateMilitaryPower(code);
    neighborCountries.forEach(targetCode => {
        const targetPower = calculateMilitaryPower(targetCode);
        const ratio = targetPower / myPower;
        const key = code < targetCode ? code + '_' + targetCode : targetCode + '_' + code;

        if (ratio > 1.5 && fac.relations[targetCode] !== "WAR") {
            if (!nonAggressionPacts[key] && !fac.alliances[targetCode]) {
                if (Math.random() < 0.05) {
                    fac.alliances[targetCode] = true;
                    factions[targetCode].alliances[code] = true;
                    addLogFiltered(`🤝 ${fac.name}, ${factions[targetCode].name} ile ittifak kurdu (tehdit algısı).`, "#58a6ff", null, code);
                } else if (Math.random() < 0.08) {
                    nonAggressionPacts[key] = true;
                    addLogFiltered(`📜 ${fac.name}, ${factions[targetCode].name} ile saldırmazlık imzaladı.`, "#2d3748", null, code);
                }
            }
        }
        else if (ratio < 0.7 && fac.relations[targetCode] !== "WAR") {
            if (Math.random() < 0.03) {
                fac.relations[targetCode] = "WAR";
                factions[targetCode].relations[code] = "WAR";
                addLogFiltered(`⚔️ ${fac.name}, ${factions[targetCode].name} ülkesine savaş ilan etti (yayılmacılık).`, "#f85149", null, code);
            }
        }
    });
}

function calculateMilitaryPower(factionCode) {
    let power = 0;
    armies.filter(a => a.owner === factionCode).forEach(a => {
        power += a.size * (a.isTank ? 2 : 1) * (a.isArtillery ? 1.5 : 1);
    });
    armies.filter(a => a.owner === factionCode && a.type === "FLEET").forEach(a => {
        power += a.size * 1.2;
    });
    const fac = factions[factionCode];
    power += (fac.fighters || 0) * 10;
    mapNodes.filter(n => n.faction === factionCode).forEach(n => {
        power += n.garrison * 0.5;
    });
    return power;
}
    
    if (fac.money > 1000 && fac.oil > 50 && Math.random() < 0.03) {
        const myPort = mapNodes.find(n => n.faction === code && n.isCoastal && navalBases[n.id]);
        if (myPort) {
            const targets = mapNodes.filter(n => n.faction !== code && n.faction !== "NEUTRAL" && n.isCoastal && !blockades[n.id]);
            if (targets.length > 0) {
                const dest = targets[Math.floor(Math.random() * targets.length)];
                const amount = 20 + Math.floor(Math.random() * 50);
                if (fac.oil >= amount) {
                   fac.oil -= amount;
                  fac.money += amount * 15;  
                   addLogFiltered(`🚢 ${fac.name} ${dest.name}'e ${amount} varil petrol sattı.`, "#ecc94b", dest, code);
                }
            }
        }
    }
    if (fac.money > 2000 && Math.random() < 0.05) {
        const coastalCities = mapNodes.filter(n => n.faction === code && n.isCoastal && !navalBases[n.id]);
        if (coastalCities.length > 0) {
            const target = coastalCities[Math.floor(Math.random() * coastalCities.length)];
            fac.money -= 2000;
            navalBases[target.id] = true;
            addLogFiltered(`⚓ ${fac.name} ${target.name}'de deniz üssü kurdu.`, "#38bdf8", target, code);
        }
    }
    for (let code in factions) {
        if (code === playerFaction) continue;
        const fac = factions[code];
        if (fac.type === 'org') {
            if (Math.random() < 0.1 && fac.money > 200) {
                const targets = mapNodes.filter(n => n.faction !== code && n.faction !== "NEUTRAL");
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    fac.relations[target.faction] = "WAR";
                    factions[target.faction].relations[code] = "WAR";
                    addLogFiltered(`💀 ${fac.name} ${target.name}'e saldırdı!`, "#f85149", target, code);
                }
            }
            continue;
        }
        if (fac.money > 500 && Math.random() < 0.15) {
            const myNodes = mapNodes.filter(n => n.faction === code);
            if (myNodes.length > 0) {
                const node = myNodes[Math.floor(Math.random() * myNodes.length)];
                if (!node.refinery && fac.money > 600) {
                    node.refinery = true;
                    fac.money -= 600;
                    addLogFiltered(`🏭 ${fac.name} ${node.name}'de rafineri kurdu.`, "#58a6ff", node, code);
                } else if (fac.money > 400) {
                    fac.money -= 200;
                    node.industry = (node.industry || 10) + 5;
                    addLogFiltered(`🏭 ${fac.name} ${node.name}'de sanayi inşa etti.`, "#58a6ff", node, code);
                }
            }
        }
        if (Math.random() < 0.05) {
            const others = Object.keys(factions).filter(f => f !== code && factions[f].type === 'country');
            if (others.length > 0) {
                const partner = others[Math.floor(Math.random() * others.length)];
                if (fac.relations[partner] !== "WAR" && !fac.treaties[partner]) {
                    if (Math.random() < 0.4) {
                        fac.treaties[partner] = true;
                        factions[partner].treaties[code] = true;
                        addLogFiltered(`📜 ${fac.name} ve ${factions[partner].name} ticaret anlaşması imzaladı.`, "#238636", null, code);
                    }
                }
            }
        }
        if (Math.random() < 0.03) {
            const threats = Object.keys(factions).filter(f => f !== code && factions[f].type === 'country' && fac.relations[f] === "WAR");
            if (threats.length > 0) {
                const potentialAllies = Object.keys(factions).filter(f => f !== code && factions[f].type === 'country' && fac.relations[f] !== "WAR" && !fac.alliances[f]);
                if (potentialAllies.length > 0) {
                    const ally = potentialAllies[Math.floor(Math.random() * potentialAllies.length)];
                    if (Math.random() < 0.5) {
                        fac.alliances[ally] = true;
                        factions[ally].alliances[code] = true;
                        addLogFiltered(`🤝 ${fac.name} ve ${factions[ally].name} ittifak kurdu.`, "#58a6ff", null, code);
                    }
                }
            }
        }
        if (Math.random() < 0.08 && fac.money > 300) {
            const myNodes = mapNodes.filter(n => n.faction === code);
            if (myNodes.length > 0) {
                const from = myNodes[Math.floor(Math.random() * myNodes.length)];
                let targets = mapNodes.filter(n => n.faction !== code && n.faction !== "NEUTRAL");
                const enemies = Object.keys(fac.relations).filter(f => fac.relations[f] === "WAR");
                if (enemies.length > 0) {
                    targets = targets.filter(n => enemies.includes(n.faction));
                }
                if (targets.length === 0) {
                    targets = mapNodes.filter(n => n.faction !== code && n.faction !== "NEUTRAL" && Math.random() < 0.02);
                }
                if (targets.length > 0 && from.neighbors) {
                    const reachable = targets.filter(t => from.neighbors.includes(t.id));
                    if (reachable.length > 0) {
                        const dest = reachable[Math.floor(Math.random() * reachable.length)];
                        if (dest) {
                            fac.money -= 200;
                            armies.push({
                                id: "ai_" + Date.now() + Math.random(),
                                name: `${fac.name} Ordusu`,
                                size: Math.round(1500 + Math.random() * 2500),
                                type: "LAND",
                                owner: code,
                                x: from.x, y: from.y,
                                targetNode: dest,
                                status: "MOVING"
                            });
                            if (isAllyOrPlayer(dest.faction)) {
                                addLogFiltered(`⚔️ ${fac.name} ${dest.name}'e saldırı başlattı!`, "#f85149", dest, code);
                            }
                        }
                    }
                }
            }
        }
    }
}

function drawMap() {
    updateVisibility();
    scanRadar();
    ctx.fillStyle = "#0b1820";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    pirateShips.forEach(p => {
        if (p.owner === playerFaction || p.state !== 'idle') {
            let targetX = null, targetY = null;

            if (p.state === 'attacking') {
                if (p.targetType === 'port') {
                    let node = mapNodes.find(n => n.id === p.targetId);
                    if (node) { targetX = node.x; targetY = node.y; }
                } else if (p.targetType === 'ship') {
                    let ship = merchantShips.find(s => s.id === p.targetId);
                    if (ship) { targetX = ship.x; targetY = ship.y; }
                }
            } else if (p.state === 'returning') {
                let base = mapNodes.find(n => n.faction === p.owner && n.isOrgBase);
                if (base) { targetX = base.x; targetY = base.y; }
            }

            if (targetX !== null) {
                ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.shadowColor = "rgba(255, 0, 0, 0.5)";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ff3333";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("P", p.x, p.y + 1);

            if (p.state === 'attacking') {
                ctx.fillStyle = "#ff9f43";
                ctx.font = "8px sans-serif";
                ctx.fillText("⚔", p.x + 12, p.y - 10);
            } else if (p.state === 'returning') {
                ctx.fillStyle = "#58a6ff";
                ctx.font = "8px sans-serif";
                ctx.fillText("↩", p.x + 12, p.y - 10);
            }
        }
    });

    if (mapLoaded && mapImage) {
        const cw = canvas.width / zoom, ch = canvas.height / zoom;
        const imgAspect = mapImage.width / mapImage.height;
        let drawW = cw, drawH = ch;
        if (imgAspect > cw/ch) { drawH = cw / imgAspect; } else { drawW = ch * imgAspect; }
        const offsetX = (cw - drawW)/2, offsetY = (ch - drawH)/2;
        ctx.drawImage(mapImage, offsetX, offsetY, drawW, drawH);
    } else {
        ctx.strokeStyle = "rgba(0,255,100,0.12)";
        ctx.lineWidth = 0.5;
        for (let y = 0; y < 1200; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(2000,y); ctx.stroke(); }
        for (let x = 0; x < 2000; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,1200); ctx.stroke(); }
        ctx.strokeStyle = "rgba(0,255,100,0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(1000,600,500,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(1000,600,250,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle = "rgba(20,80,30,0.3)";
        ctx.beginPath(); ctx.moveTo(200,80); ctx.lineTo(450,60); ctx.lineTo(650,120); ctx.lineTo(600,250); ctx.lineTo(400,280); ctx.lineTo(200,220); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(30,100,40,0.25)";
        ctx.beginPath(); ctx.moveTo(400,320); ctx.lineTo(700,380); ctx.lineTo(650,550); ctx.lineTo(400,520); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(25,90,35,0.25)";
        ctx.beginPath(); ctx.moveTo(100,380); ctx.lineTo(350,380); ctx.lineTo(320,520); ctx.lineTo(100,520); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(30,90,40,0.2)";
        ctx.beginPath(); ctx.moveTo(700,100); ctx.lineTo(1600,100); ctx.lineTo(1800,400); ctx.lineTo(1500,600); ctx.lineTo(700,400); ctx.closePath(); ctx.fill();
    }

    ctx.strokeStyle = "rgba(0,255,150,0.15)";
    ctx.lineWidth = 1;
    mapNodes.forEach(n => {
        if (n.neighbors) {
            n.neighbors.forEach(nid => {
                const neighbor = mapNodes.find(m => m.id === nid);
                if (neighbor) { ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(neighbor.x,neighbor.y); ctx.stroke(); }
            });
        }
    });

    tradeRoutes.forEach(r => {
        const from = mapNodes.find(n => n.id === r.from);
        const to = mapNodes.find(n => n.id === r.to);
        if (from && to && (isUnitVisible(from) || isUnitVisible(to))) {
            ctx.strokeStyle = "rgba(255,215,0,0.35)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6,8]);
            ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.lineTo(to.x,to.y); ctx.stroke();
            ctx.setLineDash([]);
            const mx = (from.x+to.x)/2, my = (from.y+to.y)/2;
            ctx.fillStyle = "#ffd700";
            ctx.font = "10px sans-serif";
            ctx.fillText("🚢", mx-6, my+4);
        }
    });

    armies.forEach(a => {
        if (a.status === "MOVING" && a.targetNode && isUnitVisible(a.targetNode)) {
            ctx.strokeStyle = "rgba(255,215,0,0.25)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4,6]);
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(a.targetNode.x,a.targetNode.y); ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    mapNodes.forEach(node => {
        if (node.isOrgBase && !discoveredBases[node.id]) return;
        const fac = factions[node.faction] || { color: "#6b7280" };
        ctx.fillStyle = node.isSea ? "#1d4ed8" : fac.color;
        ctx.shadowColor = "rgba(0,200,255,0.3)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (node.isCapital) ctx.rect(node.x-14, node.y-14, 28, 28);
        else ctx.arc(node.x, node.y, node.isSea ? 18 : 12, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (node.isCoastal && !node.isSea) { ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(node.x,node.y,16,0,Math.PI*2); ctx.stroke(); }
        if (node.refinery) { ctx.fillStyle = "#ffd700"; ctx.font = "14px sans-serif"; ctx.fillText("🛢", node.x-10, node.y-22); }
        if (airDefenses[node.id]) { ctx.fillStyle = "#58a6ff"; ctx.font = "14px sans-serif"; ctx.fillText("🛡️", node.x-20, node.y-28); }
        if (radarStations[node.id]) { ctx.fillStyle = "#38bdf8"; ctx.font = "14px sans-serif"; ctx.fillText("📡", node.x+12, node.y-22); }
        if (navalBases[node.id]) { ctx.fillStyle = "#38bdf8"; ctx.font = "14px sans-serif"; ctx.fillText("⚓", node.x-14, node.y+16); }
        if (spaceStations[node.id]) { ctx.fillStyle = "#58a6ff"; ctx.font = "14px sans-serif"; ctx.fillText("🚀", node.x-16, node.y-32); }
        if (missileDefenses[node.id]) { ctx.fillStyle = "#ff9f43"; ctx.font = "14px sans-serif"; ctx.fillText("🛡️", node.x+18, node.y-32); }
        if (blockades[node.id]) { ctx.fillStyle = "#f85149"; ctx.font = "14px sans-serif"; ctx.fillText("⛔", node.x+8, node.y-22); }
        if (selectedNode === node) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(node.x,node.y,22,0,Math.PI*2); ctx.stroke(); }

        if (showCanvasUI) {
            ctx.fillStyle = "#e6edf3";
            ctx.font = "bold 10px 'Segoe UI', sans-serif";
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 6;
            let labelX = node.x - 20, labelY = node.y - 18;
            if (node.x > 1800) labelX = node.x - 80;
            else if (node.x > 1500) labelX = node.x - 60;
            if (node.y > 1100) labelY = node.y - 16;
            if (node.y < 40) labelY = node.y + 20;
            const neighbors = mapNodes.filter(n => n !== node && Math.hypot(n.x-node.x, n.y-node.y) < 60);
            if (neighbors.length > 2) { labelX = node.x + 18; labelY = node.y - 4; }
            ctx.fillText(node.name, labelX, labelY);
            ctx.shadowBlur = 0;
        }
    });

    armies.forEach(a => {
        if (a.size <= 0) return;
        if (!isUnitVisible(a)) return;
        ctx.fillStyle = a.owner === playerFaction ? "#58a6ff" : "#f85149";
        if (a.isTank) ctx.fillStyle = "#ffd700";
        if (a.isArtillery) ctx.fillStyle = "#ff9f43";
        if (a.isCommando) ctx.fillStyle = "#b83280";
        if (a.isMarine) ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "rgba(255,255,255,0.2)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (a.type === "FLEET") ctx.rect(a.x-8, a.y-8, 16, 16);
        else ctx.arc(a.x, a.y, 9, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (a.isTank || a.isArtillery || a.isCommando || a.isMarine) {
            ctx.fillStyle = "#fff";
            ctx.font = "8px sans-serif";
            ctx.fillText(a.isTank ? "T" : (a.isArtillery ? "A" : (a.isCommando ? "C" : "M")), a.x-3, a.y+3);
        }
    });

    merchantShips.forEach(s => {
        if (isUnitVisible(s)) {
            ctx.fillStyle = "#ffd700";
            ctx.shadowColor = "rgba(255,215,0,0.3)";
            ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(s.x,s.y,5,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    satellites.forEach(s => {
        if (s.active) {
            ctx.fillStyle = "#38bdf8";
            ctx.font = "12px sans-serif";
            ctx.fillText("🛰️", s.x-8, s.y-8);
        }
    });

    ctx.restore();
}


function handleMapClick(e) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const mapX = (canvasX - panX) / zoom;
    const mapY = (canvasY - panY) / zoom;

    let closest = null;
    let minDist = 30;
    mapNodes.forEach(node => {
        if (node.isOrgBase && !discoveredBases[node.id]) return;
        const d = Math.hypot(node.x - mapX, node.y - mapY);
        if (d < minDist) {
            minDist = d;
            closest = node;
        }
    });

    if (!closest) return;
    selectedNode = closest;

    document.getElementById("dst-name").innerText = `📍 ${selectedNode.name}`;
    document.getElementById("dst-pop").innerText = selectedNode.pop.toLocaleString();
    document.getElementById("dst-terrain").innerText = selectedNode.terrain;
    document.getElementById("dst-industry").innerText = selectedNode.industry || 10;
    document.getElementById("dst-garrison").innerText = selectedNode.garrison;
    document.getElementById("dst-harbor").innerText = selectedNode.isCoastal ? '✅' : '❌';
    document.getElementById("dst-refinery").innerText = selectedNode.refinery ? '✅' : '❌';
    document.getElementById("dst-airdef").innerText = airDefenses[selectedNode.id] ? '✅' : '❌';
    document.getElementById("dst-radar").innerText = radarStations[selectedNode.id] ? '✅' : '❌';
    document.getElementById("dst-navalbase").innerText = navalBases[selectedNode.id] ? '✅' : '❌';
    document.getElementById("dst-spacebase").innerText = spaceStations[selectedNode.id] ? '✅' : '❌';
    document.getElementById("dst-missiledef").innerText = missileDefenses[selectedNode.id] ? '✅' : '❌';
    document.getElementById("dst-blockade").innerText = blockades[selectedNode.id] ? '✅' : '❌';
    let prod = "Yok";
    if (selectedNode.refinery && selectedNode.resourceBonus && selectedNode.resourceBonus.oil) {
        const eff = 1 + (techTree.refinery_eff ? techTree.refinery_eff.level * 0.2 : 0);
        prod = Math.round(selectedNode.resourceBonus.oil * 2 * eff) + " varil/tick";
    }
    document.getElementById("dst-oilprod").innerText = prod;
    let neighText = "Yok";
    if (selectedNode.neighbors && selectedNode.neighbors.length > 0) {
        neighText = selectedNode.neighbors.map(id => {
            const n = mapNodes.find(m => m.id === id);
            return n ? n.name : id;
        }).join(", ");
    }
    document.getElementById("dst-neighbors").innerText = neighText;

    const dipPanel = document.getElementById("diplomacy-panel");
    if (selectedNode.faction !== playerFaction && selectedNode.faction !== "NEUTRAL" && selectedNode.faction !== undefined) {
        dipPanel.style.display = "block";
        const tf = factions[selectedNode.faction];
        if (tf) {
            document.getElementById("dip-title").innerHTML = `Diplomasi: ${tf.name}`;
            const rel = factions[playerFaction] ? factions[playerFaction].relations[selectedNode.faction] : "BİLİNMİYOR";
            document.getElementById("dip-relation").innerHTML = rel;
            const key = playerFaction < selectedNode.faction ? playerFaction + '_' + selectedNode.faction : selectedNode.faction + '_' + playerFaction;
            const score = relationsScore[key] || 0;
            document.getElementById("dip-score").innerHTML = score;
            const bar = document.getElementById("dip-bar");
            const pct = Math.max(0, Math.min(100, 50 + score / 2));
            bar.style.width = pct + '%';
            bar.style.background = score > 30 ? '#238636' : (score < -30 ? '#f85149' : '#58a6ff');
            document.getElementById("dip-access").innerHTML = factions[playerFaction] && factions[playerFaction].alliances[selectedNode.faction] ? 'MÜTTEFİK' : 'Yok';
        }
    } else dipPanel.style.display = "none";

    buildTradeDropdown();
    updateLedger();
}


function buildAntiSatellite() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi şehrini seç!"); return; }
    if (factions[playerFaction].money < 15000) { alert("15000$ gerekli!"); return; }
    if (techLevel.space < 4) { alert("Uzay teknolojisi seviye 4 gerekli!"); return; }
    factions[playerFaction].money -= 15000;
    if (!factions[playerFaction].antiSat) factions[playerFaction].antiSat = 0;
    factions[playerFaction].antiSat += 1;
    addLogFiltered(`🛰️ Anti-uydu füzesi üretildi.`, "#58a6ff", selectedNode, playerFaction);
    updateLedger();
}

function fireAntiSatellite() {
    if (!selectedNode) { alert("Hedef şehir seç!"); return; }
    if (factions[playerFaction].antiSat < 1) { alert("Anti-uydu füzeniz yok!"); return; }
    if (techLevel.space < 4) { alert("Uzay teknolojisi seviye 4 gerekli!"); return; }
    const targetSat = satellites.find(s => s.targetNode === selectedNode.id && s.active);
    if (!targetSat) { alert("Bu şehirde uydu yok!"); return; }
    factions[playerFaction].antiSat -= 1;
    targetSat.active = false;
    addLogFiltered(`🛰️ ${selectedNode.name} üzerindeki düşman uydusu imha edildi!`, "#f85149", selectedNode, playerFaction);
    updateLedger();
    updateSpaceUI();
}

function fireLightningStrike() {
    if (!selectedNode) { alert("Hedef şehir seç!"); return; }
    if (techLevel.space < 5) { alert("Uzay teknolojisi seviye 5 gerekli!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 20000) { alert("20.000$ gerekli!"); return; }
    if (selectedNode.faction === playerFaction) { alert("Kendi şehrine atamazsın!"); return; }
    fac.money -= 20000;
    const halfPop = Math.floor(selectedNode.pop / 2);
    selectedNode.pop = Math.max(1000, selectedNode.pop - halfPop);
    selectedNode.garrison = Math.floor(selectedNode.garrison * 0.3);
    addLogFiltered(`⚡ YILDIRIM FÜZESİ! ${selectedNode.name} nüfusunun yarısı yok oldu!`, "#da3637", selectedNode, playerFaction);
    playSound('explosion');
    updateLedger();
}

function exportSave() {
    const data = {
        playerFaction, factions, mapNodes, armies, merchantShips, airUnits, spies, guerrillaUnits, satellites,
        discoveredBases, discoveredArmies, gameWon, zoom, panX, panY,
        techLevel, blockades, airDefenses, unSanction, radarStations, navalBases, spaceStations, missileDefenses,
        tradeRoutes, embargoActive, techTree, relationsScore,
        nonAggressionPacts, vassalStates, warReport, globalEvent, eventDuration,
        climateState, climateDuration, peaceTreaties, economicSanctions, lobbyPlayers, onlineLobbyActive
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geopolitica_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog("💾 JSON dosyası olarak kaydedildi.", "#58a6ff");
}

function importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                Object.assign(factions, data.factions);
                mapNodes.length = 0; mapNodes.push(...data.mapNodes);
                armies = data.armies.map(a => ({ ...a }));
                merchantShips = data.merchantShips || [];
                airUnits = data.airUnits || [];
                spies = data.spies || [];
                guerrillaUnits = data.guerrillaUnits || [];
                satellites = data.satellites || [];
                discoveredBases = data.discoveredBases || {};
                discoveredArmies = data.discoveredArmies || {};
                gameWon = data.gameWon || false;
                playerFaction = data.playerFaction;
                zoom = data.zoom || 1.0; panX = data.panX || 0; panY = data.panY || 0;
                techLevel = data.techLevel || { land: 0, naval: 0, air: 0, spy: 0, space: 0 };
                blockades = data.blockades || {};
                airDefenses = data.airDefenses || {};
                unSanction = data.unSanction || false;
                radarStations = data.radarStations || {};
                navalBases = data.navalBases || {};
                spaceStations = data.spaceStations || {};
                missileDefenses = data.missileDefenses || {};
                tradeRoutes = data.tradeRoutes || [];
                embargoActive = data.embargoActive || false;
                techTree = data.techTree || techTree;
                relationsScore = data.relationsScore || {};
                nonAggressionPacts = data.nonAggressionPacts || {};
                vassalStates = data.vassalStates || {};
                warReport = data.warReport || { battles: 0, wins: 0, losses: 0, totalCasualties: 0 };
                globalEvent = data.globalEvent || null;
                eventDuration = data.eventDuration || 0;
                climateState = data.climateState || 0;
                climateDuration = data.climateDuration || 0;
                peaceTreaties = data.peaceTreaties || {};
                economicSanctions = data.economicSanctions || {};
                lobbyPlayers = data.lobbyPlayers || [];
                onlineLobbyActive = data.onlineLobbyActive || false;

                document.getElementById("start-screen").style.display = "none";
                document.getElementById("game-container").style.display = "flex";
                document.getElementById("current-faction").innerText = factions[playerFaction].name;
                buildTradeDropdown();
                updateLedger();
                updateTechUI();
                updateTradeRoutesUI();
                updateAirUI();
                updateWarReport();
                updateSpaceUI();
                updateGuerrillaUI();
                updateClimateUI();
                addLog("📂 JSON dosyası yüklendi.", "#58a6ff");
                drawMap();
                startAutoSave();
            } catch(err) {
                alert("JSON dosyası bozuk veya uyumsuz!");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function buildPowerPlant() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi şehrini seç!"); return; }
    if (powerPlants[selectedNode.id]) { alert("Zaten santral var!"); return; }
    if (factions[playerFaction].money < 3000) { alert("3000$ gerekli!"); return; }
    factions[playerFaction].money -= 3000;
    powerPlants[selectedNode.id] = { type: 'normal', output: 20 };
    addLogFiltered(`⚡ ${selectedNode.name}'de normal santral kuruldu.`, "#ffd700", selectedNode, playerFaction);
    updateLedger();
}

function buildNuclearPlant() {
    if (!selectedNode || selectedNode.faction !== playerFaction) { alert("Kendi şehrini seç!"); return; }
    if (factions[playerFaction].money < 10000) { alert("10000$ gerekli!"); return; }
    if (techLevel.space < 3) { alert("Uzay teknolojisi seviye 3 gerekli!"); return; }
    factions[playerFaction].money -= 10000;
    addLogFiltered(`☢️ ${selectedNode.name}'de nükleer santral kuruldu.`, "#ff9f43", selectedNode, playerFaction);
    updateLedger();
}


function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        let freq = 400, dur = 100, wave = 'sine';
        if (type === 'click') { freq = 600; dur = 80; }
        else if (type === 'explosion') { freq = 150; dur = 400; wave = 'sawtooth'; }
        else if (type === 'bombardment') { freq = 200; dur = 500; wave = 'square'; }
        else if (type === 'war') { freq = 100; dur = 700; wave = 'sawtooth'; }
        else if (type === 'trade') { freq = 800; dur = 150; wave = 'sine'; }
        else if (type === 'spy') { freq = 1200; dur = 100; wave = 'sine'; }
        else if (type === 'rocket') { freq = 50; dur = 600; wave = 'sawtooth'; }
        const vol = (settings.volume || 80) / 100;
        gain.gain.setValueAtTime(0.15 * vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001 * vol, audioCtx.currentTime + dur/1000);
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur/1000);
    } catch(e) {}
}

function focusCapital() {
    if (!playerFaction) { alert("Önce bir ülke seçin!"); return; }
    const capital = mapNodes.find(n => n.isCapital && n.faction === playerFaction);
    if (!capital) { alert("Başkent bulunamadı!"); return; }
    zoom = 2.5;
    panX = canvas.width / 2 - capital.x * zoom;
    panY = canvas.height / 2 - capital.y * zoom;
    drawMap();
}

function pirateAttack() {
    if (!playerFaction) return;
    const fac = factions[playerFaction];
    if (fac.type !== 'org') { alert("Sadece korsan örgütleri saldırabilir!"); return; }
    const myShips = pirateShips.filter(s => s.owner === playerFaction && s.state === 'idle');
    if (myShips.length === 0) { alert("Hazır korsan gemisi yok! Üsse dönmelerini bekleyin."); return; }
    const targets = merchantShips.filter(s => s.owner !== playerFaction);
    if (targets.length === 0) { alert("Hedef gemi yok!"); return; }
    const target = targets[0];
    const ship = myShips[0];
    ship.targetShipId = target.id;
    ship.state = 'attacking';
    ship.x = target.x;
    ship.y = target.y;
    addLog(`🏴‍☠️ Korsan gemisi ${target.owner} gemisine saldırıyor!`, "#ff9f43");
}
function buildPirateShip() {
    if (!playerFaction) { alert("Önce bir örgüt seçin!"); return; }
    const fac = factions[playerFaction];
    if (fac.type !== 'org') { alert("Sadece korsan örgütleri korsan gemisi inşa edebilir!"); return; }
    
    const base = mapNodes.find(n => n.faction === playerFaction && n.isOrgBase && n.isSea);
    if (!base) {
        alert("Denizde bir üssünüz yok! Önce bir korsan üssü ele geçirin.");
        return;
    }

    if (fac.money < 100) { alert("100$ gerekli!"); return; }
    if ((fac.steel || 0) < 10) { alert("10 çelik gerekli!"); return; }

    fac.money -= 100;
    fac.steel -= 10;

    pirateShips.push({
        id: "pirate_" + Date.now(),
        owner: playerFaction,
        speed: getNavalSpeed() + 1,
        x: base.x,
        y: base.y,
        state: 'idle', 
        targetShipId: null,
        hp: 100, 
        attackPower: 40
    });

    addLogFiltered(`🏴‍☠️ Yeni korsan gemisi inşa edildi! (${base.name})`, "#ff9f43", base, playerFaction);
    updateLedger();
}

function pirateRaidPort() {
    if (!playerFaction) return;
    const fac = factions[playerFaction];
    if (fac.type !== 'org') {
        alert("Sadece korsan örgütleri liman baskını yapabilir!");
        return;
    }
    if (!selectedNode) {
        alert("Bir liman şehri seçin!");
        return;
    }
    if (!selectedNode.isCoastal || selectedNode.isSea) {
        alert("Hedef bir kıyı şehri olmalı!");
        return;
    }
    if (selectedNode.faction === playerFaction) {
        alert("Kendi limanına saldıramazsın!");
        return;
    }
    if (selectedNode.faction === "NEUTRAL") {
        alert("Tarafsız bir limana saldıramazsın!");
        return;
    }
    const myShips = pirateShips.filter(s => s.owner === playerFaction && s.state === 'idle');
    if (myShips.length === 0) {
        alert("Hazır korsan gemisi yok! Üsse dönmelerini bekleyin.");
        return;
    }
    const ship = myShips[0];
    ship.state = 'attacking';
    ship.targetType = 'port';
    ship.targetId = selectedNode.id;
    ship.targetX = selectedNode.x;
    ship.targetY = selectedNode.y;
    addLog(`🏴‍☠️ Korsan gemisi ${selectedNode.name} limanına baskın düzenliyor!`, "#ff9f43");
}

function getNavalSpeed() {
    return 0.3 + techLevel.naval * 0.05;
}

function updateNavalSpeeds() {
    const speed = getNavalSpeed();
    merchantShips.forEach(s => s.speed = speed);
    pirateShips.forEach(s => s.speed = speed + 0.1);
}

function fundPirates() {
    if (!selectedNode || selectedNode.faction === "NEUTRAL") { alert("Bir korsan örgütü seçin!"); return; }
    const target = selectedNode.faction;
    if (!factions[target] || factions[target].type !== 'org') { alert("Hedef bir örgüt değil!"); return; }
    const fac = factions[playerFaction];
    if (fac.money < 500) { alert("500$ gerekli!"); return; }
    fac.money -= 500;
    const base = mapNodes.find(n => n.faction === target && n.isOrgBase);
    if (base) {
        pirateShips.push({
            id: "pirate_fund_" + Date.now(),
            owner: target,
            x: base.x,
            y: base.y,
            state: 'idle',
            targetShipId: null,
            hp: 100,
            attackPower: 50,
            speed: getNavalSpeed() + 0.15
        });
        addLogFiltered(`💰 ${factions[target].name} örgütüne 500$ fon sağlandı. Yeni korsan gemisi!`, "#ffd700", selectedNode, playerFaction);
    }
    updateLedger();
}



function updateVisibility() {
    if (!playerFaction) return;
    detectedUnits = {};
    playerVisibleNodes = new Set();

    const myUnits = [];
    armies.filter(a => a.owner === playerFaction).forEach(a => {
        myUnits.push({x: a.x, y: a.y, range: a.type === "FLEET" ? 150 : 50, id: a.id});
    });
    airUnits.filter(u => u.owner === playerFaction).forEach(u => {
        myUnits.push({x: u.x, y: u.y, range: 150, id: u.id});
    });
    merchantShips.filter(s => s.owner === playerFaction).forEach(s => {
        myUnits.push({x: s.x, y: s.y, range: 150, id: s.id});
    });
    for (let rid in radarStations) {
        const r = radarStations[rid];
        myUnits.push({x: r.x, y: r.y, range: 200, id: 'radar_'+rid});
    }
    satellites.filter(s => s.active && s.owner === playerFaction).forEach(s => {
        myUnits.push({x: s.x, y: s.y, range: 500, id: 'sat_'+s.id});
    });

    armies.forEach(a => {
        if (a.owner === playerFaction) return;
        if (a.size <= 0 || a.status === "DESTROYED") return;
        let visible = false;
        for (let u of myUnits) {
            if (Math.hypot(a.x - u.x, a.y - u.y) < u.range) {
                visible = true;
                break;
            }
        }
        if (visible) {
            detectedUnits[a.id] = { x: a.x, y: a.y, owner: a.owner, lastSeen: Date.now(), type: 'army' };
        }
    });
    airUnits.forEach(u => {
        if (u.owner === playerFaction) return;
        let visible = false;
        for (let my of myUnits) {
            if (Math.hypot(u.x - my.x, u.y - my.y) < my.range) {
                visible = true;
                break;
            }
        }
        if (visible) {
            detectedUnits[u.id] = { x: u.x, y: u.y, owner: u.owner, lastSeen: Date.now(), type: 'air' };
        }
    });
    merchantShips.forEach(s => {
        if (s.owner === playerFaction) return;
        let visible = false;
        for (let my of myUnits) {
            if (Math.hypot(s.x - my.x, s.y - my.y) < my.range) {
                visible = true;
                break;
            }
        }
        if (visible) {
            detectedUnits[s.id] = { x: s.x, y: s.y, owner: s.owner, lastSeen: Date.now(), type: 'ship' };
        }
    });
    pirateShips.forEach(p => {
        if (p.owner === playerFaction) return;
        let visible = false;
        for (let my of myUnits) {
            if (Math.hypot(p.x - my.x, p.y - my.y) < my.range) {
                visible = true;
                break;
            }
        }
        if (visible) {
            detectedUnits[p.id] = { x: p.x, y: p.y, owner: p.owner, lastSeen: Date.now(), type: 'pirate' };
        }
    });
    mapNodes.forEach(node => {
        if (node.faction === playerFaction) {
            playerVisibleNodes.add(node.id);
            return;
        }
        if (factions[playerFaction] && factions[playerFaction].alliances[node.faction]) {
            playerVisibleNodes.add(node.id);
            return;
        }
        let visible = false;
        for (let my of myUnits) {
            if (Math.hypot(node.x - my.x, node.y - my.y) < my.range) {
                visible = true;
                break;
            }
        }
        if (visible) {
            playerVisibleNodes.add(node.id);
            if (node.isOrgBase) {
                discoveredBases[node.id] = true;
            }
        }
    });
}

function orgRaid(orgCode) {
    const fac = factions[orgCode];
    if (!fac || fac.type !== 'org') return;
    const targets = mapNodes.filter(n => n.isCoastal && n.faction !== orgCode && n.faction !== "NEUTRAL");
    if (targets.length > 0 && Math.random() < 0.3) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const dmg = Math.floor(100 + Math.random() * 400);
        target.garrison = Math.max(0, target.garrison - dmg);
        const loot = Math.floor(50 + Math.random() * 200);
        fac.money += loot;
        if (factions[target.faction]) {
            factions[target.faction].money = Math.max(0, factions[target.faction].money - loot);
        }
        addLogFiltered(`💀 ${fac.name} ${target.name}'e baskın düzenledi! -${dmg} garnizon, +${loot}$`, "#f85149", target, orgCode);
    }
    const ships = merchantShips.filter(s => s.owner !== orgCode);
    if (ships.length > 0 && Math.random() < 0.2) {
        const ship = ships[Math.floor(Math.random() * ships.length)];
        const idx = merchantShips.indexOf(ship);
        if (idx > -1) merchantShips.splice(idx, 1);
        fac.money += 200;
        addLogFiltered(`🏴‍☠️ ${fac.name} bir ticaret gemisini batırdı!`, "#ff9f43", null, orgCode);
    }
}

const DEFAULT_STATE = {
    version: 2,
    playerFaction: 'ingiltere',
    factions: {
        ingiltere: { money: 5000 },
        almanya: { money: 5000 }
    },
    techLevels: {
        land_speed: 0,
        naval_speed: 0,
        air_power: 0,
        spy_tech: 0,
        space_tech: 0
    },
    researchQueue: null,
    logs: [] 
};

function deepMerge(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                    target[key] = {};
                }
                deepMerge(target[key], source[key]);
            } else {
                if (!(key in target)) {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
}

function exportGame() {
    const techLevels = {};
    for (const [id, tech] of Object.entries(techTree)) {
        techLevels[id] = tech.level || 0;
    }

    const exportData = {
        version: DEFAULT_STATE.version,
        playerFaction: playerFaction,
        factions: factions,
        techLevels: techLevels,
        researchQueue: researchQueue,
        logs: logs || [] 
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `oyun_kayit_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog("💾 Oyun dosyası bilgisayara kaydedildi.");
}

function importGame(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const rawData = JSON.parse(e.target.result);

            const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_STATE));
            const mergedData = deepMerge(defaultCopy, rawData);

            playerFaction = mergedData.playerFaction;
            
            for (const [factionId, data] of Object.entries(mergedData.factions)) {
                if (factions[factionId]) {
                    factions[factionId].money = data.money || 0;
                }
            }

            for (const [techId, level] of Object.entries(mergedData.techLevels)) {
                if (techTree[techId]) {
                    techTree[techId].level = level;
                }
            }

            researchQueue = mergedData.researchQueue;

            if (mergedData.logs) {
                logs = mergedData.logs;
            }

            updateTechLevelsFromTree();
            
            updateUI();
            updateTechUI();
            updateLedger();
            
            addLog(`✅ ${file.name} dosyası başarıyla yüklendi! (Sürüm: ${mergedData.version})`);
            alert("Oyun başarıyla içe aktarıldı!");

        } catch (error) {
            alert("Dosya okunamadı veya bozuk! Lütfen geçerli bir JSON dosyası seçin.");
            console.error("Import Hatası:", error);
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
}

function updateTechLevelsFromTree() {
    if (typeof techLevel !== 'undefined') {
        for (const [id, tech] of Object.entries(techTree)) {
            if (id === 'land_speed') techLevel.land = tech.level;
            else if (id === 'naval_speed') techLevel.naval = tech.level;
            else if (id === 'air_power') techLevel.air = tech.level;
            else if (id === 'spy_tech') techLevel.spy = tech.level;
            else if (id === 'space_tech') techLevel.space = tech.level;
        }
    }
}