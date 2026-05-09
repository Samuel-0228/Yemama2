export type ContactType = 'online' | 'in-person'

export type SampleDoctor = {
  id: string
  name: string
  specialty: string
  location: string
  contactType: ContactType
}

export type SampleLab = {
  id: string
  name: string
  location: string
  services: string[]
}

export const SAMPLE_DOCTORS: SampleDoctor[] = [
  {
    id: 'dr-hana',
    name: 'Dr. Hana Tesfaye',
    specialty: 'Obstetrics & Gynecology',
    location: 'Addis Ababa',
    contactType: 'online',
  },
  {
    id: 'dr-brook',
    name: 'Dr. Brook Alemu',
    specialty: 'Maternal-Fetal Medicine',
    location: 'Bole, Addis Ababa',
    contactType: 'online',
  },
  {
    id: 'dr-eden',
    name: 'Dr. Eden Mekonnen',
    specialty: 'Obstetrics & Gynecology',
    location: 'CMC, Addis Ababa',
    contactType: 'in-person',
  },
  {
    id: 'dr-samuel',
    name: 'Dr. Samuel Girma',
    specialty: 'Family Medicine',
    location: 'Piassa, Addis Ababa',
    contactType: 'in-person',
  },
]

export const SAMPLE_LABS: SampleLab[] = [
  {
    id: 'lab-black-lion',
    name: 'Black Lion Diagnostic Lab',
    location: 'Addis Ababa',
    services: ['Ultrasound', 'Blood test', 'Hormone panel'],
  },
  {
    id: 'lab-stpaul',
    name: 'St. Paul Medical Lab',
    location: 'Gulele, Addis Ababa',
    services: ['Blood test', 'CBC', 'Urine analysis'],
  },
  {
    id: 'lab-ras-desta',
    name: 'Ras Desta Women Care Lab',
    location: 'Kazanchis, Addis Ababa',
    services: ['Ultrasound', 'Glucose test', 'Thyroid panel'],
  },
]
