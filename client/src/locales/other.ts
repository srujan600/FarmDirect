import type { TranslationSchema } from './types';
import { hi } from './hi';
import { en } from './en';
import { ur } from './ur';

type DeepPartialTranslation = {
  [K in keyof TranslationSchema]?: Partial<TranslationSchema[K]>;
};

/**
 * Creates a complete TranslationSchema bundle with targeted native titles,
 * using Hindi as the primary regional fallback and English as the baseline.
 */
function createLocalizedBundle(
  overrides: DeepPartialTranslation
): TranslationSchema {
  return {
    ...hi,
    ...overrides,
    nav: { ...hi.nav, ...(overrides.nav || {}) },
    hero: { ...hi.hero, ...(overrides.hero || {}) },
    grid: { ...hi.grid, ...(overrides.grid || {}) },
    calculator: { ...hi.calculator, ...(overrides.calculator || {}) },
    marketplace: { ...hi.marketplace, ...(overrides.marketplace || {}) },
    forecast: { ...hi.forecast, ...(overrides.forecast || {}) },
    logistics: { ...hi.logistics, ...(overrides.logistics || {}) },
    contracts: { ...hi.contracts, ...(overrides.contracts || {}) },
    provenance: { ...hi.provenance, ...(overrides.provenance || {}) },
    offline: { ...hi.offline, ...(overrides.offline || {}) },
    sandbox: { ...hi.sandbox, ...(overrides.sandbox || {}) },
    footer: { ...hi.footer, ...(overrides.footer || {}) },
    cart: { ...hi.cart, ...(overrides.cart || {}) },
    auth: { ...hi.auth, ...(overrides.auth || {}) },
    farmerWizard: { ...hi.farmerWizard, ...(overrides.farmerWizard || {}) },
    assistant: { ...hi.assistant, ...(overrides.assistant || {}) },
    common: { ...hi.common, ...(overrides.common || {}) },
  };
}

// 1. Bengali (বাংলা)
export const bn: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'এগ্রিডাইরেক্ট',
    marketplace: 'সরাসরি বাজার',
    sellHarvest: '+ ফসল বিক্রি (ভয়েস AI)',
    coldLogistics: 'কোল্ড-চেন পরিবহন',
    escrowLedger: 'সুরক্ষিত এসক্রো অ্যাকাউন্ট',
    aiForecast: 'AI চাহিদা পূর্বাভাস',
    b2bContracts: 'প্রাতিষ্ঠানিক চুক্তি (B2B)',
    provenance: 'খামার থেকে খাবার টেবিল',
    mandiBenchmark: 'লাইভ মাণ্ডি বাজারদর',
    switchLanguage: 'ভাষা পরিবর্তন করুন',
    searchLanguage: '২২টি ভারতীয় ভাষায় খুঁজুন...',
    cart: 'ঝুড়ি',
    login: 'লগ ইন করুন',
    logout: 'লগ আউট',
    myProfile: 'আমার প্রোফাইল',
  },
  hero: {
    badge: '১,২৪৮ যাচাইকৃত খামার যুক্ত · ১৪,৮৯০ কুইন্টাল সরবরাহ',
    titleLine1: 'সরাসরি খামার থেকে।',
    titleLine2: 'আপনার দোরগোড়ায়।',
    subtitle: 'কৃষকদের সরাসরি ভোক্তা এবং প্রাতিষ্ঠানিক ক্রেতাদের সাথে যুক্তকারী স্বচ্ছ বাজার — ন্যায্য কৃষক আয়, তাজা ফসল এবং কোল্ড চেইন পরিবহন।',
    exploreBtn: 'তাজা ফসল দেখুন',
    sellBtn: 'ফসল বিক্রি করুন (ভয়েস AI)',
    calcBtn: 'মুনাফা হিসাব করুন',
    statFarmerRealization: '৭৬%',
    statFarmerRealizationLabel: 'কৃষকের প্রত্যক্ষ প্রাপ্তি',
  },
  farmerWizard: {
    title: 'কৃষক ফসল বিক্রয় সহায়ক',
    subtitle: '২২টি ভারতীয় ভাষায় ভয়েস AI দ্বারা ফসল তালিকাভুক্তকরণ',
    speakOrType: 'আপনার ভাষায় বলুন অথবা বিবরণ লিখুন',
    voiceListingGuide: 'বলুন: "৫ কুইন্টাল আলু প্রতি কেজি ২০ টাকা"',
    tapToSpeak: 'বলতে মাইক টিপুন',
    listening: 'আপনার কথা শুনছি...',
    confirmListing: 'ফসল বাজারে তালিকাভুক্ত করুন',
  },
  assistant: {
    floatingLabel: 'AI ভয়েস সহায়ক',
    title: 'এগ্রিডাইরেক্ট বহুভাষিক AI সহায়ক',
    statusOnline: 'সক্রিয় • ২২টি ভারতীয় ভাষা',
    welcomeMessage: 'নমস্কার! আমি আপনার এগ্রিডাইরেক্ট AI সহায়ক। বাজারদর, ফসল বিক্রি, কোল্ড চেইন বা এসক্রো নিরাপত্তা সম্পর্কে যেকোনো ভারতীয় ভাষায় আমাকে জিজ্ঞাসা করুন।',
    inputPlaceholder: 'প্রশ্ন জিজ্ঞাসা করুন বা মাইক টিপুন...',
    listeningFeedback: 'আপনার কথা শুনছি...',
    thinking: 'তথ্য বিশ্লেষণ করা হচ্ছে...',
    quickMandi: 'আজকের আলুর বাজারদর কত?',
    quickSell: 'ভয়েসের মাধ্যমে ফসল কীভাবে বিক্রি করবেন?',
    quickEscrow: 'এসক্রো আমার টাকা কীভাবে সুরক্ষিত রাখে?',
    quickLogistics: 'নিকটতম কোল্ড রিফার ট্রাক কোথায়?',
  },
});

