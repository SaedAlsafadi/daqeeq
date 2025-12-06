# Arabic Translation Implementation Checklist

## Setup & Preparation ✅

- [x] i18n infrastructure created
- [x] Translation files created (en.json, ar.json)
- [x] Language switcher component created
- [x] Header updated with language switcher
- [x] Tailwind RTL support enabled
- [x] Hero component translated (template example)

### Installation Required:
- [ ] Run: `npm install` (in frontend-new directory)
- [ ] Verify: `npm run dev` and check for language switcher in header

---

## Phase 1: Critical Pages (Start Here)

### 1. Authentication Pages - **PRIORITY: CRITICAL**

#### 1.1 Sign In Page
**File:** `src/pages/Auth/SignIn.tsx`
- [ ] Import useTranslation hook
- [ ] Replace hardcoded strings with t() function:
  - [ ] Page title
  - [ ] Form labels (email, password, etc.)
  - [ ] Remember me checkbox
  - [ ] Forgot password link
  - [ ] Sign in button
  - [ ] Sign up link
  - [ ] Error messages
- [ ] Test in both languages

**Key translations to use:**
```
t('auth.signIn.title')
t('auth.signIn.email')
t('auth.signIn.password')
t('auth.signIn.rememberMe')
t('auth.signIn.forgotPassword')
t('auth.signIn.signInButton')
t('auth.signIn.noAccount')
t('auth.signIn.signUpLink')
```

#### 1.2 Sign Up Page
**File:** `src/pages/Auth/SignUp.tsx`
- [ ] Import useTranslation hook
- [ ] Replace all form labels with t() function:
  - [ ] Page title
  - [ ] First name, last name
  - [ ] Email, password, confirm password
  - [ ] Company name, organization type
  - [ ] Country, phone number
  - [ ] Terms agreement checkbox
  - [ ] Create account button
  - [ ] Sign in link
- [ ] Test in both languages

**Key translations to use:**
```
t('auth.signUp.title')
t('auth.signUp.firstName')
t('auth.signUp.lastName')
t('auth.signUp.email')
t('auth.signUp.password')
t('auth.signUp.confirmPassword')
t('auth.signUp.companyName')
t('auth.signUp.organizationType')
t('auth.signUp.country')
t('auth.signUp.phoneNumber')
t('auth.signUp.termsAgreement')
t('auth.signUp.signUpButton')
t('auth.signUp.alreadyHaveAccount')
t('auth.signUp.signInLink')
```

#### 1.3 Reset Password Page (if exists)
**File:** `src/pages/Auth/ResetPassword.tsx`
- [ ] Import useTranslation hook
- [ ] Replace hardcoded strings:
  - [ ] Page title
  - [ ] Email label
  - [ ] Reset button
  - [ ] Success message
- [ ] Test in both languages

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

### 2. Prediction Page - **PRIORITY: HIGH**
**File:** `src/pages/Dashboard/Prediction.tsx`

#### 2.1 Form Section
- [ ] Import useTranslation hook
- [ ] Replace form labels:
  - [ ] `t('predictions.facilitySize')`
  - [ ] `t('predictions.numberOfPeople')`
  - [ ] `t('predictions.numberOfBathrooms')`
  - [ ] `t('predictions.organizationType')`
  - [ ] `t('predictions.cleaningFrequency')`
  - [ ] `t('predictions.daysCount')`
- [ ] Replace frequency options:
  - [ ] `t('predictions.frequency.low')`
  - [ ] `t('predictions.frequency.medium')`
  - [ ] `t('predictions.frequency.high')`

#### 2.2 Results Section
- [ ] Replace supply names:
  - [ ] `t('predictions.toiletPaper')`
  - [ ] `t('predictions.handSoap')`
  - [ ] `t('predictions.disinfectant')`
  - [ ] `t('predictions.airFreshener')`
  - [ ] `t('predictions.glassCleaner')`
  - [ ] `t('predictions.trashBags')`
  - [ ] `t('predictions.tissues')`
  - [ ] `t('predictions.workers')`
