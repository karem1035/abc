import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Locale = 'ar' | 'en'

const dict = {
  ar: {
    'app.name': 'لوحة ABC',
    'nav.dashboard': 'الرئيسية',
    'nav.users': 'المستخدمون',
    'nav.auditLogs': 'سجل التغييرات',
    'nav.bookings': 'الحجوزات',
    'nav.content': 'المحتوى',
    'nav.settings': 'الإعدادات',
    'action.profile': 'الملف الشخصي',
    'action.logout': 'تسجيل الخروج',
    'action.login': 'تسجيل الدخول',
    'action.save': 'حفظ',
    'action.saving': 'جارٍ الحفظ…',
    'login.title': 'تسجيل الدخول',
    'login.description': 'ادخل إلى لوحة تحكم ABC',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.submit': 'دخول',
    'login.submitting': 'جارٍ الدخول…',
    'login.invalid': 'اسم المستخدم أو كلمة المرور غير صحيحة',
    'dashboard.welcome': 'أهلاً بك، {name}',
    'dashboard.signedInAs': 'مسجّل الدخول باسم {username} ({role})',
    'dashboard.scaffold': 'هذه بنية أولية — ستُضاف الصفحات في الخطوات القادمة.',
    'users.title': 'المستخدمون',
    'users.name': 'الاسم',
    'users.username': 'اسم المستخدم',
    'users.role': 'الدور',
    'users.active': 'نشط',
    'users.inactive': 'غير نشط',
    'audit.title': 'سجل التغييرات',
    'audit.when': 'التاريخ',
    'audit.actor': 'المستخدم',
    'audit.action': 'الإجراء',
    'audit.entity': 'العنصر',
    'audit.ip': 'IP',
    'profile.title': 'الملف الشخصي',
    'profile.name': 'الاسم',
    'profile.email': 'البريد الإلكتروني',
    'profile.phone': 'الهاتف',
    'profile.newPassword': 'كلمة مرور جديدة (اختياري)',
    'profile.saved': 'تم حفظ الملف الشخصي',
    'common.loading': 'جارٍ التحميل…',
    'common.comingSoon': 'قريباً — ليست ضمن هذه الخطوة.',
    'common.logoutError': 'فشل تسجيل الخروج',
  },
  en: {
    'app.name': 'ABC Dashboard',
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Users',
    'nav.auditLogs': 'Audit Logs',
    'nav.bookings': 'Bookings',
    'nav.content': 'Content',
    'nav.settings': 'Settings',
    'action.profile': 'Profile',
    'action.logout': 'Log out',
    'action.login': 'Sign in',
    'action.save': 'Save',
    'action.saving': 'Saving…',
    'login.title': 'Sign in',
    'login.description': 'Sign in to the ABC dashboard',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in…',
    'login.invalid': 'Invalid username or password',
    'dashboard.welcome': 'Welcome, {name}',
    'dashboard.signedInAs': 'Signed in as {username} ({role})',
    'dashboard.scaffold': 'This is a scaffold — pages will be added in the next steps.',
    'users.title': 'Users',
    'users.name': 'Name',
    'users.username': 'Username',
    'users.role': 'Role',
    'users.active': 'Active',
    'users.inactive': 'Inactive',
    'audit.title': 'Audit Logs',
    'audit.when': 'When',
    'audit.actor': 'Actor',
    'audit.action': 'Action',
    'audit.entity': 'Entity',
    'audit.ip': 'IP',
    'profile.title': 'Profile',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.newPassword': 'New password (optional)',
    'profile.saved': 'Profile saved',
    'common.loading': 'Loading…',
    'common.comingSoon': 'Coming soon — not part of this step.',
    'common.logoutError': 'Failed to log out',
  },
} as const

export type TranslationKey = keyof (typeof dict)['ar']

type I18nContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const LOCALE_KEY = 'abc.locale'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(LOCALE_KEY)
    return stored === 'en' ? 'en' : 'ar' // Arabic is the default
  })

  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_KEY, next)
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      let value: string = dict[locale][key] ?? dict.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replaceAll(`{${k}}`, v)
        }
      }
      return value
    },
    [locale],
  )

  return <I18nContext.Provider value={{ locale, dir, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
