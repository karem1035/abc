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
    'users.phone': 'الهاتف',
    'users.email': 'البريد الإلكتروني',
    'users.password': 'كلمة المرور',
    'users.optional': 'اختياري',
    'users.actions': 'الإجراءات',
    'users.create': 'إضافة مستخدم',
    'users.edit': 'تعديل المستخدم',
    'users.delete': 'حذف المستخدم',
    'users.deleteConfirm': 'هل أنت متأكد من حذف "{name}"؟ لا يمكن التراجع عن هذا الإجراء.',
    'users.created': 'تم إنشاء المستخدم',
    'users.updated': 'تم تحديث المستخدم',
    'users.deleted': 'تم حذف المستخدم',
    'users.cancel': 'إلغاء',
    'users.save': 'حفظ',
    'users.createBtn': 'إنشاء',
    'users.deleteBtn': 'حذف',
    'users.editBtn': 'تعديل',
    'users.usernameTaken': 'اسم المستخدم مستخدم بالفعل',
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
    'profile.saved': 'تم حفظ الملف الشخصي',
    'profile.changePassword': 'تغيير كلمة المرور',
    'profile.currentPassword': 'كلمة المرور الحالية',
    'profile.newPassword': 'كلمة المرور الجديدة',
    'profile.confirmPassword': 'تأكيد كلمة المرور الجديدة',
    'profile.passwordChanged': 'تم تغيير كلمة المرور',
    'profile.wrongCurrent': 'كلمة المرور الحالية غير صحيحة',
    'profile.passwordsMismatch': 'كلمتا المرور الجديدتان غير متطابقتين',
    'common.loading': 'جارٍ التحميل…',
    'common.comingSoon': 'قريباً — ليست ضمن هذه الخطوة.',
    'common.logoutError': 'فشل تسجيل الخروج',
    'common.rowsPerPage': 'عدد الصفوف في الصفحة',
    'common.page': 'صفحة',
    'roles.admin': 'مدير',
    'roles.call_center': 'خدمة عملاء',
    'roles.marketer': 'مسوّق',
    'audit.actions.auth.login': 'تسجيل دخول',
    'audit.actions.auth.logout': 'تسجيل خروج',
    'audit.actions.user.created': 'إنشاء مستخدم',
    'audit.actions.user.updated': 'تحديث مستخدم',
    'audit.actions.user.deleted': 'حذف مستخدم',
    'audit.actions.profile.updated': 'تحديث الملف الشخصي',
    'audit.actions.profile.password_changed': 'تغيير كلمة المرور',
    'audit.actions.media.uploaded': 'رفع ملف',
    'audit.actions.media.deleted': 'حذف ملف',
    'audit.entities.auth': 'الجلسات',
    'audit.entities.users': 'المستخدمون',
    'audit.entities.media': 'الملفات',
    'audit.metadata': 'التفاصيل',
    'audit.noResults': 'لا توجد سجلات',
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'phone.invalid': 'رقم هاتف غير صالح',
    'phone.label': 'الهاتف',
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
    'users.phone': 'Phone',
    'users.email': 'Email',
    'users.password': 'Password',
    'users.optional': 'optional',
    'users.actions': 'Actions',
    'users.create': 'Add user',
    'users.edit': 'Edit user',
    'users.delete': 'Delete user',
    'users.deleteConfirm': 'Are you sure you want to delete "{name}"? This cannot be undone.',
    'users.created': 'User created',
    'users.updated': 'User updated',
    'users.deleted': 'User deleted',
    'users.cancel': 'Cancel',
    'users.save': 'Save',
    'users.createBtn': 'Create',
    'users.deleteBtn': 'Delete',
    'users.editBtn': 'Edit',
    'users.usernameTaken': 'Username already taken',
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
    'profile.saved': 'Profile saved',
    'profile.changePassword': 'Change password',
    'profile.currentPassword': 'Current password',
    'profile.newPassword': 'New password',
    'profile.confirmPassword': 'Confirm new password',
    'profile.passwordChanged': 'Password changed',
    'profile.wrongCurrent': 'Current password is incorrect',
    'profile.passwordsMismatch': 'New passwords do not match',
    'common.loading': 'Loading…',
    'common.comingSoon': 'Coming soon — not part of this step.',
    'common.logoutError': 'Failed to log out',
    'common.rowsPerPage': 'Rows per page',
    'common.page': 'page',
    'roles.admin': 'Admin',
    'roles.call_center': 'Call Center',
    'roles.marketer': 'Marketer',
    'audit.actions.auth.login': 'Login',
    'audit.actions.auth.logout': 'Logout',
    'audit.actions.user.created': 'User created',
    'audit.actions.user.updated': 'User updated',
    'audit.actions.user.deleted': 'User deleted',
    'audit.actions.profile.updated': 'Profile updated',
    'audit.actions.profile.password_changed': 'Password changed',
    'audit.actions.media.uploaded': 'File uploaded',
    'audit.actions.media.deleted': 'File deleted',
    'audit.entities.auth': 'Auth',
    'audit.entities.users': 'Users',
    'audit.entities.media': 'Media',
    'audit.metadata': 'Details',
    'audit.noResults': 'No records',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'phone.invalid': 'Invalid phone number',
    'phone.label': 'Phone',
  },
} as const

export type TranslationKey = keyof (typeof dict)['ar']

type I18nContextValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string>) => string
  /** Translate a dynamic label (role, audit action/entity) with fallback to the raw value. */
  tLabel: (key: string) => string
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

  const tLabel = useCallback(
    (key: string) => (dict[locale] as Record<string, string>)[key] ?? key,
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t, tLabel }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