- [ ] Replace unit labels:
  - [ ] `t('predictions.units.rolls')`
  - [ ] `t('predictions.units.packs')`
  - [ ] `t('predictions.units.gallons')`
- [ ] Replace buttons:
  - [ ] `t('predictions.createOrder')`
  - [ ] `t('predictions.addToCart')`

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## Phase 2: Dashboard Pages (High Priority)

### 3. User Dashboard - **PRIORITY: HIGH**
**File:** `src/pages/Dashboard/UserDashboard.tsx`

- [ ] Import useTranslation hook
- [ ] Replace welcome message with: `t('dashboard.user.welcome', { name: userName })`
- [ ] Replace tab labels:
  - [ ] `t('dashboard.user.overview')`
  - [ ] `t('dashboard.user.statistics')`
  - [ ] `t('dashboard.user.recentOrders')`
  - [ ] `t('dashboard.user.upcomingShipments')`
  - [ ] `t('dashboard.user.inventoryStatus')`
  - [ ] `t('dashboard.user.predictions')`
- [ ] Replace card titles and labels
- [ ] Replace all buttons
- [ ] Test RTL layout

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 4. Provider Dashboard - **PRIORITY: HIGH**
**File:** `src/pages/Dashboard/ProviderDashboard.tsx`

- [ ] Import useTranslation hook
- [ ] Replace welcome message: `t('dashboard.provider.welcome', { companyName: company })`
- [ ] Replace metric labels:
  - [ ] `t('dashboard.provider.activeContracts')`
  - [ ] `t('dashboard.provider.revenue')`
  - [ ] `t('dashboard.provider.clientsServed')`
  - [ ] `t('dashboard.provider.performance')`
- [ ] Replace section titles:
  - [ ] `t('dashboard.provider.orders.title')`
  - [ ] `t('dashboard.provider.serviceSchedule')`
  - [ ] `t('dashboard.provider.clientManagement')`
  - [ ] `t('dashboard.provider.invoicing')`
- [ ] Replace status labels and buttons
- [ ] Test RTL layout

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 5. Admin Dashboard - **PRIORITY: HIGH**
**File:** `src/pages/Dashboard/AdminDashboard.tsx`

- [ ] Import useTranslation hook
- [ ] Replace welcome message: `t('dashboard.admin.welcome')`
- [ ] Replace metric labels:
  - [ ] `t('dashboard.admin.systemOverview')`
  - [ ] `t('dashboard.admin.userManagement')`
  - [ ] `t('dashboard.admin.providerManagement')`
  - [ ] `t('dashboard.admin.reports')`
  - [ ] `t('dashboard.admin.systemHealth')`
  - [ ] `t('dashboard.admin.activeUsers')`
  - [ ] `t('dashboard.admin.totalRevenue')`
  - [ ] `t('dashboard.admin.platformStats')`
  - [ ] `t('dashboard.admin.recentActivity')`
- [ ] Replace feedback section:
  - [ ] `t('dashboard.admin.feedback.title')`
  - [ ] `t('dashboard.admin.feedback.summary')`
  - [ ] `t('dashboard.admin.feedback.details')`
  - [ ] `t('dashboard.admin.feedback.accuracy')`
- [ ] Test RTL layout

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## Phase 3: Landing Page Components (Medium Priority)

### 6. Landing Page Header
**File:** `src/pages/Landing/components/Header.tsx`

- [ ] Import useTranslation hook
- [ ] Replace navigation items: `t('navigation.*')`
- [ ] Replace buttons and links
- [ ] Check RTL alignment (logo placement, menu order)

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 7. Landing Page Features
**File:** `src/pages/Landing/components/Features.tsx`

- [ ] Import useTranslation hook
- [ ] Replace section title: `t('landing.features.title')`
- [ ] Replace feature titles and descriptions:
  - [ ] `t('landing.features.feature1.title')`
  - [ ] `t('landing.features.feature1.description')`
  - [ ] (repeat for feature2, feature3, feature4)

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 8. Landing Page Pricing
**File:** `src/pages/Landing/components/Pricing.tsx`

