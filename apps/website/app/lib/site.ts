// Site-wide contact info — update once, used everywhere
export const site = {
  name: { ar: 'مستشفى ABC', en: 'ABC Hospital' },
  hotline: '2322',
  emergency: '2322',
  phone: '+201274666618',
  whatsapp: '+201274666618', // international format, digits only, for wa.me links
  email: 'info@abchospitaleg.com',
  address: {
    ar: '15 شارع عمرو، من شارع سوريا، المهندسين',
    en: '15 Amr St, from Syria St, Mohandeseen',
  },
  social: {
    facebook: 'https://www.facebook.com/ABChospitaleg/',
    instagram: 'https://www.instagram.com/abchospitaleg',
    linkedin: 'https://eg.linkedin.com/company/abchospital',
    youtube: 'https://www.youtube.com/@abchospitaleg',
  },
} as const