// 2. Gujarati (ગુજરાતી)
export const gu: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'એગ્રીડાયરેક્ટ',
    marketplace: 'સીધું બજાર',
    sellHarvest: '+ પાક વેચો (વોઇસ AI)',
    coldLogistics: 'કોલ્ડ-ચેન પરિવહન',
    escrowLedger: 'સુરક્ષિત એસ્ક્રો ખાતું',
    aiForecast: 'AI માંગ આગાહી',
    b2bContracts: 'સંસ્થાકીય કરાર (B2B)',
    provenance: 'ખેતરથી ઘર સુધી ચકાસણી',
    mandiBenchmark: 'લાઈવ માર્કેટ યાર્ડ ભાવ',
    switchLanguage: 'ભાષા બદલો',
    searchLanguage: '૨૨ ભારતીય ભાષાઓમાં શોધો...',
    cart: 'ટોપલી',
    login: 'સાઇન ઇન',
    logout: 'સાઇન આઉટ',
  },
  hero: {
    badge: '૧,૨૪૮ ચકાસાયેલા ખેતરો જોડાયા · ૧૪,૮૯૦ ક્વિન્ટલ માલ મોકલાયો',
    titleLine1: 'સીધું ખેતરમાંથી.',
    titleLine2: 'તમારા ઘર સુધી.',
    subtitle: 'ખેડૂતોને સીધા ગ્રાહકો અને સંસ્થાઓ સાથે જોડતું પારદર્શક બજાર — વધુ ખેડૂત નફો, તાજો પાક અને સુરક્ષિત કોલ્ડ ચેઇન.',
    exploreBtn: 'તાજો પાક જુઓ',
    sellBtn: 'પાક વેચો (વોઇસ AI)',
    calcBtn: 'નફાની ગણતરી કરો',
    statFarmerRealization: '૭૬%',
    statFarmerRealizationLabel: 'સરેરાશ ખેડૂત હિસ્સો',
  },
  farmerWizard: {
    title: 'કિસાન પાક વેચાણ સહાયક',
    subtitle: '૨૨ સત્તાવાર ભારતીય ભાષાઓમાં વોઇસ AI દ્વારા પાકની નોંધણી',
    speakOrType: 'તમારી માતૃભાષામાં બોલો અથવા વિગતો લખો',
    voiceListingGuide: 'બોલો: "૫ મણ કપાસ ૬૫ રૂપિયા કિલો"',
    tapToSpeak: 'બોલવા માટે માઇક દબાવો',
    listening: 'તમારો અવાજ સાંભળી રહ્યા છીએ...',
    confirmListing: 'પાક બજારમાં મૂકો',
  },
  assistant: {
    floatingLabel: 'AI વોઇસ સહાયક',
    title: 'એગ્રીડાયરેક્ટ બહુભાષી AI સહાયક',
    statusOnline: 'સક્રિય • ૨૨ ભારતીય ભાષાઓ',
    welcomeMessage: 'નમસ્તે! હું તમારો એગ્રીડાયરેક્ટ AI સહાયક છું. માર્કેટ યાર્ડ ભાવ, પાક વેચાણ, કોલ્ડ ચેઇન વાહન કે એસ્ક્રો પેમેન્ટ વિશે ભારતીય ભાષાઓમાં મને પૂછો.',
    inputPlaceholder: 'પ્રશ્ન પૂછો અથવા માઇક દબાવો...',
    listeningFeedback: 'તમારો અવાજ સાંભળી રહ્યા છીએ...',
    thinking: 'માહિતી ચકાસી રહ્યા છીએ...',
    quickMandi: 'કપાસનો આજનો યાર્ડ ભાવ શું છે?',
    quickSell: 'બોલીને પાક કેવી રીતે વેચવો?',
    quickEscrow: 'એસ્ક્રો મારા નાણાં કેવી રીતે સુરક્ષિત રાખે છે?',
    quickLogistics: 'નજીકનું કોલ્ડ વાહન ક્યાં છે?',
  },
});

// 3. Punjabi (ਪੰਜਾਬੀ)
export const pa: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'ਐਗਰੀਡਾਇਰੈਕਟ',
    marketplace: 'ਸਿੱਧੀ ਮੰਡੀ',
    sellHarvest: '+ ਫ਼ਸਲ ਵੇਚੋ (ਆਵਾਜ਼ AI)',
    coldLogistics: 'ਕੋਲਡ-ਚੇਨ ਟਰਾਂਸਪੋਰਟ',
    escrowLedger: 'ਸੁਰੱਖਿਅਤ ਐਸਕਰੋ ਖਾਤਾ',
    aiForecast: 'AI ਮੰਗ ਭਵਿੱਖਬਾਣੀ',
    b2bContracts: 'ਸੰਸਥਾਗਤ ਇਕਰਾਰਨਾਮੇ (B2B)',
    provenance: 'ਖੇਤ ਤੋਂ ਥਾਲੀ ਤੱਕ ਪਾਰਦਰਸ਼ਤਾ',
    mandiBenchmark: 'ਲਾਈਵ ਮੰਡੀ ਸਰਕਾਰੀ ਭਾਅ',
    switchLanguage: 'ਭਾਸ਼ਾ ਬਦਲੋ',
    searchLanguage: '੨੨ ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਖੋਜੋ...',
    cart: 'ਟੋਕਰੀ',
    login: 'ਸਾਈਨ ਇਨ ਕਰੋ',
    logout: 'ਸਾਈਨ ਆਉਟ',
  },
  hero: {
    badge: '੧,੨੪੮ ਪ੍ਰਮਾਣਿਤ ਫਾਰਮ ਜੁੜੇ · ੧੪,੮੯੦ ਕੁਇੰਟਲ ਫ਼ਸਲ ਸਪਲਾਈ ਕੀਤੀ',
    titleLine1: 'ਸਿੱਧਾ ਖੇਤ ਵਿੱਚੋਂ।',
    titleLine2: 'ਤੁਹਾਡੇ ਦਰਵਾਜ਼ੇ ਤੱਕ।',
    subtitle: 'ਕਿਸਾਨਾਂ ਨੂੰ ਸਿੱਧਾ ਖਪਤਕਾਰਾਂ ਨਾਲ ਜੋੜਨ ਵਾਲੀ ਪਾਰਦਰਸ਼ੀ ਮੰਡੀ — ਵੱਧ ਕਿਸਾਨ ਕਮਾਈ, ਤਾਜ਼ੀ ਫ਼ਸਲ ਅਤੇ ਕੋਲਡ ਚੇਨ ਟਰਾਂਸਪੋਰਟ।',
    exploreBtn: 'ਤਾਜ਼ੀ ਫ਼ਸਲ ਦੇਖੋ',
    sellBtn: 'ਫ਼ਸਲ ਵੇਚੋ (ਆਵਾਜ਼ AI)',
    calcBtn: 'ਮੁਨਾਫ਼ਾ ਗਿਣੋ',
    statFarmerRealization: '੭੬%',
    statFarmerRealizationLabel: 'ਕਿਸਾਨ ਦੀ ਸਿੱਧੀ ਕਮਾਈ',
  },
  farmerWizard: {
    title: 'ਕਿਸਾਨ ਫ਼ਸਲ ਵੇਚਣ ਸਹਾਇਕ',
    subtitle: '੨੨ ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਆਵਾਜ਼ AI ਰਾਹੀਂ ਫ਼ਸਲ ਦਰਜ ਕਰੋ',
    speakOrType: 'ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਬੋਲੋ ਜਾਂ ਹੇਠਾਂ ਵੇਰਵਾ ਲਿਖੋ',
    voiceListingGuide: 'ਕਹੋ: "੨੦ ਕੁਇੰਟਲ ਬਾਸਮਤੀ ਝੋਨਾ ੩੫ ਰੁਪਏ ਕਿਲੋ"',
    tapToSpeak: 'ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ',
    listening: 'ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣ ਰਹੇ ਹਾਂ...',
    confirmListing: 'ਫ਼ਸਲ ਮੰਡੀ ਵਿੱਚ ਦਰਜ ਕਰੋ',
  },
  assistant: {
    floatingLabel: 'AI ਆਵਾਜ਼ ਸਹਾਇਕ',
    title: 'ਐਗਰੀਡਾਇਰੈਕਟ ਬਹੁਭਾਸ਼ਾਈ AI ਸਹਾਇਕ',
    statusOnline: 'ਚਾਲੂ ਹੈ • ੨੨ ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ',
    welcomeMessage: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਐਗਰੀਡਾਇਰੈਕਟ AI ਸਹਾਇਕ ਹਾਂ। ਮੰਡੀ ਭਾਅ, ਫ਼ਸਲ ਵੇਚਣ, ਕੋਲਡ ਟਰਾਂਸਪੋਰਟ ਜਾਂ ਐਸਕਰੋ ਸੁਰੱਖਿਆ ਬਾਰੇ ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ ਵਿੱਚ ਪੁੱਛੋ।',
    inputPlaceholder: 'ਸਵਾਲ ਪੁੱਛੋ ਜਾਂ ਮਾਈਕ ਦਬਾਓ...',
    listeningFeedback: 'ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣ ਰਹੇ ਹਾਂ...',
    thinking: 'ਜਾਣਕਾਰੀ ਲੱਭ ਰਹੇ ਹਾਂ...',
    quickMandi: 'ਬਾਸਮਤੀ ਦਾ ਅੱਜ ਦਾ ਮੰਡੀ ਭਾਅ ਕੀ ਹੈ?',
    quickSell: 'ਬੋਲ ਕੇ ਫ਼ਸਲ ਕਿਵੇਂ ਵੇਚੀਏ?',
    quickEscrow: 'ਐਸਕਰੋ ਮੇਰੇ ਪੈਸੇ ਕਿਵੇਂ ਸੁਰੱਖਿਅਤ ਰੱਖਦਾ ਹੈ?',
    quickLogistics: 'ਨੇੜਲਾ ਕੋਲਡ ਟਰੱਕ ਕਿੱਥੇ ਹੈ?',
  },
});

