export type PregnancyWeekInfo = {
  week: number
  babySize: string
  milestone: string
  tip: string
}

// Concise, week-based guidance for in-app education (non-diagnostic).
// If a week isn't listed, the app will fall back to a safe default message.
export const PREGNANCY_WEEK_DATA: PregnancyWeekInfo[] = [
  { week: 4, babySize: 'Poppy seed', milestone: 'Implantation begins and early placenta forms.', tip: 'Start a prenatal vitamin with folate if you haven’t.' },
  { week: 6, babySize: 'Lentil', milestone: 'Heartbeat may begin; brain and spinal cord develop.', tip: 'Small frequent meals can help nausea.' },
  { week: 8, babySize: 'Raspberry', milestone: 'Major organs start forming; tiny limbs appear.', tip: 'Hydrate often—aim for light-colored urine.' },
  { week: 10, babySize: 'Strawberry', milestone: 'Baby is now in fetal stage; fingers/toes are forming.', tip: 'Rest when tired—fatigue is common.' },
  { week: 12, babySize: 'Lime', milestone: 'Reflexes begin; facial features become clearer.', tip: 'If you feel dizzy, sit down and sip water.' },
  { week: 14, babySize: 'Lemon', milestone: 'Baby can make small movements; neck strengthens.', tip: 'Add iron-rich foods like lentils, eggs, greens.' },
  { week: 16, babySize: 'Avocado', milestone: 'Bones begin to harden; baby may practice swallowing.', tip: 'Gentle walking can ease back discomfort.' },
  { week: 18, babySize: 'Sweet potato', milestone: 'Hearing develops; baby may respond to sound.', tip: 'Try side-sleeping with a pillow support.' },
  { week: 20, babySize: 'Mango', milestone: 'More active movements; anatomy scan often happens around now.', tip: 'If heartburn shows up, eat smaller meals and avoid lying down right after eating.' },
  { week: 22, babySize: 'Papaya', milestone: 'Lungs continue developing; skin thickens.', tip: 'If swelling increases suddenly, contact your provider.' },
  { week: 24, babySize: 'Corn', milestone: 'Baby practices breathing; brain growth accelerates.', tip: 'Aim for steady sleep—nap if nights are difficult.' },
  { week: 26, babySize: 'Zucchini', milestone: 'Eyes begin to open; baby responds more to light and sound.', tip: 'If cramps worsen with bleeding, seek care urgently.' },
  { week: 28, babySize: 'Eggplant', milestone: 'Third trimester begins; baby gains more fat.', tip: 'Rest and elevate feet if swelling is mild.' },
  { week: 30, babySize: 'Cabbage', milestone: 'Brain develops rapidly; baby can turn head side to side.', tip: 'Practice slow breathing to help stress and sleep.' },
  { week: 32, babySize: 'Squash', milestone: 'Bones are formed; baby’s kicks may feel stronger.', tip: 'Prepare your emergency contacts and hospital plan.' },
  { week: 34, babySize: 'Pineapple', milestone: 'Lungs mature; baby continues gaining weight.', tip: 'If you get headaches with vision changes, seek urgent care.' },
  { week: 36, babySize: 'Honeydew', milestone: 'Baby may move into head-down position.', tip: 'Pack a small hospital bag if you haven’t.' },
  { week: 38, babySize: 'Watermelon', milestone: 'Baby is near full term and may drop lower in the pelvis.', tip: 'Monitor movements—reduced movement needs prompt evaluation.' },
  { week: 40, babySize: 'Newborn', milestone: 'Due week—baby may arrive any day.', tip: 'If contractions are regular or your water breaks, contact your provider.' },
]

export function getPregnancyWeekInfo(week: number): PregnancyWeekInfo {
  const safeWeek = Number.isFinite(week) ? Math.max(1, Math.min(40, Math.round(week))) : 20

  // Find the closest <= week entry (so week 21 uses week 20 info, etc.)
  const sorted = [...PREGNANCY_WEEK_DATA].sort((a, b) => a.week - b.week)
  let found = sorted[0]
  for (const row of sorted) {
    if (row.week <= safeWeek) found = row
    if (row.week > safeWeek) break
  }

  return {
    week: safeWeek,
    babySize: found?.babySize || 'Growing baby',
    milestone: found?.milestone || 'Baby is growing and developing every day.',
    tip: found?.tip || 'Rest, hydrate, and follow your prenatal care plan.',
  }
}

