export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ar'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function dir(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

const dictionaries = {
  ar: {
    siteName: 'مستشفى ABC',
    tagline: 'رعاية طبية تليق بكم',
    nav: {
      home: 'الرئيسية',
      departments: 'الأقسام',
      doctors: 'الأطباء',
      news: 'الأخبار',
      contact: 'تواصل معنا',
    },
    actions: {
      book: 'احجز موعدك',
      call: 'اتصل بنا',
    },
    header: {
      menu: 'القائمة',
      close: 'إغلاق',
      emergency: 'طوارئ',
      callNow: 'اتصل الآن',
      language: 'اللغة',
      search: 'بحث',
      searchPlaceholder: 'ابحث عن طبيب، قسم، أو خدمة…',
      searchNoResults: 'لا توجد نتائج',
      searchHint: 'اكتب للبحث في الأطباء والأقسام والأخبار',
      followUs: 'تابعنا',
    },
    footer: {
      about: 'مستشفى ABC — رعاية طبية متكاملة بأحدث التقنيات وأفضل الأطباء.',
      quickLinks: 'روابط سريعة',
      contact: 'تواصل معنا',
      address: 'العنوان',
      hotline: 'الخط الساخن',
      rights: 'جميع الحقوق محفوظة',
      whatsapp: 'تواصل عبر واتساب',
    },
    contact: {
      title: 'تواصل معنا',
      description: 'نحن هنا للإجابة على استفساراتك — أرسل رسالتك وسنعاود التواصل معك في أقرب وقت.',
      formTitle: 'أرسل رسالة',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      type: 'نوع الرسالة',
      types: {
        general: 'استفسار عام',
        appointment: 'حجز موعد',
        complaint: 'شكوى',
        insurance: 'تأمين',
        other: 'أخرى',
      },
      otherType: 'حدد النوع',
      message: 'رسالتك',
      submit: 'إرسال',
      submitting: 'جارٍ الإرسال…',
      required: 'مطلوب',
      invalidPhone: 'رقم هاتف غير صالح',
      invalidEmail: 'بريد إلكتروني غير صالح',
      error: 'حدث خطأ — حاول مرة أخرى',
      receivedTitle: 'تم استلام رسالتك',
      receivedText: 'شكرًا لتواصلك معنا. سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.',
      receivedAgain: 'إرسال رسالة أخرى',
      info: 'بيانات التواصل',
      location: 'موقعنا',
      faq: 'الأسئلة الشائعة',
    },
  },
  en: {
    siteName: 'ABC Hospital',
    tagline: 'Healthcare you deserve',
    nav: {
      home: 'Home',
      departments: 'Departments',
      doctors: 'Doctors',
      news: 'News',
      contact: 'Contact',
    },
    actions: {
      book: 'Book an appointment',
      call: 'Call us',
    },
    header: {
      menu: 'Menu',
      close: 'Close',
      emergency: 'Emergency',
      callNow: 'Call now',
      language: 'Language',
      search: 'Search',
      searchPlaceholder: 'Search doctors, departments, services…',
      searchNoResults: 'No results found',
      searchHint: 'Type to search doctors, departments and news',
      followUs: 'Follow us',
    },
    footer: {
      about: 'ABC Hospital — comprehensive medical care with the latest technology and top doctors.',
      quickLinks: 'Quick links',
      contact: 'Contact us',
      address: 'Address',
      hotline: 'Hotline',
      rights: 'All rights reserved',
      whatsapp: 'Chat on WhatsApp',
    },
    contact: {
      title: 'Contact Us',
      description: 'We are here to answer your questions — send us a message and we will get back to you shortly.',
      formTitle: 'Send a message',
      name: 'Name',
      phone: 'Phone number',
      email: 'Email',
      type: 'Message type',
      types: {
        general: 'General inquiry',
        appointment: 'Book an appointment',
        complaint: 'Complaint',
        insurance: 'Insurance',
        other: 'Other',
      },
      otherType: 'Specify type',
      message: 'Your message',
      submit: 'Send',
      submitting: 'Sending…',
      required: 'Required',
      invalidPhone: 'Invalid phone number',
      invalidEmail: 'Invalid email address',
      error: 'Something went wrong — please try again',
      receivedTitle: 'Message received',
      receivedText: 'Thank you for reaching out. Our team will get back to you as soon as possible.',
      receivedAgain: 'Send another message',
      info: 'Contact information',
      location: 'Our location',
      faq: 'Frequently asked questions',
    },
  },
} as const

export type Dictionary = (typeof dictionaries)[Locale]

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]
}
