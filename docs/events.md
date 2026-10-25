# Таблица событий GA4 (docs/events.md)

Все вызовы `gtag('event', ...)` находятся в файле `js/analytics.js`, кроме `generate_lead` и `form_error`, которые отправляются из `js/form.js` после ответа приёмника.

| № | Событие | Файл | Параметры (пример) |
|---|---|---|---|
| 1 | `page_view` | (авто GA4) | `page_location=https://...` |
| 2 | `scroll` | (авто GA4) | `percent_scrolled=90` |
| 3 | `click` | (авто GA4) | `link_url=https://...` |
| 4 | `file_download` | (авто GA4) | `file_name=program.pdf` |
| 5 | `form_start` | (авто GA4) | `form_id=lead-form` |
| 6 | `form_submit` | (авто GA4) | `form_id=lead-form` |
| 7 | `generate_lead` | `js/form.js:210` | `lead_subject=math_profile`, `lead_role=student`, `lead_source=instagram` |
| 8 | `cta_click` | `js/analytics.js` (делегирование) | `button_name=hero_trial`, `page_section=hero` |
| 9 | `subject_select` | `js/analytics.js` | `subject=informatics` |
| 10 | `results_filter` | `results.html` (скрипт) | `subject=russian`, `exam_year=2026` |
| 11 | `score_calc` | `score.html` (скрипт) | `subject=math_profile`, `primary_score=15`, `test_score=68` |
| 12 | `diagnostic_start` | `diagnostic.html` | `subject=math_profile` |
| 13 | `diagnostic_complete` | `diagnostic.html` | `subject=math_profile`, `score=8` |
| 14 | `select_tariff` | `js/analytics.js` | `tariff_name=group8`, `tariff_price=6400` |
| 15 | `contact_click` | `js/analytics.js` | `contact_type=phone` |
| 16 | `messenger_click` | `js/analytics.js` | `messenger=telegram` |
| 17 | `social_click` | `js/analytics.js` | `network=vk`, `page_section=footer` |
| 18 | `form_error` | `js/form.js:181` | `field_name=phone`, `error_type=client` |
| 19 | `teacher_view` | `js/analytics.js` | `teacher_id=t1`, `subject=math_profile` |
| 20 | `promo_copy` | `js/analytics.js` | `promo_code=BALL10` |