// 4. Malayalam (മലയാളം)
export const ml: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'അഗ്രിഡയറക്റ്റ്',
    marketplace: 'നേരിട്ടുള്ള വിപണി',
    sellHarvest: '+ വിള വിൽക്കുക (വോയ്സ് AI)',
    coldLogistics: 'കോൾഡ്-ചെയിൻ ഗതാഗതം',
    escrowLedger: 'സുരക്ഷിത എസ്‌ക്രോ അക്കൗണ്ട്',
    aiForecast: 'AI ഡിമാൻഡ് പ്രവചനം',
    mandiBenchmark: 'തത്സമയ വിപണി നിരക്ക്',
    switchLanguage: 'ഭാഷ മാറ്റുക',
    cart: 'കൊട്ട',
    login: 'ലോഗിൻ ചെയ്യുക',
    logout: 'പുറത്തുകടക്കുക',
  },
  hero: {
    badge: '1,248 കർഷകർ നേരിട്ട് ബന്ധപ്പെട്ടു · 14,890 ക്വിന്റൽ വിതരണം ചെയ്തു',
    titleLine1: 'തോട്ടത്തിൽ നിന്ന് നേരിട്ട്.',
    titleLine2: 'നിങ്ങളുടെ വീട്ടുപടിക്കൽ.',
    subtitle: 'കർഷകരെ ഉപഭോക്താക്കളുമായി നേരിട്ട് ബന്ധിപ്പിക്കുന്ന വിപണി — മികച്ച വരുമാനം, ഫ്രഷ് വിളകൾ, ശീതീകരിച്ച ഗതാഗതം.',
    exploreBtn: 'വിളകൾ കാണുക',
    sellBtn: 'വിള വിൽക്കുക (വോയ്സ് AI)',
    calcBtn: 'ലാഭം കണക്കാക്കുക',
    statFarmerRealization: '76%',
    statFarmerRealizationLabel: 'കർഷകന് നേരിട്ടുള്ള വരുമാനം',
  },
  farmerWizard: {
    title: 'കർഷക വിള വിൽപന സഹായി',
    subtitle: '22 ഇന്ത്യൻ ഭാഷകളിൽ വോയ്‌സ് AI വഴി വിള ലിസ്റ്റ് ചെയ്യാം',
    speakOrType: 'സംസാരിക്കുകയോ വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യുക',
    voiceListingGuide: 'പറയുക: "100 കിലോ നാടൻ കുരുമുളക് കിലോയ്ക്ക് 500 രൂപ"',
    tapToSpeak: 'സംസാരിക്കാൻ മൈക്ക് അമർത്തുക',
    listening: 'ശ്രദ്ധിക്കുന്നു...',
    confirmListing: 'വിള ലിസ്റ്റ് ചെയ്യുക',
  },
  assistant: {
    floatingLabel: 'AI വോയ്സ് സഹായി',
    title: 'അഗ്രിഡയറക്റ്റ് ബഹുഭാഷാ AI സഹായി',
    statusOnline: 'ഓൺലൈൻ • 22 ഇന്ത്യൻ ഭാഷകൾ',
    welcomeMessage: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ അഗ്രിഡയറക്റ്റ് AI സഹായിയാണ്. മാർക്കറ്റ് നിരക്കുകൾ, വിള വിൽപന, കോൾഡ് ട്രാൻസ്പോർട്ട് എന്നിവയെക്കുറിച്ച് എന്നോട് ചോദിക്കാം.',
    inputPlaceholder: 'ചോദ്യം ചോദിക്കുക അല്ലെങ്കിൽ മൈക്ക് അമർത്തുക...',
    listeningFeedback: 'ശ്രദ്ധിക്കുന്നു...',
    thinking: 'വിവരങ്ങൾ പരിശോധിക്കുന്നു...',
    quickMandi: 'ഇന്നത്തെ കുരുമുളക് വിപണി വില എത്രയാണ്?',
    quickSell: 'ശബ്ദം ഉപയോഗിച്ച് വിള എങ്ങനെ വിൽക്കാം?',
    quickEscrow: 'എസ്‌ക്രോ എന്റെ പണം എങ്ങനെ സുരക്ഷിതമാക്കുന്നു?',
    quickLogistics: 'അടുത്തുള്ള കോൾഡ് ട്രക്ക് എവിടെയാണ്?',
  },
});

