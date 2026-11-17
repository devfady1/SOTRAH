# 🛡️ دليل الفرونت إند لبناء داشبورد مالك النظام — SOTRAH Owner Dashboard

> **الجمهور المستهدف:** مطور الواجهة الأمامية (Frontend Developer)  
> **النطاق:** بناء لوحة تحكم مالك النظام (`SUPER_ADMIN`) كتطبيق **مستقل (Standalone React App)** داخل المستودع، منفصل عن صفحة العرض التعريفية الموجودة في `frontend/`.

---

## 1️⃣ هيكل المشروع والتشغيل الأولي (Standalone App Setup)

بما أن مجلد `frontend/` مخصص حالياً للصفحة التعريفية (Landing Page)، سنقوم بإنشاء تطبيق مستقل في جذر المشروع باسم **`owner-dashboard/`**:

```text
SOTRAH/
├── backend/                  # Django REST API (جاهز ومكتمل للـ Owner Dashboard)
├── frontend/                 # صفحة العرض التعريفية الحالية (Landing Page)
└── owner-dashboard/          # 👈 التطبيق الجديد المستقل الذي ستبنيه هنا
```

### خطوات إنشاء التطبيق الجديد

من جذر المستودع (`SOTRAH/`):

```bash
# 1. إنشاء مشروع React + Vite جديد
npm create vite@latest owner-dashboard -- --template react
cd owner-dashboard

# 2. تثبيت الاعتماديات المطلوبة
npm install react-router-dom axios lucide-react recharts

# 3. إنشاء ملف متغيرات البيئة
# .env
echo "VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1" > .env

# 4. تشغيل التطبيق
npm run dev
```

### تشغيل الباك إند محلياً للاختبار (مرتبط ببيانات تجريبية جاهزة)

