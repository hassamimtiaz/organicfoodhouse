import { SITE } from './site'

export const OUR_VALUES = {
  hero: {
    eyebrow: 'Who we are',
    title: 'Our Values',
    subtitle:
      'Mango lovers on a mission — bringing the taste and quality we love from the orchards of Rahim Yar Khan to your table.',
  },
  story: {
    title: 'Why we started',
    paragraphs: [
      `We are mango lovers at heart. ${SITE.name} began as a simple idea: share the same exceptional taste and quality we seek for our own families — fruit picked with care, ripened naturally, and packed with the respect it deserves.`,
      'Our journey starts in the farms of Rahim Yar Khan, a region known for rich soil, long summers, and mangoes with unmatched sweetness. We work closely with growers we trust, visiting orchards, checking ripeness, and choosing only what meets our standard.',
      'Every season we sell what is truly in season — no shortcuts, no carbide ripening, no compromise on freshness. Whether you pre-order for the first harvest or order when mangoes are at their peak, you get produce we would proudly serve at our own table.',
    ],
  },
  pillars: [
    {
      icon: '🥭',
      title: 'Taste we stand behind',
      description:
        'We only list varieties and lots we have tasted ourselves — rich flavour, proper ripeness, and the kind of quality worth repeating every summer.',
    },
    {
      icon: '🌾',
      title: 'Roots in Rahim Yar Khan',
      description:
        'Our partner farms in Rahim Yar Khan are at the heart of what we do. Local knowledge, careful picking, and short farm-to-home journeys keep mangoes fresh.',
    },
    {
      icon: '🌿',
      title: 'Organic & carbide-free',
      description:
        'Naturally ripened fruit, grown without artificial ripening agents. What you eat is what the tree intended — honest, seasonal, and safe.',
    },
    {
      icon: '🤝',
      title: 'Fair to farmers & customers',
      description:
        'We pay growers fairly and price transparently. No middlemen markup games — just direct relationships and produce you can trust.',
    },
    {
      icon: '📦',
      title: 'Care in every pack',
      description:
        'From grading and packing to delivery coordination, we treat each order like it is going to someone we know — because often, it is.',
    },
    {
      icon: '🚚',
      title: 'Delivered across Pakistan',
      description:
        'Based in Lahore with nationwide delivery. Pre-order early for the best selection, or order when your favourite variety is in stock.',
    },
  ],
  farmSpotlight: {
    title: 'From the farms of Rahim Yar Khan',
    description:
      'The mango belt of southern Punjab is famous for Chaunsa, Sindhri, and other beloved varieties. We source from orchards where trees are tended season after season — not rushed for volume, but grown for flavour. That is the standard we built this venture around.',
    highlights: [
      'Partner farms we visit and vet personally',
      'Tree-ripened picking windows, not forced harvests',
      'Varieties chosen for sweetness, aroma, and texture',
      'Packed soon after picking to lock in freshness',
    ],
  },
} as const