// 5. Odia (ଓଡ଼ିଆ)
export const or: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'ଅଗ୍ରିଡାଇରେକ୍ଟ',
    marketplace: 'ପ୍ରତ୍ୟକ୍ଷ ବଜାର',
    sellHarvest: '+ ଫସଲ ବିକ୍ରି (ଭଏସ AI)',
    coldLogistics: 'ଶୀତଳ ଶୃଙ୍ଖଳା ପରିବହନ',
    escrowLedger: 'ସୁରକ୍ଷିତ ଏସ୍କ୍ରୋ ଖାତା',
    mandiBenchmark: 'ଲାଇଭ୍ ମଣ୍ଡି ଦର',
    switchLanguage: 'ଭାଷା ବଦଳାନ୍ତୁ',
    cart: 'ଟୋକେଇ',
    login: 'ଲଗ୍ ଇନ୍',
    logout: 'ଲଗ୍ ଆଉଟ୍',
  },
  hero: {
    badge: '୧,୨୪୮ ଯାଞ୍ଚ ହୋଇଥିବା ଚାଷୀ ଯୋଡିହେଲେ · ୧୪,୮୯୦ କ୍ୱିଣ୍ଟାଲ ବିତରଣ',
    titleLine1: 'ସିଧାସଳଖ ଚାଷଜମିରୁ।',
    titleLine2: 'ଆପଣଙ୍କ ଘର ପର୍ଯ୍ୟନ୍ତ।',
    subtitle: 'ଚାଷୀ ଓ ଖାଉଟିଙ୍କୁ ସିଧାସଳଖ ଯୋଡୁଥିବା ସ୍ୱଚ୍ଛ ବଜାର — ଉଚିତ ମୂଲ୍ୟ, ତାଜା ପନିପରିବା ଓ ଶୀତଳୀକରଣ ପରିବହନ।',
    exploreBtn: 'ତାଜା ଫସଲ ଦେଖନ୍ତୁ',
    sellBtn: 'ଫସଲ ବିକ୍ରି (ଭଏସ AI)',
    calcBtn: 'ଲାଭ ଗଣନା କରନ୍ତୁ',
  },
  farmerWizard: {
    title: 'କୃଷକ ଫସଲ ବିକ୍ରୟ ସହାୟକ',
    subtitle: '୨୨ଟି ଭାରତୀୟ ଭାଷାରେ ଭଏସ୍ AI ଦ୍ୱାରା ଫସଲ ପଞ୍ଜୀକରଣ',
    speakOrType: 'କଥା କୁହନ୍ତୁ କିମ୍ବା ତଳେ ତଥ୍ୟ ଲେଖନ୍ତୁ',
    voiceListingGuide: 'କୁହନ୍ତୁ: "୫ କ୍ୱିଣ୍ଟାଲ ଧାନ କିଲୋ ₹୨୨"',
    tapToSpeak: 'କହିବା ପାଇଁ ମାଇକ୍ ଦବାନ୍ତୁ',
    listening: 'ଆପଣଙ୍କ କଥା ଶୁଣୁଛୁ...',
    confirmListing: 'ଫସଲ ବଜାରରେ ତାଲିକାଭୁକ୍ତ କରନ୍ତୁ',
  },
  assistant: {
    floatingLabel: 'AI ଭଏସ୍ ସହାୟକ',
    title: 'ଅଗ୍ରିଡାଇରେକ୍ଟ ବହୁଭାଷୀ AI ସହାୟକ',
    statusOnline: 'ସକ୍ରିୟ • ୨୨ ଭାରତୀୟ ଭାଷା',
    welcomeMessage: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ଅଗ୍ରିଡାଇରେକ୍ଟ AI ସହାୟକ। ମଣ୍ଡି ଦର, ଫସଲ ବିକ୍ରି, ଶୀତଳ ପରିବହନ ବାବଦରେ ମୋତେ ପଚାରନ୍ତୁ।',
    inputPlaceholder: 'ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ କିମ୍ବା ମାଇକ୍ ଦବାନ୍ତୁ...',
    listeningFeedback: 'ଆପଣଙ୍କ କଥା ଶୁଣୁଛୁ...',
    thinking: 'ତଥ୍ୟ ଯାଞ୍ଚ କରୁଛୁ...',
    quickMandi: 'ଆଜିର ଧାନ ମଣ୍ଡି ଦର କେତେ?',
    quickSell: 'ଭଏସ୍ ମାଧ୍ୟମରେ ଫସଲ କିପରି ବିକ୍ରି କରିବେ?',
    quickEscrow: 'ଏସ୍କ୍ରୋ ମୋର ଟଙ୍କା କିପରି ସୁରକ୍ଷିତ ରଖେ?',
    quickLogistics: 'ନିକଟସ୍ଥ ଶୀତଳ ଗାଡ଼ି କେଉଁଠି ଅଛି?',
  },
});

