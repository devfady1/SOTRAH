# 🚀 دليل عمل الفريق على Git و GitHub لمنظومة سُترة (SOTRAH)
> هذا الدليل مخصص لأعضاء فريق مشروع تخرج سُترة (8 أعضاء) لضمان العمل بسلاسة تامة وتجنب أي تضارب في الكود (Merge Conflicts).

---

## 🛑 القواعد الذهبية الأربع (The 4 Golden Rules)

1. **ممنوع الرفع المباشر (`git push`) على فرع `main` أو `dev` نهائياً:**
   * العمل دائماً يكون على فرع ميزة مستقل (`feature/your-task`).
   * الدمج يتم فقط عبر **Pull Request (PR)** ومراجعة الزملاء أو قائد الفريق.
2. **ابدأ يومك دائماً بسحب آخر التحديثات:**
   * قبل أن تكتب سطراً واحداً كل يوم:
     ```bash
     git checkout dev
     git pull origin dev
     ```
3. **لا تعدل على نفس الملف الذي يعمل عليه زميلك في نفس اللحظة:**
   * يتم توزيع المهام بحيث يعمل كل شخص على تطبيق منفصل (مثلاً: شخص في `accounts/`، وشخص في `vests/`، وشخص في `frontend/`).
4. **تأكد من نجاح الاختبارات قبل رفع أي شيء:**
   ```bash
   cd backend
   python manage.py test
   ```

---

## 🌳 استراتيجية الفروع (Branching Strategy)

* **`main` (Production):** الفرع النهائي المستقر والجاهز للعرض أمام المشرف ولجنة التحكيم. لا يُمس إلا عند تسليم نسخة كاملة مجربة.
* **`dev` (Development):** فرع التطوير الرئيسي. كل الفروع تتفرع منه وتصب فيه بعد المراجعة.
* **فروع المهام (`feature/*` أو `fix/*`):**
  * تسمية الفروع بوضوح تعبر عن المهمة وصاحبها:
    * `feat/fady-auth-jwt`
    * `feat/youssef-hardware-mqtt`
    * `feat/bishoy-fall-detection`
    * `feat/asmaa-attendance-geofence`
    * `fix/login-error-response`

---

## 🔄 دورة حياة كتابة الميزة ورفعها (Step-by-Step Workflow)

### 1. إنشاء فرع جديد للمهمة
```bash
# الانتقال لفرع التطوير وسحب أحدث نسخة
git checkout dev
git pull origin dev

# إنشاء فرعك الخاص والانتقال إليه
git checkout -b feat/your-feature-name
```

### 2. كتابة الكود وحفظ التغييرات محلياً
```bash
# فحص الملفات المعدلة
git status

# إضافة التعديلات
git add .

# تسجيل الـ Commit برسالة واضحة باللغة الإنجليزية أو العربية
git commit -m "feat(accounts): add user profile update endpoint"
```

### 3. قبل الرفع: تحديث فرعك بآخر ما وصل لـ `dev` (منع الـ Conflicts مسبقاً!)
```bash
# سحب أي تعديلات جديدة قام بها زملاؤك ودمجها في فرعك محلياً
git checkout dev
git pull origin dev
git checkout feat/your-feature-name
git merge dev
```
> [!TIP]
> إذا ظهر أي تضارب (Conflict)، ستقوم بحله عندك محلياً في Visual Studio Code بهدوء واختبار الكود، ولن يرى GitHub أو باقي الفريق أي مشكلة!

### 4. رفع الفرع وفتح طلب دمج (Pull Request)
```bash
# رفع فرعك الخاص إلى GitHub
git push -u origin feat/your-feature-name
```
* اذهب إلى صفحة المستودع على GitHub: [https://github.com/devfady1/SOTRAH](https://github.com/devfady1/SOTRAH).
* ستجد زراً أخضر: **Compare & pull request**، اضغط عليه.
* اختر Base: **`dev`** وليس `main`.
* املأ نموذج الـ PR واختر أحد زملائك أو قائد الفريق كمراجع (**Reviewer**).
* بمجرد الموافقة واجتياز اختبارات الـ GitHub Actions، يتم الدمج بضغطة زر (**Merge**).

---

## ⚡ فخاخ مشهورة في دجانغو وكيف نتفاداها (Django Traps)

### 1. تضارب ملفات الهجرة (Migrations Conflict):
إذا أنشأ شخصان ملفي هجرة بنفس الرقم مثل `0002_auto.py` لكل من تطبيقهما:
* الحل البسيط:
  ```bash
  cd backend
  python manage.py makemigrations --merge
  python manage.py migrate
  ```

### 2. رفع ملفات البيئة أو قواعد البيانات المحلية:
* تأكد من عدم رفع ملف `db.sqlite3` أو ملف `.env` المحتوي على كلمات سر. هما مدرجان بالفعل في `.gitignore`.

---

## 👥 توزيع المسؤوليات في الفريق (Module Ownership)

لضمان أقصى سرعة وأعلى إنتاجية، يفضل تقسيم العمل حسب الموديولات:
1. **IoT Firmware & Sensors:** (التعامل مع ESP32، الرادار 60GHz، مجسات الحرارة).
2. **Edge Gateway & MQTT:** (بوابة Raspberry Pi وتدفق الرسائل عبر بروتوكول MQTT).
3. **Backend Core & Safety API:** (لوحة السلامة الحية، إنذارات الطوارئ، السقوط).
4. **Backend HR-ERP API:** (الحضور والانصراف التلقائي، السياج الجغرافي، الورديات).
5. **Frontend Dashboard (Web):** (لوحة القيادة التفاعلية بـ React).
6. **Mobile App:** (تطبيق مشرف الوردية والعمال).
7. **Documentation & Testing:** (توثيق الـ APIs، اختبارات الجودة، وكتابة تقرير المشروع).
