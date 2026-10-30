import type { Language } from '@/i18n/strings';
import { colors } from '@/theme';

export type Localized = Record<Language, string>;

export type ArchetypeId = 'warrior' | 'mage' | 'explorer' | 'detective' | 'sailor' | 'inventor';

export type MCIcon = 'sword' | 'magic-staff' | 'compass-outline' | 'eye-outline' | 'anchor' | 'cog-outline' | 'waves' | 'leaf' | 'crown' | 'city-variant' | 'pyramid' | 'orbit' | 'ghost-outline' | 'fish';

export const ARCHETYPES: { id: ArchetypeId; name: Localized; blurb: Localized; color: string; icon: MCIcon }[] = [
  { id: 'warrior', icon: 'sword', name: { en: 'Warrior', ar: 'محارب' }, blurb: { en: 'Steel and courage', ar: 'فولاذ وشجاعة' }, color: colors.fire },
  { id: 'mage', icon: 'magic-staff', name: { en: 'Mage', ar: 'ساحر' }, blurb: { en: 'Arcane mastery', ar: 'إتقان السحر' }, color: colors.purple },
  { id: 'explorer', icon: 'compass-outline', name: { en: 'Explorer', ar: 'مستكشف' }, blurb: { en: 'Maps the unknown', ar: 'يرسم المجهول' }, color: colors.success },
  { id: 'detective', icon: 'eye-outline', name: { en: 'Detective', ar: 'محقق' }, blurb: { en: 'Sees what others miss', ar: 'يرى ما لا يراه غيره' }, color: colors.gold },
  { id: 'sailor', icon: 'anchor', name: { en: 'Sailor', ar: 'بحّار' }, blurb: { en: 'Reads the tides', ar: 'يقرأ المد والجزر' }, color: colors.blue },
  { id: 'inventor', icon: 'cog-outline', name: { en: 'Inventor', ar: 'مخترع' }, blurb: { en: 'Builds the impossible', ar: 'يصنع المستحيل' }, color: '#E26BD6' },
];

export const PERSONALITIES: { id: string; name: Localized }[] = [
  { id: 'brave', name: { en: 'Brave', ar: 'شجاع' } },
  { id: 'clever', name: { en: 'Clever', ar: 'ذكي' } },
  { id: 'kind', name: { en: 'Kind', ar: 'طيب القلب' } },
  { id: 'witty', name: { en: 'Witty', ar: 'سريع البديهة' } },
  { id: 'mysterious', name: { en: 'Mysterious', ar: 'غامض' } },
  { id: 'stubborn', name: { en: 'Stubborn', ar: 'عنيد' } },
];

export type WorldId =
  | 'lost-island'
  | 'enchanted-forest'
  | 'ancient-kingdom'
  | 'cyberpunk-city'
  | 'desert-secrets'
  | 'space-frontier'
  | 'haunted-mansion'
  | 'underwater-kingdom';

export type World = {
  id: WorldId;
  name: Localized;
  description: Localized;
  mood: Localized;
  gradient: [string, string, string];
  accent: string;
  icon: MCIcon;
  /** One-line hook shown on the world card. */
  tagline: Localized;
};