// 6. Assamese (অসমীয়া)
export const as: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'এগ্ৰিডাইৰেক্ট',
    marketplace: 'পোনপটীয়া বজাৰ',
    sellHarvest: '+ শস্য বিক্ৰী (ভইচ AI)',
    coldLogistics: 'শীতল শৃংখল পৰিবহন',
    escrowLedger: 'সুৰক্ষিত এছক্ৰো একাউণ্ট',
    mandiBenchmark: 'লাইভ মাণ্ডি দৰ',
    switchLanguage: 'ভাষা সলনি কৰক',
    cart: 'টোপোলা',
    login: 'লগ ইন',
    logout: 'লগ আউট',
  },
  hero: {
    badge: '১,২৪৮ সত্যায়িত কৃষক সংযুক্ত · ১৪,৮৯০ কুইন্টল বিতৰণ',
    titleLine1: 'পোনপটীয়াকৈ পথাৰৰ পৰা।',
    titleLine2: 'আপোনাৰ দুৱাৰমুখলৈ।',
    subtitle: 'কৃষক আৰু উপভোক্তাক পোনপটীয়াকৈ সংযোগ কৰা স্বচ্ছ বজাৰ — কৃষকৰ উচিত লাভ আৰু শীতলীকৃত পৰিবহন।',
    exploreBtn: 'তাজা শস্য চাওক',
    sellBtn: 'শস্য বিক্ৰী (ভইচ AI)',
    calcBtn: 'লাভ গণনা কৰক',
  },
  farmerWizard: {
    title: 'কৃষক শস্য বিক্ৰী সহায়ক',
    subtitle: '২২টা চৰকাৰী ভাষাত ভইচ AI ৰে শস্যৰ তালিকাভুক্তকৰণ',
    speakOrType: 'কথা কওক বা তলত তথ্য লিখক',
    voiceListingGuide: 'কওক: "৫ কুইন্টাল তেজপুৰীয়া আদা প্ৰতি কেজি ৫০ টকা"',
    tapToSpeak: 'কবলৈ মাইক টিপক',
    listening: 'আপোনাৰ কথা শুনি আছো...',
    confirmListing: 'শস্য বজাৰত তালিকাভুক্ত কৰক',
  },
  assistant: {
    floatingLabel: 'AI ভইচ সহায়ক',
    title: 'এগ্ৰিডাইৰেক্ট বহুভাষিক AI সহায়ক',
    statusOnline: 'সক্ৰিয় • ২২টা ভাৰতীয় ভাষা',
    welcomeMessage: 'নমস্কাৰ! মই আপোনাৰ এগ্ৰিডাইৰেক্ট AI সহায়ক। বজাৰ দৰ, শস্য বিক্ৰী, শীতল পৰিবহন বা এছক্ৰো সুৰক্ষাৰ বিষয়ে মোক সোধক।',
    inputPlaceholder: 'প্ৰশ্ন সোধক বা মাইক টিপক...',
    listeningFeedback: 'শুনি আছো...',
    thinking: 'তথ্য পৰীক্ষা কৰি থকা হৈছে...',
    quickMandi: 'আজিৰ আদাৰ মাণ্ডি দৰ কিমান?',
    quickSell: 'ভইচ ব্যৱহাৰ কৰি শস্য কেনেকৈ বিক্ৰী কৰিব?',
    quickEscrow: 'এছক্ৰোৱে মোৰ ধন কেনেকৈ সুৰক্ষিত কৰে?',
    quickLogistics: 'ওচৰৰ শীতল বাহন ক’ত আছে?',
  },
});

// 7. Nepali (नेपाली)
export const ne: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'एग्रीडाइरेक्ट',
    marketplace: 'प्रत्यक्ष बजार',
    sellHarvest: '+ बाली बेच्नुहोस् (आवाज AI)',
    coldLogistics: 'कोल्ड-चेन ढुवानी',
    escrowLedger: 'सुरक्षित एस्क्रो खाता',
    mandiBenchmark: 'प्रत्यक्ष बजार दर',
    switchLanguage: 'भाषा परिवर्तन गर्नुहोस्',
    cart: 'झोला',
    login: 'साइन इन',
    logout: 'साइन आउट',
  },
  hero: {
    badge: '१,२४८ प्रमाणित किसानहरू जोडिए · १४,८९० क्विन्टल ढुवानी',
    titleLine1: 'सिधै खेतबाट।',
    titleLine2: 'तपाईंको घरदैलोमा।',
    subtitle: 'किसान र उपभोक्तालाई सिधै जोड्ने पारदर्शी बजार — किसानलाई उचित मूल्य र सुरक्षित ढुवानी।',
    exploreBtn: 'ताजा बाली हेर्नुहोस्',
    sellBtn: 'बाली बेच्नुहोस् (आवाज AI)',
    calcBtn: 'नाफा गणना गर्नुहोस्',
  },
  farmerWizard: {
    title: 'किसान बाली बिक्री सहायक',
    subtitle: '२२ भारतीय भाषाहरूमा भ्वाइस AI द्वारा बाली दर्ता',
    speakOrType: 'आफ्नो भाषामा बोल्नुहोस् वा विवरण लेख्नुहोस्',
    voiceListingGuide: 'भन्नुहोस्: "१० बोरा अलैँची प्रति किलो ₹८००"',
    tapToSpeak: 'बोल्नको लागि माइक थिच्नुहोस्',
    listening: 'तपाईंको आवाज सुन्दैछौँ...',
    confirmListing: 'बाली सूचीकृत गर्नुहोस्',
  },
  assistant: {
    floatingLabel: 'AI भ्वाइस सहायक',
    title: 'एग्रीडाइरेक्ट बहुभाषी AI सहायक',
    statusOnline: 'सक्रिय • २२ भाषाहरू',
    welcomeMessage: 'नमस्ते! म तपाईंको एग्रीडाइरेक्ट AI सहायक हुँ। बजार भाउ, बाली बिक्री, ढुवानी वा भुक्तानी सुरक्षाको बारेमा मलाई सोध्नुहोस्।',
    inputPlaceholder: 'प्रश्न सोध्नुहोस् वा माइक थिच्नुहोस्...',
    listeningFeedback: 'सुन्दैछौँ...',
    thinking: 'जानकारी खोज्दैछौँ...',
    quickMandi: 'आजको बजार भाउ कति छ?',
    quickSell: 'आवाजबाट बाली कसरी बेच्ने?',
    quickEscrow: 'एस्क्रोले मेरो भुक्तानी कसरी सुरक्षित गर्छ?',
    quickLogistics: 'नजिकैको कोल्ड ट्रक कहाँ छ?',
  },
});

