const LANG_KEY = "ch_lang_v1";
const OVERVIEW_KEY = "ch_overview_v1";

const state = {
  lang: localStorage.getItem(LANG_KEY) === "te" ? "te" : "en",
  me: null,
  overview: null,
  view: "loading",
  error: "",
  loginError: "",
  offline: false,
  cachedAt: null,
  viewingTripId: null,
  familyFormOpen: false,
  familyError: "",
  installPrompt: null,
  loginBusy: false
};

const app = document.getElementById("app");

const STRINGS = {
  appName: ["Community Harvest", "సామూహిక పంట"],
  tagline: ["One shared list for all our families", "మన కుటుంబాలందరికీ ఒకే జాబితా"],
  loginTitle: ["Welcome to our harvest", "మన పంటకు స్వాగతం"],
  loginSubtitle: [
    "Sign in to add what you have ready and see the combined list.",
    "మీ దగ్గర సిద్ధంగా ఉన్నవి జోడించి, మొత్తం జాబితా చూడటానికి సైన్ ఇన్ చేయండి."
  ],
  phone: ["Phone number", "ఫోన్ నంబర్"],
  phonePlaceholder: ["10-digit mobile number", "10 అంకెల మొబైల్ నంబర్"],
  pin: ["4-digit PIN", "4-అంకెల పిన్"],
  signIn: ["Sign in", "సైన్ ఇన్"],
  signingIn: ["Signing in…", "సైన్ ఇన్ అవుతోంది…"],
  signOut: ["Sign out", "సైన్ అవుట్"],
  loginHelp: [
    "New family? Ask the coordinator to add you.",
    "కొత్త కుటుంబమా? ఏర్పాటుదారుని అడిగి జోడించుకోండి."
  ],
  loginHint: [
    "Families sign in with the phone number and PIN the coordinator gave them.",
    "కుటుంబాలు ఏర్పాటుదారు ఇచ్చిన ఫోన్ నంబర్ మరియు పిన్తో సైన్ ఇన్ చేస్తారు."
  ],
  invalidLogin: ["Phone number or PIN is incorrect.", "ఫోన్ నంబర్ లేదా పిన్ తప్పు."],
  rateLimited: [
    "Too many attempts. Please wait a few minutes.",
    "చాలా ప్రయత్నాలు అయ్యాయి. కొన్ని నిమిషాలు వేచి ఉండండి."
  ],
  networkError: [
    "No connection. Please check your internet and try again.",
    "కనెక్షన్ లేదు. ఇంటర్నెట్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి."
  ],
  genericError: ["Something went wrong. Please try again.", "ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి."],
  retry: ["Try again", "మళ్లీ ప్రయత్నించండి"],
  loading: ["Loading the harvest…", "పంట లోడ్ అవుతోంది…"],
  coordinator: ["Coordinator", "ఏర్పాటుదారు"],
  farmer: ["Farmer", "రైతు"],
  thisWeek: ["This week's collection", "ఈ వారం సేకరణ"],
  tripOn: ["Collection on", "సేకరణ"],
  totalHarvest: ["Total harvest", "మొత్తం పంట"],
  families: ["Families", "కుటుంబాలు"],
  payout: ["Payout", "చెల్లింపు"],
  afterPrices: ["after prices", "ధరల తర్వాత"],
  statusCollecting: ["Collecting harvest", "పంట జోడిస్తున్నారు"],
  statusPriced: ["Prices added", "ధరలు నమోదయ్యాయి"],
  statusClosed: ["Week closed", "వారం ముగిసింది"],
  viewingPast: ["Viewing a past week", "గత వారం చూస్తున్నారు"],
  backToCurrent: ["Back to current week", "ప్రస్తుత వారానికి వెళ్లండి"],
  viewWeek: ["View week", "వారాన్ని చూడండి"],
  addHarvest: ["Add my harvest", "నా పంటను జోడించండి"],
  addForFamily: ["Add a family's harvest", "కుటుంబం పంటను జోడించండి"],
  vegetable: ["Vegetable", "కూరగాయ"],
  selectVegetable: ["Choose a vegetable", "కూరగాయను ఎంచుకోండి"],
  family: ["Family", "కుటుంబం"],
  selectFamily: ["Choose a family", "కుటుంబాన్ని ఎంచుకోండి"],
  weightKg: ["Weight (kg)", "బరువు (కిలోలు)"],
  weightPlaceholder: ["For example 10 or 2.5", "ఉదా: 10 లేదా 2.5"],
  grade: ["Grade", "నాణ్యత"],
  gradeA: ["A — best", "A — మంచిది"],
  gradeB: ["B — good", "B — బాగుంది"],
  gradeC: ["C — ordinary", "C — సాధారణం"],
  notes: ["Notes (optional)", "గమనికలు (ఐచ్ఛికం)"],
  notesPlaceholder: ["For example: ready by 6 am", "ఉదా: ఉదయం 6కి సిద్ధం"],
  addToList: ["Add to list", "జాబితాలో జోడించండి"],
  saving: ["Saving…", "భద్రపరుస్తోంది…"],
  priceNotNeeded: [
    "No price needed now. The price is entered after you reach the collector office.",
    "ఇప్పుడు ధర అవసరం లేదు. కలెక్టర్ కార్యాలయం చేరిన తర్వాత ధర నమోదు చేయండి."
  ],
  replacesHint: [
    "Adding the same vegetable again replaces your earlier weight.",
    "అదే కూరగాయను మళ్లీ జోడిస్తే మునుపటి బరువు మారిపోతుంది."
  ],
  addFamilyFirst: [
    "Add a family first, then you can enter their harvest.",
    "మొదట కుటుంబాన్ని జోడించండి, తర్వాత వారి పంటను నమోదు చేయవచ్చు."
  ],
  listLocked: [
    "Prices are entered, so the list is locked. Ask the coordinator for changes.",
    "ధరలు నమోదయ్యాయి, జాబితా లాక్ అయింది. మార్పుల కోసం ఏర్పాటుదారుని అడగండి."
  ],
  weekClosed: ["This week is closed. Start the next week to add more.", "ఈ వారం ముగిసింది. మరిన్ని జోడించడానికి తదుపరి వారం ప్రారంభించండి."],
  myList: ["My harvest", "నా పంట"],
  myListEmpty: ["You have not added anything yet.", "మీరు ఇంకా ఏమీ జోడించలేదు."],
  everyoneList: ["Everyone's harvest", "అందరి పంట"],
  listEmpty: ["No harvest has been listed yet.", "ఇంకా పంట జాబితా లేదు."],
  kg: ["kg", "కిలోలు"],
  listed: ["listed", "జాబితా"],
  weighed: ["weighed", "తూకం"],
  atOffice: ["At office", "కార్యాలయంలో"],
  rate: ["Rate", "ధర"],
  amount: ["Amount", "మొత్తం"],
  lastRate: ["Last rate", "గత ధర"],
  byFamily: ["By family", "కుటుంబాల వారీగా"],
  remove: ["Remove", "తీసివేయండి"],
  removeConfirm: [
    "Remove this entry from the harvest list?",
    "ఈ నమోదును పంట జాబితా నుండి తీసివేయాలా?"
  ],
  pricesTitle: ["Prices from the collector office", "కలెక్టర్ కార్యాలయ ధరలు"],
  pricesHint: [
    "Enter the rate for each vegetable once it is announced. Every family gets the same rate for that vegetable.",
    "ధర ప్రకటించిన తర్వాత ప్రతి కూరగాయకు ధర నమోదు చేయండి. ఆ కూరగాయకు అందరు కుటుంబాలకు ఒకే ధర."
  ],
  pricePerKg: ["₹ per kg", "కిలోకి ₹"],
  savePrices: ["Save prices", "ధరలు భద్రపరచండి"],
  updatePrices: ["Update prices", "ధరలు మార్చండి"],
  enterAllPrices: [
    "Enter a price for every vegetable in the list.",
    "జాబితాలోని ప్రతి కూరగాయకు ధర నమోదు చేయండి."
  ],
  pricesSaved: ["Prices saved. Payouts are calculated.", "ధరలు భద్రపరచబడ్డాయి. చెల్లింపులు లెక్కించబడ్డాయి."],
  noPricesYet: [
    "No prices yet. They are announced at the collector office.",
    "ఇంకా ధరలు లేవు. కలెక్టర్ కార్యాలయంలో ప్రకటిస్తారు."
  ],
  weighTitle: ["Weigh-in at the office", "కార్యాలయంలో తూకం"],
  weighHint: [
    "If the office weighs less, enter the accepted kg here. Leave it as listed if nothing changed.",
    "కార్యాలయంలో తక్కువ తూకం వస్తే, అంగీకరించిన కిలోలు ఇక్కడ నమోదు చేయండి. మార్పు లేకపోతే అలాగే ఉంచండి."
  ],
  acceptedKg: ["Accepted kg", "అంగీకరించిన కిలోలు"],
  save: ["Save", "భద్రపరచండి"],
  weighedSaved: ["Weigh-in saved.", "తూకం భద్రపరచబడింది."],
  payoutsTitle: ["Payouts", "చెల్లింపులు"],
  payoutsHint: [
    "Weighed kg × today's price. No deductions are subtracted.",
    "తూకం కిలోలు × ఈరోజు ధర. ఎలాంటి కోతలు లేవు."
  ],
  totalPayout: ["Total payout", "మొత్తం చెల్లింపు"],
  familyPayout: ["Family", "కుటుంబం"],
  unpriced: ["price pending", "ధర పెండింగ్"],
  myPayout: ["My payout", "నా చెల్లింపు"],
  myPayoutHint: [
    "Your weighed kg × the price announced at the office.",
    "మీ తూకం కిలోలు × కార్యాలయంలో ప్రకటించిన ధర."
  ],
  payoutPending: [
    "The payout will appear here after the prices are entered.",
    "ధరలు నమోదు చేసిన తర్వాత చెల్లింపు ఇక్కడ కనిపిస్తుంది."
  ],
  shareWhatsApp: ["Share on WhatsApp", "వాట్సాప్లో పంచుకోండి"],
  shareReceipt: ["Share my receipt", "నా రసీదు పంచుకోండి"],
  copySummary: ["Copy summary", "సారాంశాన్ని కాపీ చేయండి"],
  copied: ["Copied to clipboard.", "క్లిప్బోర్డ్కు కాపీ అయింది."],
  printSheet: ["Print sheet", "షీట్ ప్రింట్ చేయండి"],
  whatsappTitle: ["Community harvest", "సామూహిక పంట"],
  total: ["Total", "మొత్తం"],
  fromFamilies: ["from", "నుండి"],
  noDeductions: ["No deductions", "కోతలు లేవు"],
  familiesTitle: ["Families", "కుటుంబాలు"],
  familyCount: ["family", "కుటుంబం"],
  addFamily: ["Add family", "కుటుంబాన్ని జోడించండి"],
  closeForm: ["Close", "మూసివేయండి"],
  familyName: ["Family name", "కుటుంబం పేరు"],
  familyNamePlaceholder: ["For example: Anitha", "ఉదా: అనిత"],
  village: ["Village", "గ్రామం"],
  villagePlaceholder: ["For example: Kothur", "ఉదా: కోత్తూరు"],
  newPin: ["4-digit PIN for sign in", "సైన్ ఇన్ కోసం 4-అంకెల పిన్"],
  saveFamily: ["Save family", "కుటుంబాన్ని భద్రపరచండి"],
  familyAdded: ["Family added. They can now sign in.", "కుటుంబం జోడించబడింది. వారు ఇప్పుడు సైన్ ఇన్ చేయవచ్చు."],
  inactive: ["Inactive", "నిష్క్రియం"],
  weekTools: ["This collection week", "ఈ సేకరణ వారం"],
  startNextWeek: ["Start next week", "తదుపరి వారం ప్రారంభించండి"],
  nextWeekTitle: ["Start a new week?", "కొత్త వారం ప్రారంభించాలా?"],
  nextWeekText: [
    "This closes the current week and starts a fresh list for next Monday. The payout for this week stays saved.",
    "ఇది ప్రస్తుత వారాన్ని మూసివేసి, వచ్చే సోమవారానికి కొత్త జాబితా ప్రారంభిస్తుంది. ఈ వారం చెల్లింపు భద్రపరచబడుతుంది."
  ],
  nextWeekStarted: ["New week started. Add Sunday's harvest.", "కొత్త వారం ప్రారంభమైంది. ఆదివారం పంటను జోడించండి."],
  staleAdmin: [
    "The collection date for this week has passed. When the payouts are done, start the next week.",
    "ఈ వారం సేకరణ తేదీ దాటిపోయింది. చెల్లింపులు పూర్తయ్యాక తదుపరి వారం ప్రారంభించండి."
  ],
  staleFarmer: [
    "This list is from an earlier week. The coordinator will start the next week soon.",
    "ఈ జాబితా గత వారానికి చెందినది. ఏర్పాటుదారు త్వరలో తదుపరి వారం ప్రారంభిస్తారు."
  ],
  offlineNotice: [
    "You are offline. Showing the last saved list. Reconnect to make changes.",
    "మీరు ఆఫ్లైన్లో ఉన్నారు. చివరిగా భద్రపరచిన జాబితా చూపిస్తోంది. మార్పుల కోసం మళ్లీ కనెక్ట్ అవ్వండి."
  ],
  lastSaved: ["Last saved", "చివరిగా భద్రపరచినది"],
  installApp: ["Install app", "యాప్ ఇన్స్టాల్ చేయండి"],
  installHint: [
    "Add Community Harvest to your home screen for one-tap access.",
    "ఒక్క ట్యాప్లో తెరవడానికి సామూహిక పంటను హోమ్ స్క్రీన్కు జోడించండి."
  ],
  appInstalled: ["App installed on your home screen.", "యాప్ హోమ్ స్క్రీన్పై ఇన్స్టాల్ అయింది."],
  sessionEnded: ["Your session ended. Please sign in again.", "మీ సెషన్ ముగిసింది. మళ్లీ సైన్ ఇన్ చేయండి."],
  signedOut: ["You are signed out.", "మీరు సైన్ అవుట్ అయ్యారు."],
  entryAdded: ["Harvest added.", "పంట జోడించబడింది."],
  entryRemoved: ["Entry removed.", "నమోదు తీసివేయబడింది."],
  loadFailed: ["Could not load the app.", "యాప్ లోడ్ చేయలేకపోయాం."],
  noCrops: ["No vegetables are set up yet.", "ఇంకా కూరగాయలు సెటప్ చేయలేదు."],
  vegetables: ["Vegetables", "కూరగాయలు"],
  leafyGreens: ["Leafy greens", "ఆకుకూరలు"],
  priceAtOffice: ["Price at office", "ధర కార్యాలయంలో"],
  summaryFor: ["Summary for", "సారాంశం"],
  receiptFor: ["Receipt for", "రసీదు"],
  prepared: ["Prepared with Community Harvest", "సామూహిక పంటతో తయారు చేయబడింది"],
  collectionDate: ["Collection date", "సేకరణ తేదీ"],
  footerNote: [
    "One list, ten families, one trip to the collector office.",
    "ఒక జాబితా, పది కుటుంబాలు, కలెక్టర్ కార్యాలయానికి ఒక ప్రయాణం."
  ]
};

