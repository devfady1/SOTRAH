/**
 * Google Tag Manager (DataLayer) Universal Analytics Helper
 * آمن وخالي من البيانات الشخصية (No PII)
 */

export function pushToDataLayer(eventName, eventParams = {}) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
}

export function trackWhatsAppClick(linkUrl = '') {
  pushToDataLayer('whatsapp_click', { link_url: linkUrl });
}

export function trackFormSubmit(formId = 'contact_form') {
  pushToDataLayer('form_submit', { form_id: formId });
}

export function trackBookingDone(specialty = 'general') {
  pushToDataLayer('book_consultation', { specialty });
}
