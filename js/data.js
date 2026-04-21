/* ============================================================
   Data: leagues, teams, products
   Images are SVG jersey templates colored per-team → zero CDN.
   ============================================================ */

const LEAGUES = [
  { id: "premier",    name: "Premier League",  abbr: "EPL",  country: "England" },
  { id: "laliga",     name: "La Liga",         abbr: "LIGA", country: "Spain" },
  { id: "bundesliga", name: "Bundesliga",      abbr: "BUND", country: "Germany" },
  { id: "seriea",     name: "Serie A",         abbr: "SERA", country: "Italy" },
  { id: "ligue1",     name: "Ligue 1",         abbr: "LIG1", country: "France" },
  { id: "national",   name: "National Teams",  abbr: "NAT",  country: "International" },
];

const TYPES = [
  { id: "home",  name: "Home" },
  { id: "away",  name: "Away" },
  { id: "third", name: "Third" },
  { id: "retro", name: "Retro" },
  { id: "keeper", name: "Goalkeeper" },
];

const SIZES = ["XS","S","M","L","XL","XXL"];

/* Build jersey SVG with primary/secondary/accent colors + optional stripes */
function jerseySVG({ c1="#dc2626", c2="#fff", accent="#fff", pattern="solid", name="", num="" } = {}) {
  let body = "";
  if (pattern === "stripes-v") {
    body = `
      <rect x="30" y="30" width="240" height="260" fill="${c1}"/>
      <rect x="60" y="30" width="30" height="260" fill="${c2}"/>
      <rect x="120" y="30" width="30" height="260" fill="${c2}"/>
      <rect x="180" y="30" width="30" height="260" fill="${c2}"/>
      <rect x="240" y="30" width="30" height="260" fill="${c2}"/>`;
  } else if (pattern === "halves") {
    body = `
      <rect x="30" y="30" width="120" height="260" fill="${c1}"/>
      <rect x="150" y="30" width="120" height="260" fill="${c2}"/>`;
  } else if (pattern === "sash") {
    body = `
      <rect x="30" y="30" width="240" height="260" fill="${c1}"/>
      <polygon points="30,90 270,30 270,90 30,150" fill="${c2}"/>`;
  } else {
    body = `<rect x="30" y="30" width="240" height="260" fill="${c1}"/>`;
  }
  const safeName = name ? name.toUpperCase().slice(0,10) : "";
  const safeNum = num ? String(num).slice(0,2) : "";
  return `
  <svg class="jersey-svg" viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feOffset in="b" dy="6" result="o"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g filter="url(#sh)">
      <!-- body shape using clipPath -->
      <clipPath id="jClip">
        <path d="M90 30 L120 20 Q150 10 180 20 L210 30 L270 60 L250 120 L240 110 L240 300 Q150 320 60 300 L60 110 L50 120 L30 60 Z"/>
      </clipPath>
      <g clip-path="url(#jClip)">${body}</g>
      <!-- outline -->
      <path d="M90 30 L120 20 Q150 10 180 20 L210 30 L270 60 L250 120 L240 110 L240 300 Q150 320 60 300 L60 110 L50 120 L30 60 Z"
            fill="none" stroke="${accent}" stroke-width="2"/>
      <!-- collar -->
      <path d="M120 20 Q150 45 180 20" fill="none" stroke="${accent}" stroke-width="3"/>
      <!-- sleeve cuffs -->
      <rect x="30" y="100" width="30" height="12" fill="${accent}" opacity="0.7"/>
      <rect x="240" y="100" width="30" height="12" fill="${accent}" opacity="0.7"/>
    </g>
    ${safeNum ? `<text x="150" y="200" text-anchor="middle" font-family="Bebas Neue,Arial" font-size="90" font-weight="900" fill="${accent}" opacity="0.9">${safeNum}</text>` : ""}
    ${safeName ? `<text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="${accent}" opacity="0.85" letter-spacing="2">${safeName}</text>` : ""}
  </svg>`;
}

/* Helper */
function p(id, data) {
  return {
    id,
    stock: Math.floor(Math.random() * 40) + 5,
    rating: Number((4 + Math.random()).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 450) + 20,
    sizes: SIZES,
    ...data,
  };
}