const ICONS = {
  logout:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
  chat:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>',
  copy:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  print:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
  refresh:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  install:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  plus:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  trash:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>',
  back:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>'
};

class ApiError extends Error {
  constructor(message, { status = 0, code = "REQUEST_FAILED" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function api(path, { method = "GET", body } = {}) {
  const options = {
    method,
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ApiError(t("networkError"), { code: "NETWORK" });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message || t("genericError"), {
      status: response.status,
      code: data?.error?.code || "REQUEST_FAILED"
    });
  }
  return data;
}

function t(key, values = {}) {
  const entry = STRINGS[key];
  let text = Array.isArray(entry) ? entry[state.lang === "te" ? 1 : 0] : key;
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

function formatMoney(paise) {
  const rupees = Number(paise || 0) / 100;
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(rupees)}`;
}

function formatKg(kg) {
  const value = new Intl.NumberFormat(state.lang === "te" ? "te-IN" : "en-IN", {
    maximumFractionDigits: 2
  }).format(Number(kg || 0));
  return `${value} ${t("kg")}`;
}

function formatTripDate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(state.lang === "te" ? "te-IN" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatTime(iso) {
  return new Intl.DateTimeFormat(state.lang === "te" ? "te-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function cropName(crop) {
  return state.lang === "te" ? crop.nameTe || crop.name : crop.name;
}

function categoryLabel(category) {
  return category === "leafy" ? t("leafyGreens") : t("vegetables");
}

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusPill(status) {
  if (status === "collecting") return `<span class="pill">${t("statusCollecting")}</span>`;
  if (status === "priced") return `<span class="pill pill-amber">${t("statusPriced")}</span>`;
  return `<span class="pill pill-closed">${t("statusClosed")}</span>`;
}

function iconButton(action, label, iconName, extra = "") {
  return `<button type="button" class="icon-button" data-action="${action}" aria-label="${escapeHtml(
    label
  )}" title="${escapeHtml(label)}" ${extra}>${ICONS[iconName] || ""}</button>`;
}