- [ ] Import useTranslation hook
- [ ] Replace title: `t('landing.pricing.title')`
- [ ] Replace tier names:
  - [ ] `t('landing.pricing.basic')`
  - [ ] `t('landing.pricing.professional')`
  - [ ] `t('landing.pricing.enterprise')`
- [ ] Replace feature names and descriptions
- [ ] Replace CTA buttons

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 9. Landing Page About/FAQ
**File:** `src/pages/Landing/components/About.tsx` & Contact

- [ ] Import useTranslation hook
- [ ] Replace FAQ section:
  - [ ] `t('landing.faq.title')`
  - [ ] `t('landing.faq.question1')`
  - [ ] `t('landing.faq.answer1')`
  - [ ] (repeat for additional FAQs)
- [ ] Replace CTA section:
  - [ ] `t('landing.cta.title')`
  - [ ] `t('landing.cta.description')`
  - [ ] `t('landing.cta.button')`

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 10. Landing Page Footer
**File:** `src/pages/Landing/components/Footer.tsx`

- [ ] Import useTranslation hook
- [ ] Replace footer links: `t('navigation.*')`
- [ ] Replace common labels: `t('common.*')`
- [ ] Replace company info and links

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## Phase 4: Other Pages (Lower Priority)

### 11. Partner Request Page
**File:** `src/pages/SupplierContact/PartnerRequest.tsx`

- [ ] Import useTranslation hook
- [ ] Replace form labels:
  - [ ] `t('partnerRequest.title')`
  - [ ] `t('partnerRequest.subtitle')`
  - [ ] All form fields: `t('partnerRequest.*')`
- [ ] Replace submit button and messages
- [ ] Test form functionality

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 12. Orders Pages
**Files:** `src/pages/Dashboard/Orders.tsx` (and related)

- [ ] Import useTranslation hook
- [ ] Replace page title: `t('orders.title')`
- [ ] Replace column headers: `t('orders.*')`
- [ ] Replace status labels: `t('orders.statuses.*')`
- [ ] Replace button labels: `t('orders.*')`

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 13. Feedback Pages
**Files:** `src/pages/Dashboard/Feedback.tsx`

- [ ] Import useTranslation hook
- [ ] Replace page title: `t('feedback.title')`
- [ ] Replace form labels and feedback types
- [ ] Replace submit button

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

### 14. Settings Pages
**Files:** `src/pages/Settings/Settings.tsx`

- [ ] Import useTranslation hook
- [ ] Replace all settings labels and options
- [ ] Use: `t('settings.*')`

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## Phase 5: RTL Layout Fixes

### Components Needing RTL Review:

#### 15. Sidebar Navigation
**File:** `src/layouts/components/Sidebar.tsx`
- [ ] Check icon/text alignment
- [ ] May need: `rtl:flex-row-reverse` in some items
- [ ] Check padding/margins
- [ ] Test mobile view

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

#### 16. Forms & Inputs
**Multiple files**
- [ ] Check label positioning
- [ ] Input alignment
- [ ] Error message placement
- [ ] Use: `ml-4 rtl:ml-0 rtl:mr-4` for margins

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

#### 17. Cards with Images/Icons
**Multiple files**
- [ ] Check image positioning on cards
- [ ] Use: `flex rtl:flex-row-reverse` for image + content
- [ ] Check border radius consistency

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

#### 18. Dropdowns & Popovers
**Multiple files**
- [ ] Check positioning
- [ ] Alignment with RTL
- [ ] Arrow/chevron direction

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

#### 19. Tables
**Multiple files**
- [ ] Check column alignment
- [ ] Sticky columns work in RTL
- [ ] Sorting indicators align correctly

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

#### 20. Modals & Dialogs
**Multiple files**
- [ ] Button layout (OK/Cancel order)
- [ ] Form inside modals
- [ ] Close button position

**Completion Status:** ☐ Not Started ☐ In Progress ☐ Complete

---

## Phase 6: Testing & Quality Assurance

