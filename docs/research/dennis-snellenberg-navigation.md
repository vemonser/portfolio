# مرجع: تنقّل Dennis Snellenberg — مرصود حياً

> **المصدر:** https://dennissnellenberg.com/
> **تاريخ الفحص:** 2026-11-14
> **الأداة:** `gsd-browser` (Chromium حقيقي) + قراءة CSS/JS المنشور على الموقع
> **المقاس المرجعي:** 1920×1080 (وتحقق إضافي على 1440×900)
>
> كل الأرقام هنا **مقيسة من المتصفح** أو منسوخة من ملفات الـ CSS/JS المنشورة على الموقع،
> وليست تقديرات. الصور في `docs/reference/dennis-navigation/`.

---

## 0. الفكرة في سطر

الموقع **لا يستخدم برجر دائماً**. في أعلى الصفحة تظهر روابط نصية عادية.
بعد الاسكرول 30% من الشاشة يظهر زر دائري. عند الضغط عليه تدخل لوحة من اليمين
بحافة أمامية **بيضاوية ضخمة**، ثم تنكمش هذه الحافة حتى تصبح اللوحة مستقيمة.
الإغلاق هو نفس الحركة معكوسة — لا يوجد timeline منفصل.

```
[أعلى الصفحة]  Work · About · Contact   ← روابط ظاهرة، زر مخفي (scale 0)
[اسكرول 30%+]  ●                        ← زر دائري يظهر بحركة spring
[ضغط]          لوحة بحافة مقوّسة → حافة مستقيمة (800ms)
[إغلاق]        نفس المسار بالعكس
```

---

## 1. الحالة عند أعلى الصفحة

| العنصر | الحقيقة |
|---|---|
| روابط التنقل | `ul.links-wrap` داخل `header.home-header` |
| تموضعها | `position: absolute` داخل الهيدر — **تسكرول مع الصفحة**، ليست fixed |
| زر القائمة | موجود في الـ DOM دائماً، لكن `transform: scale(0)` — غير مرئي وغير قابل للضغط |
| اللوحة | خارج الشاشة يميناً بـ `translateX(calc(100% + 6vw))` |

الصورة: `01-desktop-top.png`

---

## 2. ظهور زر القائمة

### المشغّل

```js
ScrollTrigger.create({
  start: 'top -30%',
  onUpdate:     () => $('main').addClass('scrolled'),
  onLeaveBack:  () => $('main').removeClass('scrolled'),
});
```

- يظهر عند **30% من ارتفاع الشاشة** (324px عند 1080px) — مقيس: `start: 323.99`.
- `onUpdate` يضيف الكلاس مرة واحدة ويثبته؛ لا يختفي عند النزول أكثر.
- يختفي فقط عند الرجوع فوق نقطة البداية (`onLeaveBack`).
- لا يوجد إخفاء عند الاسكرول لأسفل — الزر يظل ظاهراً بعد ظهوره.

### الحركة

```css
.btn-hamburger {
  position: fixed;
  top: calc(var(--gap-padding) / 1.5);    /* 31.67px @1920 */
  right: calc(var(--gap-padding) / 1.5);
  z-index: 105;
  transition: transform .4s cubic-bezier(0.36, 0, 0.66, 0);
  transform: translateY(0%) scale(0) rotate(0.001deg);
}

main.scrolled .btn-hamburger {
  transition: transform .4s cubic-bezier(0.34, 1.5, 0.64, 1); /* spring */
  transform: translateY(0%) scale(1) rotate(0.001deg);
}
```

- المدة **400ms**.
- منحنى الظهور `cubic-bezier(0.34, 1.5, 0.64, 1)` — **overshoot**، فالزر يطلع أكبر قليلاً ثم يستقر.
- منحنى الاختفاء مختلف: `cubic-bezier(0.36, 0, 0.66, 0)` (ease-in، بلا overshoot).

### شكل الزر

