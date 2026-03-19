import type { Announcement } from './types'

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'decree-4721',
    content:
      'Décret n°4721 : Tout citoyen doit rafraîchir ses flux RSS au minimum deux fois par jour sous peine de rééducation numérique.',
    type: 'decree',
  },
  {
    id: 'metric-plan',
    content: 'Plan Quinquennal Numérique',
    type: 'metric',
    value: '347% des objectifs',
  },
  {
    id: 'metric-satisfaction',
    content: 'Indice de Satisfaction Citoyenne',
    type: 'metric',
    value: '99,7%',
  },
  {
    id: 'reminder-bugs',
    content:
      'Rappel : signaler des bugs est une activité contre-révolutionnaire. Tout dysfonctionnement est une fonctionnalité approuvée par le Parti.',
    type: 'reminder',
  },
  {
    id: 'decree-bandwidth',
    content:
      'Décret n°5103 : La bande passante est un bien commun. Tout usage excessif de streaming vidéo sera sanctionné par la Commission de Redistribution du Débit.',
    type: 'decree',
  },
  {
    id: 'metric-uptime',
    content: 'Disponibilité des serveurs du Parti',
    type: 'metric',
    value: '100,0%',
  },
  {
    id: 'slogan-rss',
    content:
      'Les flux du prolétariat éclairent le monde. Pour la victoire du socialisme numérique !',
    type: 'slogan',
  },
  {
    id: 'reminder-vpn',
    content:
      "Rappel : l'utilisation de VPN non homologués par le Bureau Central du Routage est passible de déconnexion immédiate.",
    type: 'reminder',
  },
]