```bash
cd backend
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

> **حساب مالك النظام التجريبي (`SUPER_ADMIN`):**
> - **البريد الإلكتروني:** `superadmin@sotrah.com`
> - **كلمة المرور:** `SuperAdmin123!`
> - **للتأكد من عزل الصلاحيات:** جرّب أيضاً الدخول بـ `admin@sotrah.com` / `SotrahAdmin123!` (`COMPANY_ADMIN`) — يجب أن يرفض الفرونت إند دخوله لهذه اللوحة ويعرض رسالة عدم وجود صلاحية (`403`).

---

## 2️⃣ الهوية البصرية ونظام التصميم (Design System)

التزم بنفس الهوية الصناعية الداكنة الموجودة في [frontend/src/index.css](file:///f:/SOTRAH/frontend/src/index.css) لضمان توحيد تجربة سُترة:

- **الاتجاه واللغة:** `dir="rtl"` و `lang="ar"` في `index.html`.
- **الخطوط (Google Fonts):**
  - الرئيسي للنصوص العربية: `IBM Plex Sans Arabic`
  - للأرقام والـ Serial/MAC/UUIDs: `JetBrains Mono`
- **لوحة الألوان (CSS Variables):**
  ```css
  :root {
    --bg-obsidian: #050608;
    --bg-elevated: #0b0c10;
    --bg-card: rgba(16, 18, 24, 0.78);
    --bg-card-solid: #101218;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-highlight: rgba(255, 255, 255, 0.16);
    --text-primary: #ffffff;
    --text-secondary: #858a96;
    --text-muted: #565b66;
    --sotrah-orange: #ff5d1a;   /* اللون الأساسي والأزرار */
    --sotrah-emerald: #10b981;  /* النشط / المدفوع / المتصل */
    --sotrah-cyan: #38bdf8;     /* البيانات والإحصائيات */
    --sotrah-amber: #f59e0b;    /* تحذير / قيد الانتظار */
    --sotrah-red: #ef4444;      /* تعليق / متأخر / عطل */
  }
  ```

---

## 3️⃣ هيكل المجلدات المقترح داخل `owner-dashboard/src/`

```text
owner-dashboard/src/
├── api/
│   ├── client.js             # Axios instance + Authorization header + Refresh Token interceptor
│   ├── authApi.js            # login, me, roles, industries
│   ├── ownerTenantsApi.js    # organizations, plans, invoices, users
│   └── ownerFleetApi.js      # overview, analytics, vests, gateways, audit-logs, announcements, health
├── context/
│   └── AuthContext.jsx       # حفظ user & tokens والتحقق من user.role === 'SUPER_ADMIN'
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx  # Sidebar (RTL) + Topbar + System Health badge
│   │   └── ProtectedOwnerRoute.jsx
│   ├── common/
│   │   ├── KpiCard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── QuotaProgressBar.jsx
│   │   ├── Pagination.jsx
│   │   └── Modal.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── OverviewPage.jsx
│   ├── OrganizationsPage.jsx
│   ├── OrganizationDetailPage.jsx
│   ├── SubscriptionsPage.jsx
│   ├── FleetPage.jsx
│   ├── UsersPage.jsx
│   ├── AuditLogsPage.jsx
│   └── AnnouncementsPage.jsx
├── App.jsx
└── main.jsx
```

---

## 4️⃣ المصادقة وإدارة التوكن (Auth & Interceptor Flow)

1. **تسجيل الدخول (`POST /api/v1/auth/login/`):**
   - أرسل `{ "email": "...", "password": "..." }`.
   - استلم `tokens.access` و `tokens.refresh` و `user`.
   - **شرط حرج:** افحص `user.role === 'SUPER_ADMIN'`. إذا كان الدور مختلفاً (مثل `COMPANY_ADMIN` أو `WORKER`)، **لا تحفظ الجلسة** واعرض رسالة: *"هذه اللوحة مخصصة لمالك النظام العام فقط"*.
2. **تجديد التوكن التلقائي (Axios Interceptor):**
   - أرفق `Authorization: Bearer <access>` في كل طلب.
   - عند استلام `401 Unauthorized`، استدعِ `POST /api/v1/auth/refresh/` مع `{ "refresh": "<refresh_token>" }`.
   - عند فشل التحديث، نظّف التخزين وحوّل المستخدم إلى `/login`.
3. **تنسيق الأخطاء الموحد من الباك إند:**
   - معظم أخطاء التحقق تعود بالشكل:
     ```json
     {
       "success": false,
       "message": "رسالة توضيحية بالعربية",
       "errors": { "field_name": ["تفاصيل الخطأ"] }
     }
     ```
   - اعرض `error.response?.data?.message` في Toast/Alert، واربط `errors` بحقول النموذج (Form fields).

---

## 5️⃣ الصفحات والمكونات المطلوب تنفيذها بالتفصيل

### صفحة 1: نظرة عامة (`/`) — `OverviewPage`
- **4–6 بطاقات KPIs رئيسية** من `GET /api/v1/owner/overview/`:
  - إجمالي المنشآت (`organizations.total`) + النشطة (`organizations.active_accounts`) والمعلقة (`inactive_accounts`).
  - إجمالي المستخدمين (`users.total`) + الموثقين (`users.verified`).
  - مخزون السترات (`vests.total`) مع تفصيل (`ACTIVE` / `ASSIGNED` / `IN_STOCK` / `MAINTENANCE`).
  - البوابات المحلية (`gateways.total`) مع تنبيه البوابات الـ `OFFLINE`.
  - الإيرادات المحصّلة (`revenue.total_paid_egp`) والمستحقة (`pending_egp` / `overdue_egp`).
- **الرسوم البيانية (`Recharts`):**
  - مخطط خطي/عمودي للنمو الشهري من `GET /api/v1/owner/analytics/growth/?months=6` (نمو المنشآت، المستخدمين، السترات، الإيرادات).
  - مخطط دائري (Donut/Pie) لتوزيع المنشآت حسب القطاع `organizations.by_industry` والباقة `organizations.by_tier`.
- **بطاقة تنبيهات استهلاك الحصص (`quota_alerts`):**
  - عرض المنشآت التي تجاوز استهلاكها **80%** من `max_users` أو `max_vests` مع زر انتقال مباشر لملف الشركة لترقية الباقة.
- **آخر 5 أحداث تدقيق (`recent_audit_logs`)** + **مؤشر صحة النظام** في الشريط العلوي من `GET /api/v1/owner/health/`.

### صفحة 2: إدارة المنشآت (`/organizations` و `/organizations/:id`)
- **جدول المنشآت** مع ترقيم صفحات (`page`, `page_size`) + شريط بحث (`?search=`) + فلاتر (`industry`, `subscription_tier`, `subscription_status`, `is_active`).
  - اعرض شريط تقدم لاستهلاك المستخدمين (`users_count / max_users`) والسترات (`vests_count / max_vests`).
- **زر "إضافة منشأة جديدة" (Modal):**
  - ينشئ الشركة **وحساب مدير الشركة الأول (`COMPANY_ADMIN`)** في خطوة واحدة (`POST /api/v1/owner/organizations/`).
  - استخدم `GET /api/v1/auth/industries/` لملء قائمة القطاعات الصناعية.
- **صفحة تفاصيل المنشأة (`/organizations/:id`):**
  - عرض بيانات السجل التجاري، الرقم الضريبي، تفاصيل الاشتراك (`subscription_profile`)، آخر الفواتير (`recent_invoices`)، ومديري الشركة (`company_admins`).
  - نموذج تعديل الحصص/الباقة (`PATCH /api/v1/owner/organizations/:id/`).
  - زر **تعليق / تفعيل المنشأة** (`POST /api/v1/owner/organizations/:id/status/`) مع نافذة تأكيد لإدخال سبب التعليق (`reason`).

### صفحة 3: الباقات والفواتير (`/subscriptions`)
- **تبويب 1 — باقات الاشتراك (`Plans`):**
  - بطاقات الباقات الأربع (`FREE_TRIAL`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`) من `GET /api/v1/owner/plans/`.
  - إمكانية تعديل السعر الشهري/السنوي والحدود الافتراضية (`PATCH /api/v1/owner/plans/:id/`).