| الخاصية | القيمة |
|---|---|
| القطر | `clamp(4em, 5.5vw, 5em)` = **95px** @1920 |
| الشكل | دائرة كاملة `border-radius: 50%` |
| الخلفية | `--color-dark` = `#1C1D20` |
| الإطار | `box-shadow: inset 0 0 0 1px` بلون `--color-border-light` |
| الخطّان | حاوية `.btn-bars` بعرض `28%` وارتفاع `8%` من الزر |
| سماكة الخط | **1px**، أبيض |
| المسافة بين الخطين | 8% من 95px ≈ **7.6px** |
| النص | مخفي (`opacity: 0`) — الزر أيقونة فقط |

الصورة: `02-desktop-burger.png`

---

## 3. الفتح — طبقات الحركة

كل شيء يُدار بكلاس واحد على `<main>`: **`nav-active`**. بعدها الـ CSS transitions تتولى الباقي.

```js
$('.btn-hamburger').click(() => {
  $('main').toggleClass('nav-active');
  $('.btn-hamburger').toggleClass('active');
  // open  → scroll.stop()   (Locomotive)
  // close → scroll.start()
});
$('.fixed-nav-back').click(close);       // النقر على الخلفية
$(document).keydown(e => e.keyCode === 27 && close());  // Esc
```

### جدول الطبقات

| الطبقة | مغلق | مفتوح | المدة | المنحنى | تأخير |
|---|---|---|---|---|---|
| اللوحة `.fixed-nav` | `translateX(calc(100% + 6vw))` | `translateX(0)` | **800ms** | `cubic-bezier(.7, 0, .2, 1)` | — |
| الشفة `.rounded-div-wrap` | `width: 6vw` | `width: 0` | **850ms** | `cubic-bezier(.7, 0, .2, 1)` | — |
| العناصر `ul .btn` | `translateX(15vw)` | `translateX(0)` | **800ms** | نفس المنحنى | 0 / 30 / 60 / 90ms |
| الخلفية `.fixed-nav-back` | `opacity: 0` | `opacity: .35` | **800ms** | نفس المنحنى | — |
| أيقونة الزر | خطّان | X + أزرق | **250ms** (الخلفية) / **300ms** (الخطّان) | `(.36,0,.66,0)` / `(.7,0,.3,1)` | — |
| المحتوى الداخلي `.fixed-nav-inner` | `translateX(0)` | `translateX(0)` | 600ms | — | لا أثر على الديسكتوب |

> **ملاحظة مهمة:** الشفة أطول من اللوحة بـ 50ms. اللوحة تصل عند 800ms،
> والشفة تنتهي عند 850ms — أي أن الحافة تكون قد «استقامت» عملياً مع وصول اللوحة.

### 3.1 اللوحة `.fixed-nav`

```css
.fixed-nav {
  position: fixed;
  right: 0; top: 0;
  height: 100vh;
  width: auto;                    /* shrink-to-fit — يحددها المحتوى + الحشو */
  background: var(--color-dark);  /* #1C1D20 */
  z-index: 100;
  transform: translate(calc(100% + 6vw), 0) rotate(0.001deg);
  transition: transform .8s cubic-bezier(.7, 0, .2, 1);
  will-change: transform;
}
.nav-active .fixed-nav { transform: translate(0, 0) rotate(0.001deg); }
```

- **العرض ليس نسبة مئوية**: `right: 0` + `width: auto` = shrink-to-fit.
  - مقيس: **644.4px** عند 1920، و**540.5px** عند 1440.
  - الحشو الداخلي: `15vh 7.5vw 10vh` (عند 1920 = 162px / 144px / 108px).
- `+ 6vw` في الحالة المغلقة **ليست قيمة عشوائية**: تساوي عرض الشفة بالكامل،
  فالشفة نفسها تخرج من الشاشة أيضاً عند الإغلاق.
- `rotate(0.001deg)` حيلة معروفة لمنع blur في بعض المتصفحات عند التحويلات.

### 3.2 الحافة المستديرة — المفتاح