export const WORLDS: World[] = [
  {
    id: 'lost-island',
    icon: 'waves',
    tagline: { en: 'Ancient secrets wait to be found', ar: 'أسرار قديمة تنتظر من يكتشفها' },
    name: { en: 'Lost Island', ar: 'الجزيرة المفقودة' },
    description: { en: 'Mist-wrapped shores, ancient ruins and a volcano that hums at night.', ar: 'شواطئ يلفّها الضباب، وأطلال قديمة، وبركان يهمهم ليلًا.' },
    mood: { en: 'Wild · Mysterious', ar: 'برّي · غامض' },
    gradient: ['#0E3B43', '#11555E', '#0B1020'],
    accent: '#4FE0C1',
  },
  {
    id: 'enchanted-forest',
    icon: 'leaf',
    tagline: { en: 'Mysterious creatures, ancient magic', ar: 'مخلوقات غامضة وسحر قديم' },
    name: { en: 'Enchanted Forest', ar: 'الغابة المسحورة' },
    description: { en: 'Glowing mushrooms, whispering trees and paths that rearrange themselves.', ar: 'فطر متوهّج وأشجار تهمس ودروب تعيد ترتيب نفسها.' },
    mood: { en: 'Magical · Whimsical', ar: 'سحري · حالم' },
    gradient: ['#123A24', '#1F5A36', '#0B1020'],
    accent: '#8CF27A',
  },
  {
    id: 'ancient-kingdom',
    icon: 'crown',
    tagline: { en: 'Mighty realms and royal feuds', ar: 'ممالك عظيمة وصراعات ملكية' },
    name: { en: 'Ancient Kingdom', ar: 'المملكة القديمة' },
    description: { en: 'Golden spires, royal intrigue and a crown that chooses its bearer.', ar: 'أبراج ذهبية ومكائد ملكية وتاج يختار حامله.' },
    mood: { en: 'Epic · Regal', ar: 'ملحمي · ملكي' },
    gradient: ['#4A3214', '#6E4A1C', '#0B1020'],
    accent: colors.gold,
  },
  {
    id: 'cyberpunk-city',
    icon: 'city-variant',
    tagline: { en: 'Advanced tech, new worlds', ar: 'تقنية متقدمة وعوالم جديدة' },
    name: { en: 'Cyberpunk City', ar: 'مدينة السايبربانك' },
    description: { en: 'Neon rain, rogue AIs and towers that scrape a poisoned sky.', ar: 'مطر نيون وذكاء اصطناعي متمرّد وأبراج تخدش سماءً مسمومة.' },
    mood: { en: 'Electric · Tense', ar: 'كهربائي · متوتر' },
    gradient: ['#3A0F4A', '#1B1250', '#0B1020'],
    accent: '#FF3FD0',
  },
  {
    id: 'desert-secrets',
    icon: 'pyramid',
    tagline: { en: 'Treasures lost in the sands of time', ar: 'كنوز مفقودة في رمال الزمن' },
    name: { en: 'Desert of Secrets', ar: 'صحراء الأسرار' },
    description: { en: 'Shifting dunes, buried cities and stars that point the way home.', ar: 'كثبان متحركة ومدن مدفونة ونجوم تدلّ على طريق العودة.' },
    mood: { en: 'Vast · Ancient', ar: 'شاسع · عتيق' },
    gradient: ['#5A3416', '#8A5420', '#0B1020'],
    accent: colors.fire,
  },
  {
    id: 'space-frontier',
    icon: 'orbit',
    tagline: { en: 'Adventures among the stars', ar: 'مغامرات بين النجوم والمجرات' },
    name: { en: 'Space Frontier', ar: 'تخوم الفضاء' },
    description: { en: 'Derelict stations, uncharted planets and signals from the void.', ar: 'محطات مهجورة وكواكب مجهولة وإشارات من الفراغ.' },
    mood: { en: 'Cosmic · Lonely', ar: 'كوني · موحش' },
    gradient: ['#14123E', '#251A5E', '#0B1020'],
    accent: colors.blue,
  },
  {
    id: 'haunted-mansion',
    icon: 'ghost-outline',
    tagline: { en: 'Every door hides a whisper', ar: 'خلف كل باب همسة' },
    name: { en: 'Haunted Mansion', ar: 'القصر المسكون' },
    description: { en: 'Creaking halls, portraits that watch and a door that was never there.', ar: 'ممرات تصرّ ولوحات تراقب وباب لم يكن موجودًا قط.' },
    mood: { en: 'Eerie · Gothic', ar: 'مخيف · قوطي' },
    gradient: ['#2A1A2E', '#3B2440', '#0B1020'],
    accent: '#B48CFF',
  },
  {
    id: 'underwater-kingdom',
    icon: 'fish',
    tagline: { en: 'Songs echoing from the deep', ar: 'أغانٍ يتردد صداها من الأعماق' },
    name: { en: 'Underwater Kingdom', ar: 'مملكة الأعماق' },
    description: { en: 'Coral palaces, pearl divers and songs that echo through the deep.', ar: 'قصور مرجانية وغوّاصو لؤلؤ وأغانٍ يتردد صداها في الأعماق.' },
    mood: { en: 'Serene · Deep', ar: 'هادئ · عميق' },
    gradient: ['#0A2E52', '#0F4573', '#0B1020'],
    accent: '#5FD3FF',
  },
];

export const GENRES: { id: string; name: Localized }[] = [
  { id: 'fantasy', name: { en: 'Fantasy', ar: 'خيال' } },
  { id: 'adventure', name: { en: 'Adventure', ar: 'مغامرة' } },
  { id: 'mystery', name: { en: 'Mystery', ar: 'غموض' } },
  { id: 'scifi', name: { en: 'Sci-Fi', ar: 'خيال علمي' } },
  { id: 'legend', name: { en: 'Legend', ar: 'أسطورة' } },
  { id: 'comedy', name: { en: 'Comedy', ar: 'كوميديا' } },
];

export const MOODS: { id: string; name: Localized }[] = [
  { id: 'epic', name: { en: 'Epic', ar: 'ملحمي' } },
  { id: 'mysterious', name: { en: 'Mysterious', ar: 'غامض' } },
  { id: 'hopeful', name: { en: 'Hopeful', ar: 'متفائل' } },
  { id: 'dark', name: { en: 'Dark', ar: 'قاتم' } },
  { id: 'whimsical', name: { en: 'Whimsical', ar: 'مرح' } },
  { id: 'tense', name: { en: 'Tense', ar: 'مشوّق' } },
];

export const AGE_RANGES: { id: '3-5' | '6-8' | '9-12'; name: Localized }[] = [
  { id: '3-5', name: { en: '3–5 years', ar: '٣–٥ سنوات' } },
  { id: '6-8', name: { en: '6–8 years', ar: '٦–٨ سنوات' } },
  { id: '9-12', name: { en: '9–12 years', ar: '٩–١٢ سنة' } },
];

export const BEDTIME_THEMES: { id: string; name: Localized }[] = [
  { id: 'friendship', name: { en: 'Friendship', ar: 'الصداقة' } },
  { id: 'courage', name: { en: 'Courage', ar: 'الشجاعة' } },
  { id: 'kindness', name: { en: 'Kindness', ar: 'اللطف' } },
  { id: 'nature', name: { en: 'Nature', ar: 'الطبيعة' } },
  { id: 'dreams', name: { en: 'Dreams', ar: 'الأحلام' } },
  { id: 'sharing', name: { en: 'Sharing', ar: 'المشاركة' } },
];

export function findWorld(id: string | undefined): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function nameOf<T extends { id: string; name: Localized }>(list: T[], id: string | undefined, lang: Language) {
  return list.find((x) => x.id === id)?.name[lang] ?? id ?? '';
}