// 8. Konkani (कोंकणी)
export const kok: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'ॲग्रीडायरेक्ट',
    marketplace: 'थेट बाज़ार',
    sellHarvest: '+ पीक विकात (व्हॉईस AI)',
    coldLogistics: 'शीत-शृंखला वाहतूक',
    mandiBenchmark: 'थेट बाज़ार दर',
    switchLanguage: 'भास बदलात',
    cart: 'बुट्टी',
    login: 'लॉग इन',
    logout: 'लॉग आउट',
  },
  hero: {
    badge: '१,२४८ नोंदणीकृत शेतकरी · १४,८९० क्विंटल शेतमाल वितरित',
    titleLine1: 'थेट शेतांतल्यान।',
    titleLine2: 'तुमच्या दारांत।',
    subtitle: 'शेतकऱ्यांक थेट गिरायकां कडेन जोडपी पारदर्शक बाज़ारपेठ।',
    exploreBtn: 'ताजे पीक पळयात',
    sellBtn: 'पीक विकात (व्हॉईस AI)',
    calcBtn: 'नफा मेजा',
  },
  farmerWizard: {
    title: 'शेतकरी पीक विक्री सहाय्यक',
    subtitle: '२२ भारतीय भासांनी व्हॉईस AI वरवीं पीक नोंदणी',
    speakOrType: 'उलय किंवा माहिती बरोवचात',
    voiceListingGuide: 'अशें सांगात: "५०० नारळ २५ रुपयांक एक"',
    tapToSpeak: 'उलोवपाक माइक दाबा',
    listening: 'तुमचो आवाज आयकतात...',
    confirmListing: 'पीक बाजारांत नोंद करात',
  },
  assistant: {
    floatingLabel: 'AI व्हॉईस सहाय्यक',
    title: 'ॲग्रीडायरेक्ट बहुभाषिक AI सहाय्यक',
    statusOnline: 'सक्रिय • २२ भारतीय भासो',
    welcomeMessage: 'देव बरे करूं! हांव तुमचो ॲग्रीडायरेक्ट AI सहाय्यक. बाजारभाव, पीक विक्री, शीत वाहतूक वा पैशांचे सुरक्षेविशीं म्हाका विचारात.',
    inputPlaceholder: 'विचार करात वा माइक दाबा...',
    listeningFeedback: 'आयकतात...',
    thinking: 'माहिती सोदतात...',
    quickMandi: 'नारळाचो आजचो बाजारभाव कितें आसा?',
    quickSell: 'आवाजान पीक कशें विकचें?',
    quickEscrow: 'एस्क्रो म्हजे पैसे कशे सांबाळटा?',
    quickLogistics: 'लागसारचें शीत वाहन खंय आसा?',
  },
});

// 9. Sindhi (سنڌي - RTL)
export const sd: TranslationSchema = {
  ...ur,
  nav: {
    ...ur.nav,
    brand: 'ايگري ڊائريڪٽ',
    marketplace: 'سڌي منڊي',
    sellHarvest: '+ فصل وڪرو ڪريو (وائس AI)',
    coldLogistics: 'ڪولڊ چين ٽرانسپورٽ',
    escrowLedger: 'محفوظ ايسڪرو کاتو',
    mandiBenchmark: 'مارڪيٽ اسپاٽ اگهہ',
    switchLanguage: 'ٻولي مٽايو',
    cart: 'ٽوڪري',
  },
  hero: {
    ...ur.hero,
    titleLine1: 'سڌو سنئون ٻنيءَ مان۔',
    titleLine2: 'اوهان جي چؤڪٺ تائين۔',
    subtitle: 'هارين کي سڌو گراهڪن سان ڳنڍيندڙ منڊي — مناسب اگهہ، تازو فصل ۽ اي آءِ ڪولڊ چين۔',
    exploreBtn: 'تازو فصل ڏسو',
    sellBtn: 'فصل وڪرو ڪريو (وائس AI)',
  },
  farmerWizard: {
    ...ur.farmerWizard,
    title: 'هاري فصل وڪرو سهولتڪار',
    voiceListingGuide: 'چئو: "ڏھ ڪوئينٽل ڪڻڪ چاليهہ رپيا ڪلو"',
  },
  assistant: {
    ...ur.assistant,
    title: 'ايگري ڊائريڪٽ سنڌي AI مددگار',
    welcomeMessage: 'ڀلي ڪري آيا! مان اوهان جو ايگري ڊائريڪٽ AI مددگار آهيان. منڊي جي اگهن، فصل وڪري يا ايسڪرو بابت مون کان پڇو.',
  },
};

// 10. Kashmiri (کٲشُر - RTL)
export const ks: TranslationSchema = {
  ...ur,
  nav: {
    ...ur.nav,
    brand: 'ایگری ڈائریکٹ',
    marketplace: 'سیدھی منڈی',
    sellHarvest: '+ فصل کٕنِو (آواز AI)',
    mandiBenchmark: 'تازہ منڈی ریٹ',
    switchLanguage: 'زَبان بَدلٲوِو',
  },
  hero: {
    ...ur.hero,
    titleLine1: 'سیدھی کؠتہٕ پؠٹھہٕ۔',
    titleLine2: 'تُہندِس دروازس تام۔',
    exploreBtn: 'تازٕ مؠوٕ وُچھِو',
    sellBtn: 'فصل کٕنِو (آواز AI)',
  },
  farmerWizard: {
    ...ur.farmerWizard,
    title: 'کِسان فصل کَنَن مَدَتگار',
    voiceListingGuide: 'وَنِو: "پانژ دَبہٕ کۄنگ زعفران"',
  },
  assistant: {
    ...ur.assistant,
    title: 'ایگری ڈائریکٹ کاشُر AI مددگار',
    welcomeMessage: 'سلام! بہٕ چُھس تُہُند ایگری ڈائریکٹ AI مددگار۔ منڈی ریٹ، فصل کَنُن یا لاجسٹکس مُتعلِق پُژھِو۔',
  },
};

// 11. Maithili (मैथिली)
export const mai: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'एग्रीडायरेक्ट',
    marketplace: 'प्रत्यक्ष बाजार',
    sellHarvest: '+ फसल बेचू (आवाज AI)',
    coldLogistics: 'शीत-शृंखला ढुलाई',
    mandiBenchmark: 'लाइव मंडी दर',
    switchLanguage: 'भाषा बदलू',
  },
  hero: {
    badge: '१,२४८ सत्यापित किसान जुड़ल · १४,८९० क्विंटल अनाज आपूर्ति',
    titleLine1: 'सोझे खेत सं।',
    titleLine2: 'अहाँक दुआरी धरि।',
    subtitle: 'किसान आ ग्राहकक सोझे जोड़य बला पारदर्शी मंच।',
    exploreBtn: 'ताजा उपज देखू',
    sellBtn: 'फसल बेचू (आवाज AI)',
  },
  farmerWizard: {
    title: 'किसान फसल बिक्री सहायक',
    subtitle: '२२ भारतीय भाषा मे आवाज AI द्वारा फसलक पंजीयन',
    voiceListingGuide: 'कहूं: "१० क्विंटल मखाना ₹४५० प्रति किलो"',
    confirmListing: 'फसल बजार मे सूचीकृत करू',
  },
  assistant: {
    floatingLabel: 'AI आवाज सहायक',
    title: 'एग्रीडायरेक्ट मैथिली AI सहायक',
    statusOnline: 'सक्रिय • २२ भारतीय भाषा',
    welcomeMessage: 'प्रणाम! हम अहाँक एग्रीडायरेक्ट AI सहायक छी। मंडी भाव, फसल बिक्री, शीत ढुलाई वा एस्क्रो सुरक्षामे हमरा सं पूछू।',
    quickMandi: 'आइ मखाना केर मंडी भाव की अछि?',
    quickSell: 'आवाज सं फसल कोना बेची?',
  },
});