function toast(message, type = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const element = document.createElement("div");
  element.className = `toast${type === "error" ? " is-error" : type === "info" ? " is-info" : ""}`;
  element.textContent = message;
  region.append(element);
  setTimeout(() => {
    element.remove();
  }, 4200);
}

function errorMessage(error) {
  if (!(error instanceof ApiError)) return error?.message || t("genericError");
  if (error.code === "INVALID_CREDENTIALS") return t("invalidLogin");
  if (error.code === "RATE_LIMITED") return t("rateLimited");
  if (error.code === "NETWORK") return t("networkError");
  return error.message || t("genericError");
}

function setBusy(button, busy, label = "saving") {
  if (!button) return;
  if (busy) {
    button.dataset.previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = t(label);
  } else {
    button.disabled = false;
    if (button.dataset.previousLabel) {
      button.textContent = button.dataset.previousLabel;
      delete button.dataset.previousLabel;
    }
  }
}

function cachedOverview() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OVERVIEW_KEY) || "null");
    if (!parsed || parsed.userId !== state.me?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeOverview(overview) {
  try {
    localStorage.setItem(
      OVERVIEW_KEY,
      JSON.stringify({ userId: state.me?.id, savedAt: new Date().toISOString(), overview })
    );
  } catch {
    void 0;
  }
}

async function loadOverview(tripId = null, { first = false } = {}) {
  try {
    const query = tripId ? `?tripId=${encodeURIComponent(tripId)}` : "";
    const result = await api(`/overview${query}`);
    state.overview = result.overview;
    state.offline = false;
    state.cachedAt = null;
    state.viewingTripId = tripId;
    state.view = "app";
    storeOverview(result.overview);
    render();
  } catch (error) {
    if (first && (error.code === "NETWORK" || error.status === 0)) {
      const cached = cachedOverview();
      if (cached) {
        state.overview = cached.overview;
        state.offline = true;
        state.cachedAt = cached.savedAt;
        state.view = "app";
        state.viewingTripId = null;
        render();
        return;
      }
    }
    if (error.status === 401) {
      state.me = null;
      state.overview = null;
      state.view = "login";
      state.loginError = t("sessionEnded");
      render();
      return;
    }
    throw error;
  }
}

/* ---------- Rendering ---------- */

function render() {
  document.documentElement.lang = state.lang;
  if (state.view === "login") {
    document.title = `${t("appName")} | ${t("signIn")}`;
    app.innerHTML = renderLogin();
    return;
  }
  if (state.view === "error") {
    document.title = t("appName");
    app.innerHTML = renderError();
    return;
  }
  if (state.view !== "app" || !state.overview) {
    document.title = t("appName");
    app.innerHTML = renderLoading();
    return;
  }
  document.title = t("appName");
  app.innerHTML = renderApp();
  applyBarWidths();
}

function renderLoading() {
  return `
    <div class="app-shell">
      <main class="main">
        <div class="container main-inner">
          <div class="skeleton"></div>
          <div class="skeleton" style="height:150px"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        </div>
      </main>
    </div>
  `;
}

function renderError() {
  return `
    <div class="app-shell">
      <main class="main">
        <div class="container">
          <div class="state-card">
            <img src="/icons/icon.svg" alt="">
            <h1>${escapeHtml(t("loadFailed"))}</h1>
            <p>${escapeHtml(state.error || t("genericError"))}</p>
            <button type="button" class="btn btn-primary" data-action="reload">${t("retry")}</button>
          </div>
        </div>
      </main>
    </div>
  `;
}

function languageButton() {
  const next = state.lang === "en" ? "తెలుగు" : "English";
  return `<button type="button" class="lang-toggle" data-action="toggle-lang" aria-label="${escapeHtml(
    next
  )}">${next}</button>`;
}

function renderLogin() {
  const crops = ["🍅", "🥬", "🍆", "🌶️", "🥒", "🌿", "🧅", "🎃"];
  return `
    <div class="login-screen">
      <div class="login-top">
        <div class="brand">
          <img src="/icons/icon.svg" alt="">
          <span class="brand-copy">
            <span class="brand-name">${t("appName")}</span>
            <span class="brand-sub">${t("tagline")}</span>
          </span>
        </div>
        ${languageButton()}
      </div>
      <div class="login-body">
        <div class="login-card">
          <div class="login-mark">
            <img src="/icons/icon.svg" alt="">
            <div>
              <span class="eyebrow"><span class="eyebrow-dot"></span>${t("tagline")}</span>
            </div>
          </div>
          <h1>${t("loginTitle")}</h1>
          <p>${t("loginSubtitle")}</p>
          <div class="crop-strip" aria-hidden="true">
            ${crops.map((emoji) => `<span>${emoji}</span>`).join("")}
          </div>
          <form data-form="login" class="form-grid" novalidate>
            <label class="field">
              <span>${t("phone")}</span>
              <input
                type="tel"
                name="phone"
                inputmode="numeric"
                autocomplete="username"
                maxlength="14"
                placeholder="${t("phonePlaceholder")}"
                required
              >
            </label>
            <label class="field">
              <span>${t("pin")}</span>
              <input
                type="password"
                name="pin"
                inputmode="numeric"
                autocomplete="current-password"
                maxlength="4"
                pattern="[0-9]{4}"
                placeholder="••••"
                required
              >
            </label>
            <div class="form-error" data-login-error ${state.loginError ? "" : "hidden"}>${escapeHtml(
              state.loginError
            )}</div>
            <button type="submit" class="btn btn-primary btn-block">${t("signIn")}</button>
          </form>
          <p class="hint">${t("loginHint")}</p>
        </div>
        <p class="hint" style="text-align:center">${t("loginHelp")}</p>
      </div>
    </div>
  `;
}

function renderHeader() {
  const user = state.me;
  return `
    <header class="site-header">
      <div class="container header-inner">
        <div class="brand">
          <img src="/icons/icon.svg" alt="">
          <span class="brand-copy">
            <span class="brand-name">${t("appName")}</span>
            <span class="brand-sub">${t("tagline")}</span>
          </span>
        </div>
        <div class="header-actions">
          ${
            state.installPrompt
              ? iconButton("install", t("installApp"), "install")
              : ""
          }
          ${languageButton()}
          <div class="user-chip">
            <span class="user-avatar">${escapeHtml(initials(user.name))}</span>
            <span class="user-meta">
              <strong>${escapeHtml(user.name)}</strong>
              <span>${t(user.role === "admin" ? "coordinator" : "farmer")}</span>
            </span>
          </div>
          ${iconButton("logout", t("signOut"), "logout")}
        </div>
      </div>
    </header>
  `;
}

function renderApp() {
  const overview = state.overview;
  return `
    <div class="app-shell">
      ${renderHeader()}
      <main class="main">
        <div class="container main-inner">
          ${renderHero(overview)}
          ${
            state.offline
              ? `<div class="notice notice-offline">${ICONS.refresh}<div><strong>${t(
                  "offlineNotice"
                )}</strong>${
                  state.cachedAt
                    ? `<br>${t("lastSaved")}: ${escapeHtml(formatTime(state.cachedAt))}`
                    : ""
                }</div></div>`
              : ""
          }
          ${renderStaleNotice(overview)}
          ${renderDashboard(overview)}
        </div>
      </main>
      <footer class="app-footer">
        <div class="container">
          <strong>${t("appName")}</strong> · ${t("footerNote")}
        </div>
      </footer>
      ${renderPrintArea(overview)}
    </div>
  `;
}

function renderHero(overview) {
  const { trip, totals } = overview;
  const value = totals.pricedCrops > 0 ? formatMoney(totals.valuePaise) : "—";
  const valueNote =
    totals.pricedCrops > 0
      ? `${totals.pricedCrops} ${totals.pricedCrops === 1 ? "crop" : "crops"} priced`
      : t("afterPrices");
  const isPast = !trip.isCurrent;
  const hasReceipt =
    overview.canManage || (overview.mySettlement && overview.mySettlement.items.length > 0);

  return `
    <section class="trip-hero">
      <span class="eyebrow"><span class="eyebrow-dot"></span>${t("thisWeek")}</span>
      <h1>${formatTripDate(trip.tripDate)}</h1>
      <div class="trip-date">
        ${statusPill(trip.status)}
        <span>${t("tripOn")} ${formatTripDate(trip.tripDate)}</span>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span>${t("totalHarvest")}</span>
          <strong>${formatKg(totals.payableKg)}</strong>
          <small>${totals.families} ${t("families")}</small>
        </div>
        <div class="hero-stat">
          <span>${t("families")}</span>
          <strong>${totals.families}</strong>
          <small>${totals.listedKg > totals.payableKg ? `${formatKg(totals.listedKg)} ${t("listed")}` : t("kg")}</small>
        </div>
        <div class="hero-stat">
          <span>${t("payout")}</span>
          <strong>${value}</strong>
          <small>${valueNote}</small>
        </div>
      </div>
      <div class="hero-actions">
        ${
          hasReceipt
            ? `<button type="button" class="btn btn-primary" data-action="${
                overview.canManage ? "share-admin" : "share-mine"
              }">${ICONS.chat}${t("shareWhatsApp")}</button>`
            : ""
        }
        ${
          hasReceipt
            ? `<button type="button" class="btn btn-outline" data-action="copy-message">${ICONS.copy}${t(
                "copySummary"
              )}</button>`
            : ""
        }
        ${
          overview.canManage && totals.families > 0
            ? `<button type="button" class="btn btn-outline" data-action="print">${ICONS.print}${t(
                "printSheet"
              )}</button>`
            : ""
        }
        <button type="button" class="btn btn-outline" data-action="refresh">${ICONS.refresh}${t(
          "retry"
        )}</button>
      </div>
      ${
        overview.canManage && overview.tripHistory?.length
          ? `<select class="trip-select" id="trip-select" aria-label="${t("viewWeek")}">
              ${overview.tripHistory
                .map(
                  (week) =>
                    `<option value="${week.id}" ${
                      week.id === trip.id ? "selected" : ""
                    }>${escapeHtml(formatTripDate(week.tripDate))} · ${escapeHtml(
                      week.status === "collecting"
                        ? t("statusCollecting")
                        : week.status === "priced"
                          ? t("statusPriced")
                          : t("statusClosed")
                    )}</option>`
                )
                .join("")}
            </select>`
          : ""
      }
      ${
        isPast
          ? `<button type="button" class="btn btn-outline btn-sm" data-action="back-current" style="margin-top:10px">${ICONS.back}${t(
              "backToCurrent"
            )}</button>`
          : ""
      }
    </section>
  `;
}

function renderStaleNotice(overview) {
  const { trip } = overview;
  if (trip.status === "closed" || trip.tripDate >= todayISO() || !trip.isCurrent) return "";
  return `
    <div class="notice notice-warn">
      <span>⚠️</span>
      <div>
        <strong>${overview.canManage ? t("staleAdmin") : t("staleFarmer")}</strong>
        ${
          overview.canManage
            ? `<div style="margin-top:8px"><button type="button" class="btn btn-secondary btn-sm" data-action="next-week">${t(
                "startNextWeek"
              )}</button></div>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderDashboard(overview) {
  const canManage = overview.canManage;
  if (canManage) {
    return `
      <div class="dashboard">
        ${renderAddCard(overview)}
        ${renderPriceCard(overview)}
        ${renderCombinedCard(overview)}
        <div class="two-col">
          ${renderPayoutsCard(overview)}
          ${renderWeighCard(overview)}
        </div>
        <div class="two-col">
          ${renderFamiliesCard(overview)}
          ${renderWeekCard(overview)}
        </div>
      </div>
    `;
  }

  return `
    <div class="dashboard">
      <div class="two-col">
        ${renderAddCard(overview)}
        ${renderMyListCard(overview)}
      </div>
      ${renderCombinedCard(overview)}
      ${renderMyPayoutCard(overview)}
    </div>
  `;
}

function cropOptions(overview, selectedId = "") {
  const vegetables = overview.crops.filter((crop) => crop.category !== "leafy");
  const leafy = overview.crops.filter((crop) => crop.category === "leafy");
  const option = (crop) =>
    `<option value="${crop.id}" ${Number(selectedId) === crop.id ? "selected" : ""}>${escapeHtml(
      crop.emoji ? `${crop.emoji} ` : ""
    )}${escapeHtml(cropName(crop))}</option>`;

  return `
    <option value="">${t("selectVegetable")}</option>
    ${
      vegetables.length
        ? `<optgroup label="${t("vegetables")}">${vegetables.map(option).join("")}</optgroup>`
        : ""
    }
    ${leafy.length ? `<optgroup label="${t("leafyGreens")}">${leafy.map(option).join("")}</optgroup>` : ""}
  `;
}

function renderAddCard(overview) {
  const isAdmin = overview.canManage;
  const locked = !overview.canAdd;
  const noFamilies = isAdmin && overview.farmers.length === 0;

  return `
    <section class="card" id="add-harvest">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("thisWeek")}</span>
          <h2>${isAdmin ? t("addForFamily") : t("addHarvest")}</h2>
          <p>${t("replacesHint")}</p>
        </div>
      </div>
      ${
        locked
          ? `<div class="notice">${ICONS.check}<div><strong>${
              overview.trip.status === "closed" ? t("weekClosed") : t("listLocked")
            }</strong></div></div>`
          : noFamilies
            ? `<div class="notice">${t("addFamilyFirst")}</div>`
            : `
              <form data-form="add-listing" class="form-grid">
                ${
                  isAdmin
                    ? `<label class="field">
                        <span>${t("family")}</span>
                        <select name="farmerId" required>
                          <option value="">${t("selectFamily")}</option>
                          ${overview.farmers
                            .filter((family) => family.isActive)
                            .map(
                              (family) =>
                                `<option value="${family.id}">${escapeHtml(family.name)}${
                                  family.village ? ` · ${escapeHtml(family.village)}` : ""
                                }</option>`
                            )
                            .join("")}
                        </select>
                      </label>`
                    : ""
                }
                <label class="field">
                  <span>${t("vegetable")}</span>
                  <select name="cropId" required>${cropOptions(overview)}</select>
                </label>
                <div class="form-row">
                  <label class="field">
                    <span>${t("weightKg")}</span>
                    <input
                      type="number"
                      name="kg"
                      inputmode="decimal"
                      min="0.01"
                      max="5000"
                      step="0.01"
                      placeholder="${t("weightPlaceholder")}"
                      required
                    >
                  </label>
                  <label class="field">
                    <span>${t("grade")}</span>
                    <select name="grade">
                      <option value="A">${t("gradeA")}</option>
                      <option value="B">${t("gradeB")}</option>
                      <option value="C">${t("gradeC")}</option>
                    </select>
                  </label>
                </div>
                <label class="field">
                  <span>${t("notes")}</span>
                  <input type="text" name="notes" maxlength="160" placeholder="${t("notesPlaceholder")}">
                </label>
                <button type="submit" class="btn btn-primary btn-block">${ICONS.plus}${t("addToList")}</button>
              </form>
              <div class="form-note" style="margin-top:12px">
                <span>💡</span>
                <div><strong>${t("priceNotNeeded")}</strong></div>
              </div>
            `
      }
    </section>
  `;
}

function priceFor(overview, cropId) {
  return overview.prices.find((price) => price.cropId === cropId)?.pricePaise ?? null;
}

function renderMyListCard(overview) {
  const entries = overview.myListings || [];
  const canRemove = overview.trip.status === "collecting";

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("myList")}</span>
          <h2>${t("myList")}</h2>
          <p>${entries.length} ${entries.length === 1 ? t("vegetable") : t("vegetables")}</p>
        </div>
      </div>
      ${
        entries.length
          ? `<div class="entry-list">
              ${entries
                .map((entry) => {
                  const crop = overview.crops.find((row) => row.id === entry.cropId);
                  const price = priceFor(overview, entry.cropId);
                  const payable = entry.acceptedKg == null ? entry.listedKg : entry.acceptedKg;
                  return `<div class="entry">
                    <span class="entry-emoji">${escapeHtml(crop?.emoji || "🌿")}</span>
                    <div class="entry-main">
                      <strong>${escapeHtml(crop ? cropName(crop) : entry.cropName)}</strong>
                      <span>${t("grade")} ${escapeHtml(entry.grade)}${
                        entry.notes ? ` · ${escapeHtml(entry.notes)}` : ""
                      }</span>
                    </div>
                    <div class="entry-kg">
                      ${formatKg(payable)}
                      <small>${
                        price == null
                          ? t("atOffice")
                          : `${formatMoney(price)}/${t("kg")} · ${formatMoney(
                              Math.round(payable * price)
                            )}`
                      }</small>
                    </div>
                    ${
                      canRemove
                        ? iconButton("remove-listing", t("remove"), "trash", `data-id="${entry.id}"`)
                        : ""
                    }
                  </div>`;
                })
                .join("")}
            </div>`
          : `<div class="empty">${t("myListEmpty")}</div>`
      }
    </section>
  `;
}