- **تبويب 2 — الفواتير (`Invoices`):**
  - جدول الفواتير مع فلترة بالحالة (`PENDING`, `PAID`, `OVERDUE`, `CANCELLED`) والبحث برقم الفاتورة أو اسم الشركة.
  - Modal لإنشاء فاتورة جديدة (`POST /api/v1/owner/invoices/`).
  - زر **"تأكيد السداد" (`Mark Paid`)** للفواتير غير المدفوعة يفتح Modal لاختيار طريقة الدفع (`BANK_TRANSFER`, `INSTAPAY`, `CARD`, `CASH`) وتفعيل خيار تمديد الاشتراك تلقائياً (`extend_subscription: true`).

### صفحة 4: أسطول العتاد — السترات والبوابات (`/fleet`)
- **تبويب 1 — السترات الذكية (`SmartVests`):**
  - جدول يعرض: `serial_number`, `mac_address`, `firmware_version`, `battery_health_pct`, `status`, و`organization_name`.
  - فلاتر: الحالة (`IN_STOCK`, `ASSIGNED`, `ACTIVE`, `MAINTENANCE`, `DECOMMISSIONED`)، سترات المخزون غير المخصصة (`?unassigned=true`)، البحث (`?search=`).
  - زر **"إضافة سترة للمخزون"** (`POST /api/v1/owner/vests/`).
  - زر **"تخصيص لشركة"** (`POST /api/v1/owner/vests/:id/assign/`): يفتح Modal لاختيار الشركة، ويعرض بجانب كل شركة استهلاكها الحالي `vests_count / max_vests` (ويمكنك تعطيل الشركات الممتلئة أو إظهار خطأ الباك إند إذا وصلت للحد الأقصى).
  - زر **"سحب للمخزون"** (`POST /api/v1/owner/vests/:id/unassign/`): مع اختيار الحالة المستهدفة (`IN_STOCK` أو `MAINTENANCE`).
  - زر **"إخراج من الخدمة"** (`DELETE /api/v1/owner/vests/:id/`): متاح فقط للسترات غير المخصصة.