// 12. Sanskrit (संस्कृतम्)
export const sa: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'एग्रीडायरेक्ट',
    marketplace: 'प्रत्यक्ष आपणम्',
    sellHarvest: '+ सस्यविक्रयः (वाक् AI)',
    coldLogistics: 'शीत-शृङ्खला प्रवहणम्',
    escrowLedger: 'सुरक्षित निक्षेपकोशः',
    mandiBenchmark: 'प्रत्यक्ष विपणिमूल्यम्',
    switchLanguage: 'भाषां परिवर्तयतु',
  },
  hero: {
    badge: '१,२४८ प्रमाणीकृत कृषिक्षेत्राणि · १४,८९० क्विण्टल परिमितं सस्यं प्रेषितम्',
    titleLine1: 'साक्षात् क्षेत्रात्।',
    titleLine2: 'भवतः द्वारपर्यन्तम्।',
    subtitle: 'कृषकाणां ग्राहकाणां च साक्षात् सम्बन्धनार्थं पारदर्शिनी विपणिः।',
    exploreBtn: 'सद्यः सस्यं पश्यतु',
    sellBtn: 'सस्यं विक्रयतु (वाक् AI)',
  },
  farmerWizard: {
    title: 'कृषक सस्यविक्रय सहायकः',
    subtitle: '२२ भारतीयभाषासु वाक् AI द्वारा सस्यसूचीकरणम्',
    voiceListingGuide: 'वदतु: "दश क्विण्टल परिमितं धान्यं द्वाविंशति रूप्यकाणि प्रतिकिलो"',
    confirmListing: 'सस्यसूचीकरणं दृढीकरोतु',
  },
  assistant: {
    floatingLabel: 'AI वाक् सहायकः',
    title: 'एग्रीडायरेक्ट संस्कृत AI सहायकः',
    statusOnline: 'सक्रियः • २२ भारतीयभाषाः',
    welcomeMessage: 'नमो नमः! अहं भवतः एग्रीडायरेक्ट AI सहायकः अस्मि। विपणिमूल्यम्, सस्यविक्रयः, शीतप्रवहणं वा निक्षेपसुरक्षाविषये मां पृच्छतु।',
    quickMandi: 'अद्य धान्यस्य विपणिमूल्यं किम्?',
    quickSell: 'वाण्या सस्यविक्रयः कथं क्रियते?',
  },
});

// 13. Santali (ᱥᱟᱱᱛᱟᱲᱤ)
export const sat: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'AgriDirect',
    marketplace: 'ᱥᱚᱡᱷᱮ ᱦᱟᱴ',
    sellHarvest: '+ ᱯᱷᱚᱥᱚᱞ ᱟᱹᱠᱷᱨᱤᱧ (ᱨᱟᱦᱟ AI)',
    coldLogistics: 'ᱨᱮᱭᱟᱲ ᱜᱟᱹᱰᱤ ᱥᱮᱱᱚᱜ',
    escrowLedger: 'ᱨᱩᱠᱷᱤᱭᱟᱹ ᱮᱥᱠᱨᱳ',
    mandiBenchmark: 'ᱦᱟᱴ ᱨᱮᱱᱟᱜ ᱵᱷᱟᱣ',
    switchLanguage: 'ᱯᱟᱹᱨᱥᱤ ᱵᱚᱫᱚᱞ',
  },
  hero: {
    badge: '᱑,᱒᱔᱘ ᱪᱟᱹᱥᱤ ᱠᱚ ᱡᱚᱲᱟᱣ ᱮᱱᱟ · ᱑᱔,᱘᱙᱐ ᱠᱣᱤᱱᱴᱟᱞ ᱥᱟᱢᱟᱱ ᱪᱟᱞᱟᱣ ᱮᱱᱟ',
    titleLine1: 'ᱥᱚᱡᱷᱮ ᱵᱟᱹᱫᱽ ᱠᱷᱚᱱ᱾',
    titleLine2: 'ᱟᱢᱟᱜ ᱫᱩᱣᱟᱹᱨ ᱫᱷᱟᱹᱵᱤᱡ᱾',
    subtitle: 'ᱪᱟᱹᱥᱤ ᱟᱨ ᱠᱤᱨᱤᱧᱤᱭᱟᱹ ᱥᱚᱡᱷᱮ ᱡᱚᱲᱟᱣ ᱞᱟᱹᱜᱤᱫ ᱦᱟᱴ।',
    exploreBtn: 'ᱱᱟᱣᱟ ᱯᱷᱚᱥᱚᱞ ᱧᱮᱞ',
    sellBtn: 'ᱯᱷᱚᱥᱚᱞ ᱟᱹᱠᱷᱨᱤᱧ',
  },
  farmerWizard: {
    title: 'ᱪᱟᱹᱥᱤ ᱯᱷᱚᱥᱚᱞ ᱟᱹᱠᱷᱨᱤᱧ ᱜᱚᱲᱚ',
    subtitle: '᱒᱒ ᱜᱚᱴᱟᱝ ᱯᱟᱹᱨᱥᱤ ᱛᱮ ᱨᱟᱦᱟ AI ᱥᱟᱶ ᱯᱷᱚᱥᱚᱞ ᱛᱟᱹᱞᱠᱟᱹ',
    voiceListingGuide: 'ᱢᱮᱱ ᱢᱮ: "᱕ ᱠᱣᱤᱱᱴᱟᱞ ᱦᱳᱲᱳ ᱒᱒ ᱴᱟᱠᱟ ᱠᱤᱞᱳ"',
    confirmListing: 'ᱯᱷᱚᱥᱚᱞ ᱦᱟᱴ ᱨᱮ ᱥᱮᱞᱮᱫᱽ',
  },
  assistant: {
    floatingLabel: 'AI ᱨᱟᱦᱟ ᱜᱚᱲᱚ',
    title: 'AgriDirect ᱟᱭᱢᱟ ᱯᱟᱹᱨᱥᱤ AI ᱜᱚᱲᱚ',
    statusOnline: 'ᱥᱟᱹᱛ ᱢᱮᱱᱟᱜ-ᱟ • ᱒᱒ ᱯᱟᱹᱨᱥᱤ',
    welcomeMessage: 'ᱡᱚᱦᱟᱨ! ᱤᱧ ᱫᱚ AgriDirect AI ᱜᱚᱲᱚᱭᱤᱡ ᱠᱟᱹᱱᱟᱹᱧ। ᱦᱟᱴ ᱫᱟᱢ, ᱯᱷᱚᱥᱚᱞ ᱟᱹᱠᱷᱨᱤᱧ ᱟᱨ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱟᱠᱟ ᱵᱟᱵᱚᱛ ᱠᱩᱞᱤᱧ ᱢᱮ।',
    quickMandi: 'ᱛᱮᱦᱮᱧ ᱦᱳᱲᱳ ᱨᱮᱱᱟᱜ ᱫᱟᱢ ᱛᱤᱱᱟᱹᱜ?',
    quickSell: 'ᱨᱚᱲ ᱠᱟᱛᱮ ᱯᱷᱚᱥᱚᱞ ᱪᱮᱫ ᱞᱮᱠᱟᱛᱮ ᱟᱹᱠᱷᱨᱤᱧᱟ?',
  },
});