```css
.fixed-nav-rounded-div {
  position: absolute;
  left: 1px;
  transform: translateX(-100%);   /* تلتصق بالحافة اليسرى للوحة */
  height: 100%;
}

.fixed-nav-rounded-div .rounded-div-wrap {
  width: 6vw;                     /* 115.2px @1920 */
  height: 100%;
  transition: all .85s cubic-bezier(.7, 0, .2, 1);
  will-change: width;
}
.nav-active .fixed-nav-rounded-div .rounded-div-wrap { width: 0vw; }

.fixed-nav-rounded-div .rounded-div-wrap .rounded-div {
  background: var(--color-dark);
  width: 775%;                    /* 46.5vw */
  height: 150%;
  position: absolute;
  top: 50%;
  border-radius: 50%;             /* قطع ناقص ضخم */
  transform: translate(-6.5%, -50%);
}
```

**كيف تعمل فعلياً (لا clip-path):**

1. عند الإغلاق: اللوحة + شفة بعرض `6vw` خارج الشاشة يميناً.
2. عند الفتح: اللوحة تنزلق، والشفة تدخل معها. داخل الشفة **قطع ناقص** بعرض
   `775%` من عرضها (≈ 46.5vw) وارتفاع `150%` و`border-radius: 50%`، لونه نفس لون اللوحة.
3. حواف هذا القطع الناقص هي التي تراها كـ **حافة مقوّسة** للوحة.
4. الشفة تنكمش من `6vw` إلى `0`، فينكمش القطع الناقص معها حتى يختفي،
   وتبقى حافة اللوحة **مستقيمة**.

النتيجة البصرية: «لوحة بحافة دائرية تدخل ثم تستقيم» — منحنى، لا قصّ.

الصورة: `03-open-mid.png` (تم تصويرها بتبطيء الحركة 6× لعرض الشكل).

### 3.3 العناصر

```css
.fixed-nav .nav-row ul .btn {
  transform: translate(15vw, 0) rotate(0.001deg);
  transition: all .8s cubic-bezier(.7, 0, .2, 1);
}
.nav-active .fixed-nav .nav-row ul .btn { transform: translate(0, 0) rotate(0.001deg); }

.fixed-nav .nav-row ul .btn:nth-child(2) { transition-delay: .03s; }
.fixed-nav .nav-row ul .btn:nth-child(3) { transition-delay: .06s; }
.fixed-nav .nav-row ul .btn:nth-child(4) { transition-delay: .09s; }
```

- العناصر تأتي من اليمين بمسافة **15vw (288px)** وتتبع نفس منحنى اللوحة.
- **stagger 30ms** بين كل عنصر — مقيس بالطريقة نفسها: العنصر الرابع يصل عند ~905ms.
- الترتيب: `Home · Work · About · Contact`، والعنصر النشط عليه نقطة بيضاء صغيرة
  (`::after` بعرض ≈ 10.7px) على يساره.

### 3.4 المحتوى

| العنصر | القيمة المقيسة @1920 |
|---|---|
| عنوان القسم `NAVIGATION` | 11.4px، `letter-spacing: .57px`، لون باهت |
| خط القسم | `1px` عرض كامل |
| حجم روابط المنيو | **66.5px** / line-height **93.1px** |
| CSS الأصلي | `calc(clamp(3.25em, 5vw, 4em) * .875)`، `line-height: 1.4` |
| حشو القائمة | `padding-top: 5vh` = 54px |
| السوشيال | 19px، في أسفل اللوحة (`space-between`) |
| ترتيب الداخل | `flex column` + `justify-content: space-between` |

### 3.5 الخلفية

```css
.fixed-nav-back {
  background: linear-gradient(to right,
    hsla(220, 13%, 0%, .3) 40%,
    hsla(220, 13%, 0%, 1) 80%);
  opacity: 0;
  transition: opacity .8s cubic-bezier(.7, 0, .2, 1);
  z-index: 100;
  pointer-events: none;
}
.nav-active .fixed-nav-back { opacity: .35; pointer-events: all; }
```

