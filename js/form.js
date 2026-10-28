// 1. ЗАМЕНИ на URL своего веб-приложения Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQXMXM5yMaDshZdMs_1RlDcml7nDGD6pPPM-uPrOcRHd5ZlnQxwop3lsXkM5arB-s5IQ/exec';

// 2. Ключи UTM, которые сохраняем
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

// ========== UTM ==========

// 3. Чтение меток из адреса страницы
function readUtmFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  UTM_KEYS.forEach(function (key) {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  return utm;
}

// 4. Сохранение меток в sessionStorage
function saveUtm(utm) {
  if (Object.keys(utm).length === 0) return;
  try {
    sessionStorage.setItem('utm', JSON.stringify(utm));
  } catch (e) { /* приватный режим — молча выходим */ }
}

// 5. Восстановление меток: сначала из адреса, потом из sessionStorage
function getUtm() {
  const fromUrl = readUtmFromUrl();
  if (Object.keys(fromUrl).length > 0) {
    saveUtm(fromUrl);
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem('utm');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

// ========== request_id ==========

// 6. Генерация уникального request_id вида REQ-<UUID>
function generateRequestId() {
  if (crypto.randomUUID) {
    return 'REQ-' + crypto.randomUUID();
  }
  return 'REQ-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

// ========== нормализация телефона ==========

// 7. Приводим телефон к формату +7XXXXXXXXXX
function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '8') {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 11 && digits[0] === '7') {
    return '+' + digits;
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  return raw; // если не смогли — вернём как есть, сервер отклонит
}

// ========== показ ошибок ==========

// 8. Показать ошибку у поля
function showFieldError(fieldName, message) {
  const input = document.querySelector('[name="' + fieldName + '"]');
  const errorEl = document.querySelector('[data-error-for="' + fieldName + '"]');
  if (input) input.classList.add('error');
  if (errorEl) errorEl.textContent = message;
}

// 9. Очистить все ошибки
function clearErrors() {
  document.querySelectorAll('.form__input.error, .form__select.error').forEach(function (el) {
    el.classList.remove('error');
  });
  document.querySelectorAll('.form__error').forEach(function (el) {
    el.textContent = '';
  });
}

// 10. Общая ошибка формы
function showGlobalError(message) {
  const el = document.getElementById('form-global-error');
  if (el) el.textContent = message;
}

// ========== флажок "Мне есть 18 лет" ==========

// 11. Показ/скрытие флажка в зависимости от роли
function setupAdultCheckbox() {
  const roleSelect = document.getElementById('lead_role');
  const adultField = document.getElementById('adult-field');
  const adultCheckbox = document.getElementById('adult');
  if (!roleSelect || !adultField || !adultCheckbox) return;

  function update() {
    const isStudent = roleSelect.value === 'student';
    adultField.hidden = !isStudent;
    adultCheckbox.required = isStudent;
    if (!isStudent) adultCheckbox.checked = false;
  }

  roleSelect.addEventListener('change', update);
  update(); // при загрузке
}

// ========== валидация ==========

// 12. Проверка формы перед отправкой
function validateForm(form) {
  clearErrors();
  let valid = true;

  const name = form.name.value.trim();
  if (name.length < 2 || name.length > 60) {
    showFieldError('name', 'Введите имя от 2 до 60 символов');
    valid = false;
  }

  const phone = normalizePhone(form.phone.value);
  if (!/^\+7\d{10}$/.test(phone)) {
    showFieldError('phone', 'Введите телефон в формате +7 (999) 123-45-67');
    valid = false;
  }

  if (form.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim())) {
    showFieldError('email', 'Проверьте формат e-mail');
    valid = false;
  }

  if (!form.lead_role.value) {
    showFieldError('lead_role', 'Выберите, кто оставляет заявку');
    valid = false;
  }

  if (!form.subject.value) {
    showFieldError('subject', 'Выберите предмет');
    valid = false;
  }

  if (!form.grade.value) {
    showFieldError('grade', 'Выберите класс');
    valid = false;
  }

  if (form.lead_role.value === 'student' && !form.adult.checked) {
    showFieldError('adult', 'Без этого флажка заявку должен оставить родитель');
    valid = false;
  }

  if (!form.consent.checked) {
    showFieldError('consent', 'Без согласия на обработку данных заявка не отправится');
    valid = false;
  }

  return { valid: valid, phone: phone };
}

// ========== отправка ==========

// 13. Основной обработчик
async function onSubmit(e) {
  e.preventDefault();
  clearErrors();
  showGlobalError('');

  const form = e.target;
  const btn = document.getElementById('submit-btn');

  const check = validateForm(form);
  if (!check.valid) {
    sendEvent('form_error', { field_name: 'form', error_type: 'client' });
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Отправляем…';

  const data = {
    request_id: generateRequestId(),
    name: form.name.value.trim(),
    phone: check.phone,
    email: form.email.value.trim(),
    lead_role: form.lead_role.value,
    subject: form.subject.value,
    grade: form.grade.value,
    ...getUtm()
  };

  try {
    // Отправляем данные в режиме no-cors
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // <--- ВОТ ЭТО ГЛАВНОЕ
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
  
    // Поскольку в режиме no-cors мы не можем прочитать ответ (response.json()),
    // мы предполагаем, что если запрос не упал с ошибкой сети, то данные ушли.
    
    // Сохраняем номер и переходим на thanks.html
    sessionStorage.setItem('request_id', data.request_id);
    sessionStorage.setItem('lead_subject', data.subject);
    
    // Отправляем событие в GA4 (оно у нас уже работает)
    sendEvent('generate_lead', {
      lead_subject: data.subject,
      lead_role: data.lead_role,
      lead_source: data.utm_source || 'direct',
      conversion: true
    });
    
    window.location.href = 'thanks.html';
  
  } catch (err) {
    // Сюда мы попадем только если реально пропал интернет
    showGlobalError('Сетевая ошибка. Проверьте интернет и попробуйте ещё раз.');
    sendEvent('form_error', { field_name: 'form', error_type: 'network' });
  } finally {
    btn.disabled = false;
    btn.textContent = 'Записаться на пробник';
  }
} // <--- ВОТ ЗДЕСЬ БЫЛА ОШИБКА, ТЕПЕРЬ ВСЁ ЗАКРЫТО ПРАВИЛЬНО

// ========== инициализация ==========

// 14. Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
  setupAdultCheckbox();
  const form = document.getElementById('lead-form');
  if (form) form.addEventListener('submit', onSubmit);

  // При первом взаимодействии с формой GA4 сам отправит form_start
});