// 1. Безопасная отправка события
function sendEvent(name, params) {
  if (typeof gtag !== 'function') return;
  const safeParams = {};
  Object.keys(params || {}).forEach(function (key) {
    const value = String(params[key] ?? '')
    safeParams[key] = (typeof params[key] === 'boolean') ? params[key] : value.slice(0, 100);
  });
  gtag('event', name, safeParams);
}
  
  // 2. Делегирование кликов по элементам с data-event
  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-event]');
    if (!target) return;
    const eventName = target.dataset.event;
    if (!eventName) return;
  
    const params = {};
    Object.keys(target.dataset).forEach(function (key) {
      if (key === 'event') return;
      const paramName = key.replace(/[A-Z]/g, function (m) {
        return '_' + m.toLowerCase();
      });
      params[paramName] = target.dataset[key];
    });
  
    sendEvent(eventName, params);
  });я