- التدرّج نفسه فيه شفافية، وعليه `opacity: .35` — فاليمين (حيث اللوحة)
  يصبح داكناً تدريجياً بلا خط فاصل بين الخلفية واللوحة.
- الخلفية `position: absolute` بارتفاع المستند كامل، وليست `fixed` —
  لا مشكلة لأن الاسكرول متوقف أثناء الفتح.

### 3.6 الزر أثناء الفتح

```css
.btn-hamburger.active .btn-click        { background-color: var(--color-blue); } /* #455CE9 */
.btn-hamburger.active .btn-bars::before { top: 50%; transform: translate(-50%,-50%) rotate(-45deg); }
.btn-hamburger.active .btn-bars::after  { top: 50%; transform: translate(-50%,-50%) rotate(45deg); }
```

مقيس: الخلفية `#1C1D20 → #455CE9` في ~250ms، والخطّان يتحولان إلى X في ~300ms.
الزر **يبقى دائرياً** ولا يتحرك من مكانه — نفس الزر يفتح ويقفل.

---

## 4. السلوك أثناء الفتح

| السلوك | التنفيذ |
|---|---|
| قفل الاسكرول | `scroll.stop()` (Locomotive) — لا حركة للخلفية |
| Esc | يعمل (keydown 27) |
| النقر على الخلفية | يقفل |
| التنقل لصفحة أخرى | `barba.hooks.leave` يزيل `nav-active` |
| focus trap | ❌ غير موجود |
| `role="dialog"` / `aria-expanded` | ❌ غير موجود |
| إعادة الفوكس للزر | ❌ غير موجود |
| `prefers-reduced-motion` | ❌ غير مدعوم |

---

## 5. الإغلاق — نفس الحركة معكوسة

لا يوجد كود إغلاق. إزالة `nav-active` تعيد كل الخصائص إلى قيمها الأصلية،
والـ CSS transitions تعكس المسار بنفس المدد والمنحنيات.

قياسات فعلية (ms من لحظة الضغط):

| t | اللوحة X | الشفة | العناصر (4) | الخلفية |
|---|---|---|---|---|
| 0 | 0 | 0 | 0,0,0,0 | .35 |
| 200 | 39 | 5 | 15,10,6,3 | .33 |
| 400 | 402 | 48 | 152,110,76,53 | .16 |
| 600 | 724 | 107 | 275,269,262,253 | .016 |
| 800 | 759.6 | 114.9 | 288,288,288,285 | 0 |
| 880 | 759.6 | 115.2 | 288,288,288,288 | 0 |

**لاحظ:** العناصر تتأخر عن اللوحة قليلاً عند الإغلاق لأنها تبدأ من `0` وتعود
إلى `288px` مع نفس الـ stagger، فآخر عنصر يصل عند ~905ms — أي الإحساس
بالعكس «مضبوط» لكنه ليس مرآة رياضية دقيقة.

---

## 6. الموبايل (≤ 540px)

```css
@media (max-width: 540px) {
  .fixed-nav {
    width: 100%;
    transform: translate(calc(100% + 20vw), 0);
  }
  .fixed-nav .fixed-nav-inner {
    transform: translate(20vw, 0);
    transition-delay: 0s;
  }
  .nav-active .fixed-nav .fixed-nav-inner {
    transform: translate(0, 0);
    transition-delay: .1s;
  }
  .fixed-nav-back { background: hsla(220, 13%, 5%, 1); }  /* لون صلب */
}
```

- اللوحة تغطي **100%** من العرض.
- الداخل يتحرك **20vw إضافية** ثم يستقر — حركة مزدوجة (parallax) تعطي عمقاً.
- تأخير **100ms** للداخل عند الفتح فقط؛ عند الإغلاق يبدأ فوراً.
- الخلفية تصبح لوناً صلباً بدل التدرّج.

---

## 7. الأرقام المرجعية @1920×1080