- **تبويب 2 — البوابات المحلية (`EdgeGateways`):**
  - نفس نمط الجدول والإضافة والتخصيص/السحب لبوابات Raspberry Pi 4 (`/api/v1/owner/gateways/`).

### صفحة 5: مستخدمو المنصة (`/users`)
- جدول كل المستخدمين عبر كل المنشآت (`GET /api/v1/owner/users/`).
- فلاتر: الشركة (`?organization=`), الدور (`?role=` من `GET /api/v1/auth/roles/`), التفعيل (`?is_active=`), التوثيق (`?is_verified=`), والبحث (`?search=`).
- زر **إضافة مستخدم** (`POST /api/v1/owner/users/`).
- مفاتيح تبديل سريعة (Toggle) لتفعيل/تعطيل الحساب (`is_active`) أو توثيقه (`is_verified`) أو تغيير دوره (`PATCH /api/v1/owner/users/:id/`). *(ملحوظة: الباك إند يمنع تعطيل حسابك الشخصي أو آخر Super Admin).*

### صفحة 6: سجل التدقيق (`/audit-logs`)
- جدول قراءة فقط (`GET /api/v1/owner/audit-logs/`) يعرض كل عملية حساسة: المنفّذ (`actor_email`)، نوع الحدث (`action`)، الهدف (`target_type` + `target_label`)، عنوان الـ IP، والتفاصيل (`metadata`)، والتاريخ.
- فلاتر: `action`, `target_type`, `date_from`, `date_to`, `search`.

### صفحة 7: إعلانات المنصة وصحة النظام (`/announcements`)
- إنشاء/تعديل/إيقاف إعلانات موجهة لكل الشركات أو لباقة محددة (`target_tier`) بمستوى أهمية (`INFO`, `WARNING`, `CRITICAL`).
- لوحة مصغرة تعرض بيانات `/api/v1/owner/health/` (اتصال قاعدة البيانات، البوابات غير المتصلة، السترات في الصيانة، الفواتير المتأخرة، والتجارب المنتهية خلال 7 أيام).

---

## 6️⃣ مرجع عقود الـ APIs الكامل (API Contract Reference)

**Base URL:** `http://127.0.0.1:8000/api/v1`  
**Headers لكل طلبات `/owner/*`:**
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### أ) التوثيق والمرجعيات العامة (`/auth/*`)
| Endpoint | Method | الوصف |
| :--- | :--- | :--- |
| `/auth/login/` | `POST` | تسجيل الدخول: `{ email, password }` -> `{ success, tokens: { access, refresh }, user }` |
| `/auth/refresh/` | `POST` | تجديد التوكن: `{ refresh }` -> `{ access, refresh }` |
| `/auth/me/` | `GET` | بيانات المستخدم الحالي |
| `/auth/roles/` | `GET` | قائمة الأدوار `[{ code, label }]` |
| `/auth/industries/` | `GET` | قائمة القطاعات الصناعية `[{ code, label }]` |

### ب) التحليلات والمراقبة (`/owner/overview/`, `analytics/growth/`, `health/`)