function renderCombinedCard(overview) {
  const summary = overview.summary;

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("everyoneList")}</span>
          <h2>${t("everyoneList")}</h2>
          <p>${formatKg(overview.totals.payableKg)} · ${overview.totals.families} ${t("families")}</p>
        </div>
        <span class="pill ${overview.totals.unpricedCrops ? "pill-amber" : ""}">${
          overview.totals.unpricedCrops
            ? `${overview.totals.unpricedCrops} ${t("unpriced")}`
            : overview.totals.pricedCrops
              ? t("statusPriced")
              : t("priceAtOffice")
        }</span>
      </div>
      ${
        summary.length
          ? summary
              .map((crop) => {
                const weighed =
                  crop.totalPayableKg < crop.totalListedKg || crop.breakdown?.some((row) => row.acceptedKg != null);
                return `
                  <div class="crop-block">
                    <div class="crop-head">
                      <span class="entry-emoji">${escapeHtml(crop.emoji || "🌿")}</span>
                      <div class="crop-name">
                        <strong>${escapeHtml(cropName(crop))}</strong>
                        <span>
                          ${categoryLabel(crop.category)} ·
                          ${formatKg(crop.totalPayableKg)}
                          ${weighed ? ` · ${formatKg(crop.totalListedKg)} ${t("listed")}` : ""}
                          ${
                            crop.pricePaise == null && crop.lastPricePaise
                              ? ` · ${t("lastRate")} ${formatMoney(crop.lastPricePaise)}/${t("kg")}`
                              : ""
                          }
                        </span>
                      </div>
                      <div class="crop-money">
                        <strong>${
                          crop.pricePaise == null ? t("atOffice") : formatMoney(crop.valuePaise)
                        }</strong>
                        <span>${
                          crop.pricePaise == null
                            ? t("priceNotNeeded")
                            : `${formatMoney(crop.pricePaise)}/${t("kg")}`
                        }</span>
                      </div>
                    </div>
                    <div class="crop-bar" data-bar="${Math.min(
                      100,
                      Math.round((crop.totalPayableKg / Math.max(1, overview.totals.payableKg)) * 100)
                    )}"><span></span></div>
                    ${
                      overview.canManage && crop.breakdown?.length
                        ? `<details class="breakdown-wrap">
                            <summary>${t("byFamily")} (${crop.breakdown.length})</summary>
                            <div class="breakdown">
                              ${crop.breakdown
                                .map(
                                  (row) => `<div class="breakdown-row">
                                    <span>${escapeHtml(row.farmerName)}${
                                      row.acceptedKg != null &&
                                      row.acceptedKg !== row.listedKg
                                        ? ` · ${t("weighed")} ${formatKg(row.acceptedKg)}`
                                        : ""
                                    }</span>
                                    <strong>${formatKg(row.payableKg)}${
                                      row.valuePaise == null
                                        ? ""
                                        : ` · ${formatMoney(row.valuePaise)}`
                                    }</strong>
                                  </div>`
                                )
                                .join("")}
                            </div>
                          </details>`
                        : ""
                    }
                  </div>
                `;
              })
              .join("")
          : `<div class="empty">${t("listEmpty")}</div>`
      }
    </section>
  `;
}

function renderPriceCard(overview) {
  if (!overview.canManage) return "";
  if (overview.trip.status === "closed") {
    return `
      <section class="card">
        <div class="card-head"><div><span class="eyebrow"><span class="eyebrow-dot"></span>${t(
          "pricesTitle"
        )}</span><h2>${t("pricesTitle")}</h2></div></div>
        <div class="empty">${t("weekClosed")}</div>
      </section>
    `;
  }

  if (!overview.summary.length) {
    return `
      <section class="card">
        <div class="card-head"><div><span class="eyebrow"><span class="eyebrow-dot"></span>${t(
          "pricesTitle"
        )}</span><h2>${t("pricesTitle")}</h2><p>${t("pricesHint")}</p></div></div>
        <div class="empty">${t("listEmpty")}</div>
      </section>
    `;
  }

  const hasPrices = overview.prices.length > 0;

  return `
    <section class="card" id="prices">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("pricesTitle")}</span>
          <h2>${t("pricesTitle")}</h2>
          <p>${t("pricesHint")}</p>
        </div>
      </div>
      <form data-form="prices" class="form-grid" novalidate>
        ${overview.summary
          .map(
            (crop) => `
              <div class="price-row">
                <div class="price-row-name">
                  <span>${escapeHtml(crop.emoji || "🌿")}</span>
                  <div>
                    ${escapeHtml(cropName(crop))}
                    <small>${formatKg(crop.totalPayableKg)}${
                      crop.lastPricePaise
                        ? ` · ${t("lastRate")} ${formatMoney(crop.lastPricePaise)}`
                        : ""
                    }</small>
                  </div>
                </div>
                <div class="price-input-wrap">
                  <input
                    class="price-input"
                    type="number"
                    inputmode="decimal"
                    min="1"
                    max="100000"
                    step="0.5"
                    data-crop-id="${crop.cropId}"
                    aria-label="${escapeHtml(cropName(crop))} ${t("pricePerKg")}"
                    placeholder="0"
                    value="${crop.pricePaise == null ? "" : crop.pricePaise / 100}"
                  >
                </div>
              </div>
            `
          )
          .join("")}
        <button type="submit" class="btn btn-primary btn-block">${
          hasPrices ? t("updatePrices") : t("savePrices")
        }</button>
      </form>
    </section>
  `;
}

function renderWeighCard(overview) {
  if (!overview.canManage) return "";
  const listings = overview.listings || [];
  if (!listings.length) return "";

  return `
    <section class="card">
      <details>
        <summary class="eyebrow" style="cursor:pointer;list-style:none">
          <span class="eyebrow-dot"></span>${t("weighTitle")}
        </summary>
        <p class="hint" style="margin:8px 0 12px">${t("weighHint")}</p>
        ${
          overview.trip.status === "closed"
            ? `<div class="empty">${t("weekClosed")}</div>`
            : listings
                .map(
                  (listing) => `
                    <form data-form="weigh" data-id="${listing.id}" class="weigh-row">
                      <div class="weigh-row-info">
                        <strong>${escapeHtml(listing.farmerName)}</strong>
                        <span>${escapeHtml(
                          state.lang === "te" ? listing.cropNameTe : listing.cropName
                        )} · ${formatKg(listing.listedKg)} ${t("listed")} · ${t("grade")} ${escapeHtml(
                          listing.grade
                        )}</span>
                      </div>
                      <input
                        class="weigh-input"
                        type="number"
                        name="acceptedKg"
                        inputmode="decimal"
                        min="0"
                        max="5000"
                        step="0.01"
                        value="${listing.acceptedKg == null ? listing.listedKg : listing.acceptedKg}"
                        aria-label="${t("acceptedKg")}"
                      >
                      <button type="submit" class="btn btn-secondary btn-sm">${t("save")}</button>
                    </form>
                  `
                )
                .join("")
        }
      </details>
    </section>
  `;
}

function renderPayoutsCard(overview) {
  if (!overview.canManage) return "";
  const settlements = overview.settlements || [];
  const hasPrices = overview.totals.pricedCrops > 0;

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("payoutsTitle")}</span>
          <h2>${t("payoutsTitle")}</h2>
          <p>${t("payoutsHint")}</p>
        </div>
      </div>
      <div class="payout-hero">
        <span class="eyebrow">${t("totalPayout")}</span>
        <div class="payout-total">${hasPrices ? formatMoney(overview.totals.valuePaise) : "—"}</div>
        <span class="pill">${t("noDeductions")}</span>
      </div>
      ${
        settlements.length && hasPrices
          ? `<div style="margin-top:14px">
              ${settlements
                .map(
                  (family) => `
                    <div class="settlement-row">
                      <span class="settlement-avatar">${escapeHtml(initials(family.farmerName))}</span>
                      <div class="settlement-main">
                        <strong>${escapeHtml(family.farmerName)}</strong>
                        <span>${formatKg(family.payableKg)}${
                          family.village ? ` · ${escapeHtml(family.village)}` : ""
                        }</span>
                      </div>
                      <div class="settlement-amount">
                        ${formatMoney(family.valuePaise)}
                        ${
                          family.unpricedItems
                            ? `<small>${family.unpricedItems} ${t("unpriced")}</small>`
                            : ""
                        }
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>`
          : `<div class="empty" style="margin-top:14px">${t("noPricesYet")}</div>`
      }
      <div class="row" style="margin-top:14px">
        ${
          hasPrices
            ? `<button type="button" class="btn btn-primary btn-sm" data-action="share-admin">${ICONS.chat}${t(
                "shareWhatsApp"
              )}</button>
               <button type="button" class="btn btn-outline btn-sm" data-action="copy-message">${ICONS.copy}${t(
                 "copySummary"
               )}</button>
               <button type="button" class="btn btn-outline btn-sm" data-action="print">${ICONS.print}${t(
                 "printSheet"
               )}</button>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderMyPayoutCard(overview) {
  const settlement = overview.mySettlement;
  const hasPrices = overview.totals.pricedCrops > 0;

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("myPayout")}</span>
          <h2>${t("myPayout")}</h2>
          <p>${t("myPayoutHint")}</p>
        </div>
      </div>
      ${
        settlement && hasPrices
          ? `<div class="payout-hero">
              <span class="eyebrow">${t("totalPayout")}</span>
              <div class="payout-total">${formatMoney(settlement.valuePaise)}</div>
              <div class="payout-list">
                ${settlement.items
                  .map(
                    (item) => `
                      <div class="payout-line">
                        <span>${escapeHtml(item.emoji || "🌿")} ${escapeHtml(
                          state.lang === "te" ? item.nameTe : item.name
                        )}
                          <small>${formatKg(item.payableKg)}${
                            item.pricePaise == null
                              ? ` · ${t("priceAtOffice")}`
                              : ` × ${formatMoney(item.pricePaise)}`
                          }</small>
                        </span>
                        <strong>${
                          item.valuePaise == null ? "—" : formatMoney(item.valuePaise)
                        }</strong>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
            <div class="row" style="margin-top:14px">
              <button type="button" class="btn btn-primary btn-sm" data-action="share-mine">${ICONS.chat}${t(
                "shareReceipt"
              )}</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="copy-message">${ICONS.copy}${t(
                "copySummary"
              )}</button>
              <button type="button" class="btn btn-outline btn-sm" data-action="print">${ICONS.print}${t(
                "printSheet"
              )}</button>
            </div>`
          : `<div class="empty">${t("payoutPending")}</div>`
      }
    </section>
  `;
}

function renderFamiliesCard(overview) {
  if (!overview.canManage) return "";
  const families = overview.farmers || [];

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("familiesTitle")}</span>
          <h2>${t("familiesTitle")}</h2>
          <p>${families.length} ${t("families")}</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-family-form">
          ${state.familyFormOpen ? t("closeForm") : `${ICONS.plus}${t("addFamily")}`}
        </button>
      </div>
      ${
        state.familyFormOpen
          ? `<form data-form="add-family" class="form-grid" style="margin-bottom:16px">
              <div class="form-error" data-family-error ${state.familyError ? "" : "hidden"}>${escapeHtml(
                state.familyError
              )}</div>
              <label class="field">
                <span>${t("familyName")}</span>
                <input type="text" name="name" maxlength="80" placeholder="${t(
                  "familyNamePlaceholder"
                )}" required>
              </label>
              <div class="form-row">
                <label class="field">
                  <span>${t("phone")}</span>
                  <input type="tel" name="phone" inputmode="numeric" maxlength="14" placeholder="${t(
                    "phonePlaceholder"
                  )}" required>
                </label>
                <label class="field">
                  <span>${t("newPin")}</span>
                  <input type="tel" name="pin" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="••••" required>
                </label>
              </div>
              <label class="field">
                <span>${t("village")}</span>
                <input type="text" name="village" maxlength="80" placeholder="${t(
                  "villagePlaceholder"
                )}">
              </label>
              <button type="submit" class="btn btn-primary btn-block">${t("saveFamily")}</button>
              <p class="hint">${t("loginHint")}</p>
            </form>`
          : ""
      }
      ${
        families.length
          ? `<div class="family-grid">
              ${families
                .map(
                  (family) => `
                    <div class="family-card ${family.isActive ? "" : "is-inactive"}">
                      <span class="settlement-avatar">${escapeHtml(initials(family.name))}</span>
                      <div class="family-main">
                        <strong>${escapeHtml(family.name)}</strong>
                        <span>${escapeHtml(family.village || t("farmer"))}${
                          family.isActive ? "" : ` · ${t("inactive")}`
                        }</span>
                      </div>
                      <span class="family-phone">${escapeHtml(family.phone)}</span>
                    </div>
                  `
                )
                .join("")}
            </div>`
          : `<div class="empty">${t("addFamilyFirst")}</div>`
      }
    </section>
  `;
}