const PRODUCTS = [
  /* Premier League */
  p(1,  { team: "Manchester United", league: "premier", type: "home",  name: "Man United 25/26 Home", price: 89.99, oldPrice: 119.99, sale: true, isNew: true, colors:{c1:"#da020e",c2:"#fff",accent:"#ffd700",pattern:"solid"} }),
  p(2,  { team: "Manchester United", league: "premier", type: "away",  name: "Man United 25/26 Away", price: 89.99, colors:{c1:"#ffffff",c2:"#da020e",accent:"#000",pattern:"solid"} }),
  p(3,  { team: "Liverpool",         league: "premier", type: "home",  name: "Liverpool 25/26 Home",  price: 94.99, isHot: true, colors:{c1:"#c8102e",c2:"#fff",accent:"#f6eb61",pattern:"solid"} }),
  p(4,  { team: "Arsenal",           league: "premier", type: "home",  name: "Arsenal 25/26 Home",    price: 84.99, colors:{c1:"#ef0107",c2:"#fff",accent:"#023474",pattern:"solid"} }),
  p(5,  { team: "Arsenal",           league: "premier", type: "third", name: "Arsenal 25/26 Third",   price: 84.99, isNew: true, colors:{c1:"#1d2d50",c2:"#ef0107",accent:"#fff",pattern:"sash"} }),
  p(6,  { team: "Manchester City",   league: "premier", type: "home",  name: "Man City 25/26 Home",   price: 89.99, colors:{c1:"#6cabdd",c2:"#fff",accent:"#1c2c5b",pattern:"solid"} }),
  p(7,  { team: "Chelsea",           league: "premier", type: "home",  name: "Chelsea 25/26 Home",    price: 84.99, sale: true, oldPrice: 99.99, colors:{c1:"#034694",c2:"#fff",accent:"#dba111",pattern:"solid"} }),
  p(8,  { team: "Tottenham",         league: "premier", type: "home",  name: "Spurs 25/26 Home",      price: 79.99, colors:{c1:"#ffffff",c2:"#132257",accent:"#132257",pattern:"solid"} }),

  /* La Liga */
  p(9,  { team: "Real Madrid",       league: "laliga",  type: "home",  name: "Real Madrid 25/26 Home", price: 99.99, isHot: true, colors:{c1:"#ffffff",c2:"#febe10",accent:"#00529f",pattern:"solid"} }),
  p(10, { team: "Real Madrid",       league: "laliga",  type: "away",  name: "Real Madrid 25/26 Away", price: 99.99, colors:{c1:"#1a1a2e",c2:"#febe10",accent:"#febe10",pattern:"solid"} }),
  p(11, { team: "Barcelona",         league: "laliga",  type: "home",  name: "Barcelona 25/26 Home",   price: 99.99, isNew: true, colors:{c1:"#a50044",c2:"#004d98",accent:"#ffed02",pattern:"stripes-v"} }),
  p(12, { team: "Barcelona",         league: "laliga",  type: "away",  name: "Barcelona 25/26 Away",   price: 89.99, sale: true, oldPrice: 99.99, colors:{c1:"#f7b500",c2:"#a50044",accent:"#a50044",pattern:"solid"} }),
  p(13, { team: "Atletico Madrid",   league: "laliga",  type: "home",  name: "Atleti 25/26 Home",      price: 84.99, colors:{c1:"#c8102e",c2:"#fff",accent:"#003090",pattern:"stripes-v"} }),

  /* Bundesliga */
  p(14, { team: "Bayern Munich",     league: "bundesliga", type: "home", name: "Bayern 25/26 Home",    price: 89.99, colors:{c1:"#dc052d",c2:"#fff",accent:"#0066b2",pattern:"solid"} }),
  p(15, { team: "Borussia Dortmund", league: "bundesliga", type: "home", name: "Dortmund 25/26 Home",  price: 84.99, isHot: true, colors:{c1:"#fde100",c2:"#000",accent:"#000",pattern:"solid"} }),
  p(16, { team: "Bayer Leverkusen",  league: "bundesliga", type: "home", name: "Leverkusen 25/26 Home", price: 79.99, colors:{c1:"#e32221",c2:"#000",accent:"#000",pattern:"halves"} }),

  /* Serie A */
  p(17, { team: "Juventus",          league: "seriea",  type: "home",  name: "Juventus 25/26 Home",   price: 84.99, colors:{c1:"#000000",c2:"#ffffff",accent:"#ffd700",pattern:"stripes-v"} }),
  p(18, { team: "AC Milan",          league: "seriea",  type: "home",  name: "AC Milan 25/26 Home",   price: 84.99, isNew: true, colors:{c1:"#fb090b",c2:"#000",accent:"#fff",pattern:"stripes-v"} }),
  p(19, { team: "Inter Milan",       league: "seriea",  type: "home",  name: "Inter 25/26 Home",      price: 89.99, colors:{c1:"#0068a8",c2:"#000",accent:"#fff",pattern:"stripes-v"} }),
  p(20, { team: "Napoli",            league: "seriea",  type: "home",  name: "Napoli 25/26 Home",     price: 79.99, sale: true, oldPrice: 89.99, colors:{c1:"#12a0d7",c2:"#fff",accent:"#fff",pattern:"solid"} }),

  /* Ligue 1 */
  p(21, { team: "PSG",               league: "ligue1",  type: "home",  name: "PSG 25/26 Home",        price: 94.99, isHot: true, colors:{c1:"#004170",c2:"#dc143c",accent:"#fff",pattern:"sash"} }),
  p(22, { team: "Marseille",         league: "ligue1",  type: "home",  name: "Marseille 25/26 Home",  price: 79.99, colors:{c1:"#ffffff",c2:"#009ddc",accent:"#009ddc",pattern:"solid"} }),

  /* National */
  p(23, { team: "Argentina",         league: "national", type: "home", name: "Argentina 24 Home",     price: 89.99, isHot: true, colors:{c1:"#75aadb",c2:"#fff",accent:"#000",pattern:"stripes-v"} }),
  p(24, { team: "Brazil",            league: "national", type: "home", name: "Brazil 24 Home",        price: 89.99, colors:{c1:"#fdc500",c2:"#009c3b",accent:"#009c3b",pattern:"solid"} }),
  p(25, { team: "France",            league: "national", type: "home", name: "France 24 Home",        price: 89.99, colors:{c1:"#0055a4",c2:"#fff",accent:"#ef4135",pattern:"solid"} }),
  p(26, { team: "Germany",           league: "national", type: "home", name: "Germany 24 Home",       price: 89.99, sale: true, oldPrice: 99.99, colors:{c1:"#ffffff",c2:"#000",accent:"#dd0000",pattern:"solid"} }),
  p(27, { team: "Bangladesh",        league: "national", type: "home", name: "Bangladesh Home",       price: 59.99, isNew: true, colors:{c1:"#006a4e",c2:"#f42a41",accent:"#fff",pattern:"solid"} }),

  /* Retro */
  p(28, { team: "Brazil 1970",       league: "national", type: "retro", name: "Brazil 1970 Retro",    price: 74.99, colors:{c1:"#ffe017",c2:"#009c3b",accent:"#009c3b",pattern:"solid"} }),
  p(29, { team: "Man United 1999",   league: "premier",  type: "retro", name: "Man Utd 99 Retro",     price: 74.99, isHot: true, colors:{c1:"#c8102e",c2:"#fff",accent:"#fff",pattern:"solid"} }),
  p(30, { team: "France 1998",       league: "national", type: "retro", name: "France 1998 Retro",    price: 74.99, colors:{c1:"#0055a4",c2:"#fff",accent:"#ef4135",pattern:"solid"} }),
  p(31, { team: "AC Milan 1990",     league: "seriea",   type: "retro", name: "Milan 1990 Retro",     price: 74.99, colors:{c1:"#fb090b",c2:"#000",accent:"#fff",pattern:"stripes-v"} }),

  /* Keeper */
  p(32, { team: "Manchester City",   league: "premier", type: "keeper", name: "Man City GK 25/26",    price: 79.99, colors:{c1:"#16a34a",c2:"#000",accent:"#000",pattern:"solid"} }),
];

/* Mock reviews for product detail */
const MOCK_REVIEWS = [
  { name: "Rafi M.",   stars: 5, text: "Fits perfectly, fabric feels premium. Print quality top-tier." },
  { name: "Sara J.",   stars: 5, text: "Shipped fast and looks exactly like the photos. Happy fan!" },
  { name: "Arif H.",   stars: 4, text: "Great quality, sizing runs slightly small — size up." },
  { name: "Mike T.",   stars: 5, text: "Third one I've bought. Never disappointed. 10/10." },
];

/* Currency rates (mocked) */
const CURRENCIES = {
  USD: { symbol: "$",  rate: 1 },
  EUR: { symbol: "€",  rate: 0.92 },
  GBP: { symbol: "£",  rate: 0.79 },
  BDT: { symbol: "৳",  rate: 118 },
};
