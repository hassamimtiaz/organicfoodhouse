import { SITE } from './site'

export const ABOUT_US = {
  hero: {
    eyebrow: 'Our story',
    title: 'About us',
    subtitle:
      'We are mango lovers who started this venture to share the taste and quality we love — straight from the farms of Rahim Yar Khan to homes across Pakistan.',
  },
  story: {
    title: 'Why we started',
    paragraphs: [
      `${SITE.name} began with a simple frustration: great mangoes were hard to find at the quality we wanted for our own families. We knew the orchards of southern Punjab could deliver something better — sweeter, riper, and honestly grown.`,
      'So we built a direct path from those farms to your doorstep. We visit partner growers in Rahim Yar Khan, taste what they harvest, and only offer varieties and lots we would proudly serve at our own table.',
      'Today we are a seasonal organic marketplace — mangoes in summer, and more harvests as seasons change. We keep the operation personal: order on the website, WhatsApp, or call us, and we handle the rest with care.',
    ],
    quote:
      'We started this venture because we wanted everyone to taste what we love from the farms of Rahim Yar Khan — nothing less.',
  },
  mission: {
    title: 'Our mission',
    text: 'Make farm-fresh, carbide-free organic produce accessible to families who care about taste and trust — without the market rush, middlemen confusion, or compromise on ripeness.',
  },
  farmSpotlight: {
    title: 'From the farms of Rahim Yar Khan',
    description:
      'The mango belt of southern Punjab is famous for Chaunsa, Sindhri, Dasheri, and other beloved varieties. Our partner orchards are tended season after season — grown for flavour, not just volume.',
    highlights: [
      'Farms we visit and vet personally',
      'Tree-ripened picking windows, not forced harvests',
      'Varieties chosen for sweetness, aroma, and texture',
      'Packed soon after picking to lock in freshness',
    ],
  },
  howWeWork: {
    title: 'How we work with you',
    items: [
      {
        icon: '🛒',
        title: 'Order your way',
        description:
          'Browse online, pre-order seasonal picks, message on WhatsApp, or call — whichever is easiest for you.',
      },
      {
        icon: '📞',
        title: 'We confirm personally',
        description:
          'After you place an order, we contact you to confirm details, delivery, and anything specific to your address.',
      },
      {
        icon: '📦',
        title: 'Packed with care',
        description:
          'Each order is graded and packed for transit — the same attention we would want for our own delivery.',
      },
    ],
  },
} as const
