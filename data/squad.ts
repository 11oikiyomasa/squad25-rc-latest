export type Role = 'EXP' | 'JUNGLE' | 'MID' | 'GOLD' | 'ROAM';

export type Montage = {
  title: string;
  hero: string;
  duration: string;
  youtubeId: string;
  description: string;
};

export function normalizeYoutubeId(value: string): string {
  const input = value.trim();
  if (!input) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;

  const isValid = (candidate: string | null) => candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : '';

  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'youtu.be') return isValid(url.pathname.slice(1).split('/')[0] ?? '');
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const queryId = url.searchParams.get('v');
      if (queryId) return isValid(queryId);
      const parts = url.pathname.split('/').filter(Boolean);
      const marker = parts[0];
      if (marker === 'shorts' || marker === 'embed' || marker === 'live') return isValid(parts[1] ?? '');
    }
  } catch {
    return '';
  }
  return '';
}

export type GalleryItem = {
  id: string;
  title: string;
  meta: string;
  image: string;
};

export const squadProfile = {
  name: 'SQUAD.25',
  tagline: 'Twenty-five players. One comms line.',
  season: '2026',
  instagram: '#',
  tiktok: '#',
  youtube: '#',
};

export type Member = {
  id: string;
  number: string;
  nickname: string;
  name: string;
  role: Role;
  hero: string;
  status: 'ACTIVE' | 'BENCH' | 'CAPTAIN';
  bio: string;
  accent: string;
  photo: string;
  montages: Montage[];
};

const roles: Role[] = ['EXP', 'JUNGLE', 'MID', 'GOLD', 'ROAM'];
const names = [
  ['RYUU', 'Ryu Andika'], ['KAZE', 'Raka Pratama'], ['NIX', 'Niko Ardi'], ['VEX', 'Vicky Rama'], ['MIO', 'Mio Satria'],
  ['KIRA', 'Kiran Putra'], ['ZENO', 'Zeno Fajar'], ['REI', 'Rei Mahesa'], ['AKI', 'Aki Ramdan'], ['RAZE', 'Rafli Zaki'],
  ['YUKI', 'Yuki Adnan'], ['NERO', 'Nero Alfin'], ['SORA', 'Sora Fikri'], ['KYO', 'Kyo Rama'], ['JIN', 'Jin Akbar'],
  ['RIN', 'Rin Arga'], ['SHIN', 'Shin Fajar'], ['KAI', 'Kai Dimas'], ['ZERO', 'Zero Ilham'], ['REN', 'Ren Bagas'],
  ['ZACK', 'Zack Arya'], ['HAYO', 'Hayo Ilham'], ['AERO', 'Aero Bima'], ['ONIX', 'Onix Reza'], ['VINO', 'Vino Aditya'],
] as const;

const heroes = ['Yu Zhong', 'Ling', 'Yve', 'Beatrix', 'Chou', 'Paquito', 'Fanny', 'Pharsa', 'Claude', 'Khufra'];
const accents = ['#d7ff43', '#ff6b38', '#8cb4ff', '#d98cff', '#5fe8c6'];

export const members: Member[] = names.map(([nickname, name], index) => {
  const role = roles[index % roles.length];
  const status = index === 0 ? 'CAPTAIN' : index > 21 ? 'BENCH' : 'ACTIVE';
  return {
    id: nickname.toLowerCase(),
    number: String(index + 1).padStart(2, '0'),
    nickname,
    name,
    role,
    hero: heroes[index % heroes.length],
    status,
    bio: `${role} specialist. Main focus: clean rotations, disciplined comms, and finding the first crack in a fight.`,
    accent: accents[index % accents.length],
    photo: `/images/members/${nickname.toLowerCase()}.svg`,
    montages: [
      {
        title: `${nickname} — matchday cut`, hero: heroes[index % heroes.length], duration: '00:42',
        youtubeId: '', description: 'Matchday archive cut.'
      },
      {
        title: `${nickname} — ranked session`, hero: heroes[(index + 3) % heroes.length], duration: '01:08',
        youtubeId: '', description: 'Matchday archive cut.'
      },
    ],
  };
});

export const featuredMontage = members[3];

export const achievements = [
  { year: '2026', title: 'Night League — Top 4', note: 'Regional open bracket' },
  { year: '2025', title: 'Campus Clash — Champion', note: 'Best of 5 final / 3–1' },
  { year: '2025', title: 'City Scrim Series — Runner-up', note: 'Invitational circuit' },
];

export const gallery: GalleryItem[] = [
  { id: 'g01', title: 'Night queue', meta: 'Scrim / 01', image: '/images/gallery/night-queue.svg' },
  { id: 'g02', title: 'Draft room', meta: 'Matchday / 02', image: '/images/gallery/draft-room.svg' },
  { id: 'g03', title: 'After the win', meta: 'Final / 03', image: '/images/gallery/after-win.svg' },
  { id: 'g04', title: 'Comms check', meta: 'Practice / 04', image: '/images/gallery/comms-check.svg' },
  { id: 'g05', title: 'Road to bracket', meta: 'League / 05', image: '/images/gallery/road-bracket.svg' },
  { id: 'g06', title: 'Full squad', meta: 'Archive / 06', image: '/images/gallery/full-squad.svg' },
];
