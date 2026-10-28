/**
 * Приёмник заявок для сайта «Высший балл»
 * ТЗ-23/2026, раздел 6.2
 */

// 1. ID таблицы (замени на свой)
const SHEET_ID = '1Ec1HWCRFIAn-RUO8aK49r9VA9y6sAeJ9nGJa_UTdWdA';
const SHEET_NAME = 'leads';

// 2. Точка входа для POST-запросов
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // 3. Парсим тело запроса
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'empty_request' }, headers);
    }
    const data = JSON.parse(e.postData.contents);

    // 4. Валидация
    const validation = validate(data);
    if (!validation.ok) {
      return jsonResponse({ ok: false, error: validation.error, field: validation.field }, headers);
    }

    // 5. Открываем таблицу
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ ok: false, error: 'sheet_not_found' }, headers);
    }

    // 6. Проверка дубликата по request_id
    if (isDuplicate(sheet, data.request_id)) {
      return jsonResponse({ ok: false, error: 'duplicate_request_id', field: 'request_id' }, headers);
    }

    // 7. Дописываем строку
    sheet.appendRow([
      data.request_id,
      new Date(),
      data.name,
      data.phone,
      data.email || '',
      data.lead_role,
      data.subject,
      data.grade,
      data.utm_source || 'direct',
      data.utm_medium || 'none',
      data.utm_campaign || 'not_set',
      data.utm_content || 'not_set',
      'new' // Статус ставит только скрипт!
    ]);

    // 8. Успешный ответ
    return jsonResponse({ ok: true }, headers);

  } catch (err) {
    // 9. Любая ошибка сервера
    return jsonResponse({ ok: false, error: 'server_error', details: err.toString() }, headers);
  }
}

// Валидация данных формы
function validate(data) {
  const required = ['request_id', 'name', 'phone', 'lead_role', 'subject', 'grade'];
  for (let i = 0; i < required.length; i++) {
    const field = required[i];
    if (!data[field] || String(data[field]).trim() === '') {
      return { ok: false, error: 'required_field', field: field };
    }
  }

  for (const key in data) {
    if (data[key] && String(data[key]).length > 200) {
      return { ok: false, error: 'too_long', field: key };
    }
  }

  if (!/^\+7\d{10}$/.test(data.phone)) {
    return { ok: false, error: 'invalid_phone', field: 'phone' };
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: 'invalid_email', field: 'email' };
  }

  const allowed = {
    lead_role: ['student', 'parent'],
    subject: ['math_profile', 'math_base', 'russian', 'informatics', 'social', 'physics', 'english'],
    grade: ['9', '10', '11', 'graduate']
  };
  for (const key in allowed) {
    if (allowed[key].indexOf(data[key]) === -1) {
      return { ok: false, error: 'invalid_value', field: key };
    }
  }

  return { ok: true };
}

// Проверка дубликата по request_id (ищем в столбце A)
function isDuplicate(sheet, requestId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === requestId) return true;
  }
  return false;
}

// Формирование JSON-ответа
function jsonResponse(obj, headers) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ЭТУ ФУНКЦИЮ НУЖНО ЗАПУСТИТЬ ОДИН РАЗ ИЗ РЕДАКТОРА APPS SCRIPT
function setupSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('Ошибка: лист "' + SHEET_NAME + '" не найден. Создай его.');
    return;
  }

  const headers = [
    'request_id', 'created_at', 'name', 'phone', 'email',
    'lead_role', 'subject', 'grade',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
    'status'
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F5F7FB');
    sheet.setFrozenRows(1);
  }

  const statusRange = sheet.getRange('M2:M1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['new', 'contacted', 'registered', 'mock_done', 'paid', 'lost'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);

  const requiredColumns = ['C', 'D', 'F', 'G', 'H'];
  requiredColumns.forEach(function(col) {
    const range = sheet.getRange(col + '2:' + col + '1000');
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($A2<>"", ' + col + '2="")')
      .setBackground('#FAD2CF')
      .setRanges([range])
      .build();
    const rules = sheet.getConditionalFormatRules();
    rules.push(rule);
    sheet.setConditionalFormatRules(rules);
  });

  const rangeA = sheet.getRange('A2:A1000');
  const ruleDuplicate = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=COUNTIF($A:$A, $A2) > 1')
    .setBackground('#FCE8B2')
    .setRanges([rangeA])
    .build();
  const rules = sheet.getConditionalFormatRules();
  rules.push(ruleDuplicate);
  sheet.setConditionalFormatRules(rules);

  Logger.log('Таблица настроена! Заголовки, списки и форматирование добавлены.');
}

// Обработка предварительного запроса браузера (CORS)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}