#### `GET /owner/overview/`
```json
{
  "success": true,
  "overview": {
    "organizations": {
      "total": 3,
      "active_accounts": 3,
      "inactive_accounts": 0,
      "by_status": { "ACTIVE": 3, "SUSPENDED": 0, "EXPIRED": 0 },
      "by_tier": { "FREE_TRIAL": 1, "STARTER": 0, "PROFESSIONAL": 1, "ENTERPRISE": 1 },
      "by_industry": { "OIL_AND_GAS": 1, "CONSTRUCTION": 1, "MANUFACTURING": 1 }
    },
    "users": {
      "total": 6,
      "active": 6,
      "verified": 6,
      "by_role": { "SUPER_ADMIN": 1, "COMPANY_ADMIN": 1, "SAFETY_OFFICER": 1 }
    },
    "vests": {
      "total": 6,
      "by_status": { "IN_STOCK": 2, "ASSIGNED": 1, "ACTIVE": 2, "MAINTENANCE": 1, "DECOMMISSIONED": 0 }
    },
    "gateways": {
      "total": 3,
      "by_status": { "IN_STOCK": 1, "ONLINE": 1, "OFFLINE": 1, "MAINTENANCE": 0 }
    },
    "revenue": {
      "total_paid_egp": "280000.00",
      "pending_egp": "12000.00",
      "overdue_egp": "0.00",
      "paid_invoices_count": 1,
      "pending_invoices_count": 1,
      "overdue_invoices_count": 0
    },
    "active_announcements_count": 1,
    "quota_alerts": [
      {
        "organization_id": "uuid",
        "organization_name": "...",
        "subscription_tier": "STARTER",
        "users_used": 8,
        "max_users": 10,
        "users_usage_pct": 80.0,
        "vests_used": 4,
        "max_vests": 5,
        "vests_usage_pct": 80.0
      }
    ]
  },
  "recent_audit_logs": [ ... ]
}
```

#### `GET /owner/analytics/growth/?months=6`
```json
{
  "success": true,
  "months": 6,
  "series": [
    {
      "month": "2026-11",
      "organizations_created": 3,
      "users_created": 6,
      "vests_registered": 6,
      "paid_revenue_egp": "280000.00"
    }
  ]
}
```