| القيمة | القياس |
|---|---|
| عرض اللوحة | 644.4px (auto) |
| إزاحة الإغلاق | 759.6px = 644.4 + 115.2 |
| الشفة | 6vw = 115.2px |
| القطع الناقص | 893 × 1621px، radius 50%، إزاحة (-6.5%, -50%) |
| إزاحة العناصر | 15vw = 288px |
| زر القائمة | 95px، على بعد 31.67px من الأعلى واليمين |
| اللوحة المفتوحة | تبدأ عند x = 1275.6 |
| حد ظهور الزر | 324px اسكرول |
| ألوان | `#1C1D20` داكن، `#455CE9` أزرق، أبيض |

---

## 8. ما ننقله وما نغيّره في مشروعنا

### ننقل كما هو
1. **حد الـ 30%** لظهور الزر (بسيط، متوقع، ولا يزاحم الهيرو).
2. **spring overshoot** عند ظهور الزر.
3. **حركة الطبقتين**: اللوحة + الشفة المقوّسة تنكمش → استقامة.
4. **`+ 6vw` في الإغلاق** — بدونها تظهر الشفة قبل دخول اللوحة.
5. **stagger 30ms** واتجاه واحد للعناصر.
6. **`space-between`** داخل اللوحة: تنقّل أعلى، سوشيال أسفل.
7. **تدرّج الخلفية** الذي يندمج مع لون اللوحة.
8. **قفل الاسكرول** وEsc والنقر على الخلفية.

### نغيّر (لأن الأصل فيه ثغرات أو لا يناسب Next/AR)

| المشكلة في الأصل | عندنا |
|---|---|
| `<div>` قابل للنقر، بلا `role`/`aria` | `<button aria-expanded aria-controls>` حقيقي |
| لا focus trap، ولا إعادة فوكس | `<dialog>` + `showModal()` — trap و Esc و inert مجاناً |
| لا `prefers-reduced-motion` | صفر مدة + بلا stagger + بلا spring |
| عرض اللوحة auto | `clamp(420px, 34vw, 680px)` — النص العربي أطول من الإنجليزي |
| اللوحة من اليمين دائماً | في RTL تنعكس الجهة (`inset-inline-end` + إشارة `translateX`) |
| jQuery + Locomotive | GSAP 3.15 + قفل `overflow` (+ `scrollbar-gutter: stable`) |
| الهيرو يستمر بالرندر خلف المنيو | إشارة `menuOpen` توقف scene |
| الأيقونة بلا label | `<span class="sr-only">` + `aria-label` |
| موضع الزر ثابت 31.67px | `inset-block-start: max(1rem, env(safe-area-inset-top))` |

### نقطة قرار مفتوحة
روابط الهيدر في الأصل تختفي بالكامل لأنها داخل الهيدر. في موقع متعدد الصفحات
لازم نقرر: هل زر القائمة يظهر بعد 30% في **كل** الصفحات، أم يظهر دائماً في
الصفحات الداخلية؟ (يُحسم عند تصميم الـ IA.)

---

## 9. كيف تم الفحص

```bash
gsd-browser --session dennis navigate https://dennissnellenberg.com/
gsd-browser --session dennis eval '<sample computed styles over rAF>'
gsd-browser --session dennis screenshot --output ...
```

- تم تسجيل عينات `requestAnimationFrame` كل إطار لمدة 1.5s أثناء الفتح وأثناء الإغلاق،
  وقراءة `DOMMatrixReadOnly` لتحويلات كل طبقة.
- تمت قراءة `styleguide.css` و`style-new.css` و`index-new.js` المنشورة للتأكد من القيم.
- لتصوير الحافة المقوّسة، تم تبطيء الحركة 6× مؤقتاً من داخل الصفحة (حقن `<style>`)
  ثم التصوير عند ~28% من الزمن.

## 10. الصور

| الملف | الحالة |
|---|---|
| `01-desktop-top.png` | أعلى الصفحة — روابط ظاهرة، زر مخفي |
| `02-desktop-burger.png` | بعد الاسكرول — الزر الدائري |
| `03-open-mid.png` | منتصف الفتح — الحافة المقوّسة واضحة |
| `04-open.png` | الفتح الكامل |