function renderWeekCard(overview) {
  if (!overview.canManage) return "";
  const { trip } = overview;

  return `
    <section class="card">
      <div class="card-head">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span>${t("weekTools")}</span>
          <h2>${t("weekTools")}</h2>
          <p>${t("collectionDate")}: ${formatTripDate(trip.tripDate)}</p>
        </div>
        ${statusPill(trip.status)}
      </div>
      <p class="hint" style="margin-bottom:14px">${t("nextWeekText")}</p>
      <button type="button" class="btn btn-outline btn-block" data-action="next-week">
        ${t("startNextWeek")}
      </button>
      ${
        !trip.isCurrent
          ? `<button type="button" class="btn btn-secondary btn-block" style="margin-top:8px" data-action="back-current">${ICONS.back}${t(
              "backToCurrent"
            )}</button>`
          : ""
      }
    </section>
  `;
}

function renderPrintArea(overview) {
  const settlements = overview.canManage ? overview.settlements || [] : [];
  const mine = overview.mySettlement;

  if (overview.canManage && settlements.length) {
    return `
      <div class="print-area">
        <h1>${t("appName")}</h1>
        <p>${t("collectionDate")}: ${formatTripDate(overview.trip.tripDate)} · ${t("totalHarvest")}: ${formatKg(
          overview.totals.payableKg
        )}</p>
        <h2>${t("payoutsTitle")}</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>${t("family")}</th>
              <th class="num">${t("kg")}</th>
              <th class="num">${t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            ${settlements
              .map(
                (family) => `
                  <tr>
                    <td>${escapeHtml(family.farmerName)}</td>
                    <td class="num">${formatKg(family.payableKg)}</td>
                    <td class="num">${formatMoney(family.valuePaise)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <th>${t("totalPayout")}</th>
              <th class="num">${formatKg(overview.totals.payableKg)}</th>
              <th class="num">${formatMoney(overview.totals.valuePaise)}</th>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:12px">${t("prepared")}</p>
      </div>
    `;
  }

  if (!overview.canManage && mine) {
    return `
      <div class="print-area">
        <h1>${t("receiptFor")} ${escapeHtml(state.me.name)}</h1>
        <p>${t("collectionDate")}: ${formatTripDate(overview.trip.tripDate)}</p>
        <table class="print-table">
          <thead>
            <tr>
              <th>${t("vegetable")}</th>
              <th class="num">${t("kg")}</th>
              <th class="num">${t("rate")}</th>
              <th class="num">${t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            ${mine.items
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHtml(state.lang === "te" ? item.nameTe : item.name)}</td>
                    <td class="num">${formatKg(item.payableKg)}</td>
                    <td class="num">${item.pricePaise == null ? "—" : formatMoney(item.pricePaise)}</td>
                    <td class="num">${item.valuePaise == null ? "—" : formatMoney(item.valuePaise)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="3">${t("totalPayout")}</th>
              <th class="num">${formatMoney(mine.valuePaise)}</th>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:12px">${t("prepared")}</p>
      </div>
    `;
  }

  return "";
}

function applyBarWidths() {
  document.querySelectorAll("[data-bar]").forEach((bar) => {
    const fill = bar.querySelector("span");
    if (fill) fill.style.width = `${Math.max(2, Number(bar.dataset.bar) || 0)}%`;
  });
}

/* ---------- Messages ---------- */

function buildAdminMessage(overview) {
  const lines = [`🌿 ${t("appName")} — ${formatTripDate(overview.trip.tripDate)}`, ""];
  const hasPrices = overview.totals.pricedCrops > 0;

  for (const crop of overview.summary) {
    const name = cropName(crop);
    if (crop.pricePaise == null) {
      lines.push(
        `${name}: ${formatKg(crop.totalPayableKg)}${
          crop.lastPricePaise ? ` (${t("lastRate")} ${formatMoney(crop.lastPricePaise)})` : ""
        }`
      );
      const familyParts = crop.breakdown?.map(
        (row) => `${row.farmerName} ${formatKg(row.payableKg)}`
      );
      if (familyParts?.length) lines.push(`  ${familyParts.join(", ")}`);
    } else {
      lines.push(
        `${name} — ${formatKg(crop.totalPayableKg)} @ ${formatMoney(crop.pricePaise)}/${t(
          "kg"
        )} = ${formatMoney(crop.valuePaise)}`
      );
      for (const row of crop.breakdown || []) {
        lines.push(
          `  • ${row.farmerName}: ${formatKg(row.payableKg)} = ${formatMoney(row.valuePaise || 0)}`
        );
      }
    }
  }

  lines.push("");
  if (hasPrices) {
    lines.push(`${t("totalPayout")}: ${formatMoney(overview.totals.valuePaise)}`);
    if (overview.totals.unpricedCrops) {
      lines.push(`${overview.totals.unpricedCrops} ${t("unpriced")}`);
    }
  } else {
    lines.push(
      `${t("total")}: ${formatKg(overview.totals.payableKg)} ${t("fromFamilies")} ${
        overview.totals.families
      } ${t("families")}`
    );
  }
  return lines.join("\n");
}

function buildFarmerMessage(overview) {
  const settlement = overview.mySettlement;
  if (!settlement) return "";
  const lines = [`🌿 ${state.me.name} — ${formatTripDate(overview.trip.tripDate)}`, ""];

  for (const item of settlement.items) {
    const name = state.lang === "te" ? item.nameTe : item.name;
    if (item.pricePaise == null) {
      lines.push(`${name}: ${formatKg(item.payableKg)} — ${t("priceAtOffice")}`);
    } else {
      lines.push(
        `${name}: ${formatKg(item.payableKg)} × ${formatMoney(item.pricePaise)} = ${formatMoney(
          item.valuePaise
        )}`
      );
    }
  }

  lines.push("");
  lines.push(`${t("totalPayout")}: ${formatMoney(settlement.valuePaise)}`);
  return lines.join("\n");
}

function currentMessage() {
  if (!state.overview) return "";
  return state.overview.canManage
    ? buildAdminMessage(state.overview)
    : buildFarmerMessage(state.overview);
}

async function shareMessage(text) {
  if (!text) return;
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      void 0;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

async function copyMessage(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast(t("copied"), "info");
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    toast(t("copied"), "info");
  }
}

/* ---------- Actions ---------- */

async function handleAction(action, element) {
  switch (action) {
    case "toggle-lang":
      state.lang = state.lang === "en" ? "te" : "en";
      localStorage.setItem(LANG_KEY, state.lang);
      state.loginError = "";
      state.familyError = "";
      render();
      break;
    case "refresh":
    case "reload":
      if (action === "reload") {
        window.location.reload();
        return;
      }
      await loadOverview(state.viewingTripId);
      toast(t("statusPriced"), "info");
      break;
    case "back-current":
      await loadOverview(null);
      break;
    case "logout": {
      try {
        await api("/logout", { method: "POST", body: {} });
      } catch {
        void 0;
      }
      localStorage.removeItem(OVERVIEW_KEY);
      state.me = null;
      state.overview = null;
      state.view = "login";
      state.loginError = "";
      state.familyFormOpen = false;
      state.offline = false;
      render();
      toast(t("signedOut"), "info");
      break;
    }
    case "install": {
      if (!state.installPrompt) {
        toast(t("installHint"), "info");
        break;
      }
      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      render();
      break;
    }
    case "remove-listing": {
      if (!window.confirm(t("removeConfirm"))) return;
      await api(`/listings/${element.dataset.id}`, { method: "DELETE" });
      toast(t("entryRemoved"), "info");
      await loadOverview(state.overview.trip.isCurrent ? null : state.overview.trip.id);
      break;
    }
    case "toggle-family-form":
      state.familyFormOpen = !state.familyFormOpen;
      state.familyError = "";
      render();
      break;
    case "next-week": {
      if (!window.confirm(t("nextWeekText"))) return;
      const result = await api("/trips/next", { method: "POST", body: {} });
      state.overview = result.overview;
      state.viewingTripId = null;
      storeOverview(result.overview);
      render();
      toast(t("nextWeekStarted"));
      break;
    }
    case "share-admin":
    case "share-mine":
    case "copy-message": {
      const text = currentMessage();
      if (action === "copy-message") await copyMessage(text);
      else await shareMessage(text);
      break;
    }
    case "print":
      window.print();
      break;
    default:
      break;
  }
}

async function handleSubmit(form) {
  const type = form.dataset.form;
  const submit = form.querySelector('button[type="submit"]');

  if (type === "login") {
    if (state.loginBusy) return;
    state.loginBusy = true;
    const errorBox = form.querySelector("[data-login-error]");
    if (errorBox) errorBox.hidden = true;
    setBusy(submit, true, "signingIn");
    try {
      const data = new FormData(form);
      const result = await api("/login", {
        method: "POST",
        body: { phone: String(data.get("phone") || ""), pin: String(data.get("pin") || "") }
      });
      state.me = result.user;
      state.loginError = "";
      state.loginBusy = false;
      await loadOverview(null, { first: true });
    } catch (error) {
      state.loginBusy = false;
      setBusy(submit, false);
      const message = errorMessage(error);
      state.loginError = message;
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
      }
      toast(message, "error");
    }
    return;
  }

  if (type === "add-listing") {
    setBusy(submit, true);
    try {
      const data = new FormData(form);
      const payload = {
        cropId: Number(data.get("cropId")),
        kg: Number(data.get("kg")),
        grade: String(data.get("grade") || "A"),
        notes: String(data.get("notes") || "")
      };
      if (state.overview.canManage) payload.farmerId = Number(data.get("farmerId"));
      await api("/listings", { method: "POST", body: payload });
      toast(t("entryAdded"));
      await loadOverview(state.overview.trip.isCurrent ? null : state.overview.trip.id);
    } catch (error) {
      setBusy(submit, false);
      toast(errorMessage(error), "error");
    }
    return;
  }

  if (type === "prices") {
    const inputs = [...form.querySelectorAll(".price-input")];
    const prices = [];
    let missing = false;
    for (const input of inputs) {
      const raw = input.value.trim();
      if (!raw) {
        missing = true;
        input.focus();
        break;
      }
      const rupees = Number(raw);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        toast(t("genericError"), "error");
        input.focus();
        return;
      }
      prices.push({
        cropId: Number(input.dataset.cropId),
        pricePaise: Math.round(rupees * 100)
      });
    }
    if (missing || !prices.length) {
      toast(t("enterAllPrices"), "error");
      return;
    }
    setBusy(submit, true);
    try {
      const result = await api("/prices", { method: "POST", body: { prices } });
      state.overview = result.overview;
      storeOverview(result.overview);
      render();
      toast(t("pricesSaved"));
    } catch (error) {
      setBusy(submit, false);
      toast(errorMessage(error), "error");
    }
    return;
  }

  if (type === "weigh") {
    setBusy(submit, true);
    try {
      const data = new FormData(form);
      await api(`/listings/${form.dataset.id}/weigh`, {
        method: "PATCH",
        body: { acceptedKg: Number(data.get("acceptedKg")) }
      });
      toast(t("weighedSaved"), "info");
      await loadOverview(state.overview.trip.isCurrent ? null : state.overview.trip.id);
    } catch (error) {
      setBusy(submit, false);
      toast(errorMessage(error), "error");
    }
    return;
  }

  if (type === "add-family") {
    const errorBox = form.querySelector("[data-family-error]");
    if (errorBox) errorBox.hidden = true;
    setBusy(submit, true);
    try {
      const data = new FormData(form);
      await api("/farmers", {
        method: "POST",
        body: {
          name: String(data.get("name") || ""),
          phone: String(data.get("phone") || ""),
          village: String(data.get("village") || ""),
          pin: String(data.get("pin") || "")
        }
      });
      state.familyFormOpen = false;
      state.familyError = "";
      toast(t("familyAdded"));
      await loadOverview(state.overview.trip.isCurrent ? null : state.overview.trip.id);
    } catch (error) {
      setBusy(submit, false);
      const message = errorMessage(error);
      state.familyError = message;
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
      }
      toast(message, "error");
    }
  }
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    event.preventDefault();
    try {
      await handleAction(target.dataset.action, target);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        state.me = null;
        state.overview = null;
        state.view = "login";
        state.loginError = t("sessionEnded");
        render();
        return;
      }
      toast(errorMessage(error), "error");
    }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    try {
      await handleSubmit(form);
    } catch (error) {
      toast(errorMessage(error), "error");
      const submit = form.querySelector('button[type="submit"]');
      setBusy(submit, false);
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.id !== "trip-select") return;
    const tripId = Number(event.target.value);
    try {
      const currentId = state.overview?.trip.isCurrent ? null : state.overview?.trip.id;
      await loadOverview(tripId === currentId ? null : tripId);
    } catch (error) {
      toast(errorMessage(error), "error");
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    if (state.view === "app") render();
  });

  window.addEventListener("appinstalled", () => {
    state.installPrompt = null;
    toast(t("appInstalled"));
    if (state.view === "app") render();
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["https:", "http:"].includes(window.location.protocol)) return;
  if (
    window.location.protocol === "http:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
  ) {
    return;
  }
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    void 0;
  }
}

async function boot() {
  bindEvents();
  try {
    const result = await api("/me");
    if (!result.user) {
      state.view = "login";
      render();
      void registerServiceWorker();
      return;
    }
    state.me = result.user;
    await loadOverview(null, { first: true });
    void registerServiceWorker();
  } catch (error) {
    state.view = "error";
    state.error = errorMessage(error);
    render();
  }
}

boot();