#### `GET /owner/health/`
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "database": "connected",
    "offline_gateways_count": 1,
    "maintenance_vests_count": 1,
    "suspended_organizations_count": 0,
    "overdue_invoices_count": 0,
    "expiring_trials_7d_count": 1,
    "server_time": "2026-11-17 15:30:00"
  }
}
```

### ج) المنشآت والباقات والفواتير والمستخدمين

> **ملاحظة الترقيم (Pagination):** جميع قوائم `GET` (`organizations/`, `invoices/`, `users/`, `vests/`, `gateways/`, `audit-logs/`, `announcements/`) تدعم `?page=1&page_size=20` وتعود بالصيغة:
> `{ "count": 25, "next": "...", "previous": null, "results": [ ... ] }`

| Endpoint | Method | Body / Query Params | الاستجابة |
| :--- | :--- | :--- | :--- |
| `/owner/organizations/` | `GET` | `?search=&industry=&subscription_tier=&subscription_status=&is_active=` | Paginated list of orgs with `users_count`, `vests_count`, `expires_at` |
| `/owner/organizations/` | `POST` | `{ name, industry, subscription_tier, billing_cycle, max_vests?, max_users?, commercial_registration?, tax_number?, contact_email?, contact_phone?, address?, admin_first_name, admin_last_name, admin_email, admin_password, admin_phone_number? }` | `201`: `{ success, message, organization, admin_user }` |
| `/owner/organizations/{id}/` | `GET` | — | تفاصيل الشركة + `subscription_profile` + `recent_invoices` + `company_admins` |
| `/owner/organizations/{id}/` | `PATCH` | أي حقل من حقول التعديل مثل `{ subscription_tier, max_vests, max_users }` | `200`: `{ success, message, organization }` |
| `/owner/organizations/{id}/status/` | `POST` | `{ "action": "suspend" \| "activate", "reason": "..." }` | `200`: `{ success, message, organization }` |
| `/owner/plans/` | `GET` | — | قائمة الباقات (غير مرقمة - Array مباشر) |
| `/owner/plans/` | `POST` | `{ tier, name_ar, name_en, monthly_price_egp, annual_price_egp, default_max_vests, default_max_users, trial_days, features, is_active }` | `201` |
| `/owner/plans/{id}/` | `PATCH` | حقول التعديل | `200` |
| `/owner/invoices/` | `GET` | `?status=&organization=&search=` | Paginated invoices |
| `/owner/invoices/` | `POST` | `{ organization, plan, amount_egp, due_date, payment_method?, notes? }` | `201` |
| `/owner/invoices/{id}/mark-paid/` | `POST` | `{ payment_method?, extend_subscription?, extend_days?, notes? }` | `200`: `{ success, message, invoice }` |
| `/owner/users/` | `GET` | `?organization=&role=&is_active=&is_verified=&search=` | Paginated users |
| `/owner/users/` | `POST` | `{ email, first_name, last_name, password, role, organization_id?, phone_number?, job_title?, is_verified? }` | `201`: `{ success, message, user }` |
| `/owner/users/{id}/` | `PATCH` | `{ first_name?, last_name?, role?, organization?, phone_number?, job_title?, is_active?, is_verified? }` | `200`: `{ success, message, user }` |

### د) الأسطول، التدقيق، والإعلانات

| Endpoint | Method | Body / Query Params | الاستجابة |
| :--- | :--- | :--- | :--- |
| `/owner/vests/` | `GET` | `?status=&organization=&unassigned=true&firmware_version=&search=` | Paginated `SmartVest` list |
| `/owner/vests/` | `POST` | `{ serial_number, mac_address, sim_iccid?, hardware_revision?, firmware_version?, battery_health_pct?, notes? }` | `201` |
| `/owner/vests/{id}/` | `PATCH` | `{ firmware_version?, status?, battery_health_pct?, notes? }` | `200` |
| `/owner/vests/{id}/` | `DELETE` | — (للسترات غير المخصصة فقط) | `200`: `{ success, message, vest }` |
| `/owner/vests/{id}/assign/` | `POST` | `{ "organization_id": "uuid" }` | `200`: `{ success, message, vest }` |
| `/owner/vests/{id}/unassign/` | `POST` | `{ "target_status": "IN_STOCK" \| "MAINTENANCE" }` | `200`: `{ success, message, vest }` |
| `/owner/gateways/` | `GET` | `?status=&organization=&unassigned=true&search=` | Paginated `EdgeGateway` list |
| `/owner/gateways/` | `POST` | `{ gateway_uid, model_name?, firmware_version?, ip_address?, notes? }` | `201` |
| `/owner/gateways/{id}/assign/` | `POST` | `{ "organization_id": "uuid" }` | `200`: `{ success, message, gateway }` |
| `/owner/gateways/{id}/unassign/` | `POST` | `{ "target_status": "IN_STOCK" \| "MAINTENANCE" }` | `200`: `{ success, message, gateway }` |
| `/owner/audit-logs/` | `GET` | `?action=&target_type=&actor=&date_from=&date_to=&search=` | Paginated read-only audit logs |
| `/owner/announcements/` | `GET` | `?is_active=&severity=&target_tier=&search=` | Paginated announcements |
| `/owner/announcements/` | `POST` | `{ title, message, severity, target_tier?, is_active?, starts_at?, ends_at? }` | `201` |
| `/owner/announcements/{id}/` | `PATCH` / `DELETE` | تعديل أو حذف الإعلان | `200` / `204` |

---

## ✅ قائمة تحقق لمطور الفرونت إند (Acceptance Checklist)

- [ ] إنشاء التطبيق المستقل في `owner-dashboard/` وتجهيز `.env`.
- [ ] بناء `ProtectedOwnerRoute` الذي يمنع أي مستخدم غير `SUPER_ADMIN` من دخول الصفحات.
- [ ] ربط Axios Interceptor لتجديد التوكن تلقائياً عند `401`.
- [ ] بناء صفحة النظرة العامة بالـ KPIs والرسوم البيانية وتنبيهات استهلاك الحصص.
- [ ] بناء إدارة المنشآت (إنشاء شركة + مدير، تعديل الحصص، تعليق/تفعيل).
- [ ] بناء إدارة الباقات والفواتير (وتأكيد السداد).
- [ ] بناء إدارة مخزون السترات والبوابات (تخصيص لشركة مع التحقق من `max_vests`، وسحب للمخزون).
- [ ] بناء إدارة المستخدمين وسجل التدقيق والإعلانات ومؤشر صحة النظام.
- [ ] اختبار كامل التطبيق في الوضع العربي `RTL` والتأكد من عدم وجود أخطاء في Console أو استجابات `4xx/5xx` غير معالجة.