### Functional Testing
- [ ] Language switcher appears in header
- [ ] Clicking switcher toggles between English and Arabic
- [ ] Page layout switches to RTL when Arabic is selected
- [ ] Page layout switches to LTR when English is selected
- [ ] No console errors when switching languages
- [ ] All text is translated (no English strings in Arabic mode)

### Persistence Testing
- [ ] Refresh page - language preference is remembered
- [ ] Close and reopen browser - language is still set
- [ ] Check localStorage for 'language' key

### Theme Compatibility
- [ ] Light theme works with English
- [ ] Light theme works with Arabic
- [ ] Dark theme works with English
- [ ] Dark theme works with Arabic
- [ ] Theme switcher works with language switcher

### Mobile Responsive
- [ ] Language switcher visible on mobile
- [ ] RTL layout works on mobile
- [ ] Forms work on mobile in both languages
- [ ] Dropdowns/menus work on mobile

### Content Testing
- [ ] All user-facing text is translated
- [ ] Dynamic values (names, numbers) work with translations
- [ ] Error messages are translated
- [ ] Success messages are translated
- [ ] Placeholder text is translated
- [ ] Button tooltips are translated

### RTL Layout Testing
- [ ] Sidebar properly aligned in RTL
- [ ] Forms properly aligned in RTL
- [ ] Cards properly laid out in RTL
- [ ] Tables properly aligned in RTL
- [ ] Modals properly positioned in RTL
- [ ] Dropdowns positioned correctly in RTL

### Cross-Browser Testing
- [ ] Chrome - English ✓
- [ ] Chrome - Arabic ✓
- [ ] Firefox - English ✓
- [ ] Firefox - Arabic ✓
- [ ] Safari - English ✓
- [ ] Safari - Arabic ✓
- [ ] Edge - English ✓
- [ ] Edge - Arabic ✓

### Accessibility Testing
- [ ] Tab navigation works in both languages
- [ ] Screen readers work in both languages
- [ ] Focus indicators visible in both modes
- [ ] Color contrast maintained in both languages

---

## Final Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] No console errors or warnings
- [ ] All pages translated and functional
- [ ] RTL layout properly styled
- [ ] Mobile responsive tested
- [ ] Theme switching tested with translations
- [ ] Performance tested (no lag from translations)
- [ ] QA pass with both languages
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Final UAT complete

---

## Notes & Known Issues

### Known Limitations:
- External libraries might still show English (ApexCharts, etc.)
- RTL support for third-party components may be limited

### Best Practices to Remember:
1. Always add translations to BOTH en.json and ar.json
2. Use consistent key naming: `section.subsection.key`
3. Test both languages after every change
4. Check RTL layout after form/layout changes
5. Use dynamic interpolation for names/counts: `{{variableName}}`

### Performance Notes:
- Translations don't impact performance
- Language switch is instant
- No additional API calls needed
- All translations loaded upfront

---

## Support & References

- **Translation Keys:** See `en.json` and `ar.json` for all available keys
- **Pattern Example:** `src/pages/Landing/components/Hero.tsx`
- **Detailed Guide:** `TRANSLATION_GUIDE.md`
- **Summary:** `ARABIC_TRANSLATION_SUMMARY.md`
- **Tailwind RTL:** https://tailwindcss.com/docs/rtl
- **i18next:** https://react.i18next.com/

---

## Progress Tracking

- **Estimated Total Time:** 16-18 hours
- **Start Date:** ___________
- **Completion Date:** ___________

### By Phase:
- Phase 1 (Auth): ☐ ___hrs (Target: 2hrs)
- Phase 2 (Dashboards): ☐ ___hrs (Target: 4hrs)
- Phase 3 (Landing): ☐ ___hrs (Target: 2hrs)
- Phase 4 (Other): ☐ ___hrs (Target: 3hrs)
- Phase 5 (RTL): ☐ ___hrs (Target: 2hrs)
- Phase 6 (QA): ☐ ___hrs (Target: 2hrs)

**Total: _____ hours**