// 14. Dogri (डोगरी)
export const doi: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'एग्रीडायरेक्ट',
    marketplace: 'सीधी मंडी',
    sellHarvest: '+ फसल बेचो (आवाज AI)',
    mandiBenchmark: 'मंडी दर',
    switchLanguage: 'भाशा बदलो',
  },
  hero: {
    badge: '१,२४८ किसान जुड़े · १४,८९० क्विंटल फसल दी सप्लाई',
    titleLine1: 'सिद्दा खेत थमा।',
    titleLine2: 'तुंदे बूहे तगर।',
    exploreBtn: 'ताजी फसल दिक्खो',
    sellBtn: 'फसल बेचो (आवाज AI)',
  },
  farmerWizard: {
    title: 'किसान फसल बिक्री सहायक',
    subtitle: '२२ भारतीय भाशां च आवाज AI कन्नै फसल दी लिस्टिंग',
    voiceListingGuide: 'आक्खो: "१० क्विंटल बासमती चावल"',
    confirmListing: 'फसल मंडी च दर्ज करो',
  },
  assistant: {
    floatingLabel: 'AI आवाज सहायक',
    title: 'एग्रीडायरेक्ट डोगरी AI सहायक',
    statusOnline: 'सक्रिय • २२ भाशां',
    welcomeMessage: 'नमस्ते! मैं तुंदा एग्रीडायरेक्ट AI सहायक आं। मंडी दे भाव, फसल बिक्री जां कोल्ड ट्रांसपोर्ट बारे पुच्छो।',
    quickMandi: 'टमाटर दा अज्ज दा मंडी भाव केह ऐ?',
    quickSell: 'बोली यै फसल किश चाल्ली बेचनी?',
  },
});

// 15. Manipuri (মৈতৈলোন্)
export const mni: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'AgriDirect',
    marketplace: 'খুন্নাই কৈথেল',
    sellHarvest: '+ পোল্লোই য়োনবা (খোঞ্জেল AI)',
    mandiBenchmark: 'কৈথেলগী মমল',
    switchLanguage: 'লোন হোংদোকপা',
  },
  hero: {
    badge: 'লৌউ-শিংউবা ১,২৪৮ শম্নরে · কুইন্টাল ১৪,৮৯০ য়ৌহনখ্রে',
    titleLine1: 'লৌবুকতগী হকথেংননা।',
    titleLine2: 'নহাক্কী থোঙগালদা।',
    exploreBtn: 'অনৌবা পোত্থোক য়েংবা',
    sellBtn: 'পোত্থোক য়োনবা (খোঞ্জেল AI)',
  },
  farmerWizard: {
    title: 'লৌউবগী পোত্থোক য়োনবগী মতেংপাংবা',
    subtitle: 'লোন ২২দা খোঞ্জেল AI শীজিন্নদুনা পোত্থোক মিং চনবা',
    voiceListingGuide: 'হায়বিয়ু: "চাক-হাও চেং ৫০ কিলো"',
    confirmListing: 'কৈথেলদা পোত্থোক মিং চনবা',
  },
  assistant: {
    floatingLabel: 'AI খোঞ্জেল মতেং',
    title: 'AgriDirect মৈতৈলোন্ AI মতেংপাংবা',
    statusOnline: 'সক্রিয় • লোন ২২',
    welcomeMessage: 'খুরুমজরি! ঐহাক AgriDirect AI মতেংপাংবনি। কৈথেলগী মমল, পোত্থোক য়োনবা অমসুং শেলগী চেকশিন থৌরাংগী মতাংদা হংবিয়ু।',
    quickMandi: 'ঙসিগী চাক-হাও মমল কতেনি?',
    quickSell: 'খোঞ্জেলনা পোত্থোক কমদৌনা য়োনবা?',
  },
});

// 16. Bodo (बड़ो)
export const brx: TranslationSchema = createLocalizedBundle({
  nav: {
    brand: 'AgriDirect',
    marketplace: 'गोखो हाट',
    sellHarvest: '+ फसल फाननाय (राव AI)',
    mandiBenchmark: 'हाट बेसेन',
    switchLanguage: 'राव सोलाय',
  },
  hero: {
    titleLine1: 'थिं फारि हाब्रुनिफ्राय।',
    titleLine2: 'नोंथांनि दरजासिम।',
    exploreBtn: 'गोदान फसल नाय',
    sellBtn: 'फसल फाननाय (राव AI)',
  },
  farmerWizard: {
    title: 'आबादारि फसल फाननाय हेफाजात',
    voiceListingGuide: 'बुं: "५ कुइन्टल माइ किलोआव २० रां"',
    confirmListing: 'हाटाव फसलनि फारिलाइ खालाम',
  },
  assistant: {
    floatingLabel: 'AI राव हेफाजात',
    title: 'AgriDirect बड़ो AI हेफाजात',
    statusOnline: 'सक्रिय • राव २२',
    welcomeMessage: 'खुलुमबाय! आं नोंथांनि AgriDirect AI हेफाजातगिरि। हाट बेसेन, फसल फाननाय आरो रैखा एस्क्रो समबन्दै सों।',
    quickMandi: 'दिनैनि माइ हाट बेसेना मा?',
    quickSell: 'रावजों फसल बोरै फाननो?',
  },
});
