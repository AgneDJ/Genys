/*
  Front-end prototype settings. Before publishing, move validation and record
  storage to a server-side endpoint. Client-side values must never be relied on
  as security controls for a production attendance register.
*/
const QR_ACCESS_TOKEN = 'sf-genys-entry';
const DEMO_FAMILY_PIN = '2026';
const STORAGE_KEY = 'sf-genys-attendance-records';
const checkinConfig = window.CHECKIN_CONFIG || {};

const screens = ['invalid-access', 'pin-screen', 'register-screen', 'success-screen'];
const show = id => screens.forEach(screen => document.getElementById(screen).hidden = screen !== id);
const params = new URLSearchParams(location.search);
const hasQrAccess = params.get('access') === QR_ACCESS_TOKEN;
const sessionKey = 'sf-genys-checkin-authorized';
const translations = {
  lt: {
    brand: 'Registracija', accessTitle: 'Privatus mokyklos registras', accessCopy: 'Norėdami atidaryti šį puslapį, nuskenuokite atspausdintą mokyklos QR kodą.', pinEyebrow: 'TĖVŲ / GLOBĖJŲ PRISIJUNGIMAS', pinTitle: 'Sveiki atvykę į<br /><i>SF Genys</i>', pinCopy: 'Įveskite mokyklos suteiktą šeimos PIN kodą. Reikalingi ir QR kodas, ir PIN kodas.', pinLabel: 'Šeimos PIN kodas', continue: 'Tęsti <span>→</span>', pinHelp: 'Reikia pagalbos? Kreipkitės į mokyklos darbuotoją.', registerEyebrow: 'SF GENYS · LANKOMUMAS', registerTitle: 'Atvykimas ar<br /><i>išvykimas</i>', actionLegend: '', drop: 'Atvykimas', pickup: 'Išvykimas', child: 'Vaikas', childPlaceholder: 'Pasirinkite vaiko vardą', schoolClass: 'Klasė', classPlaceholder: 'Pasirinkite klasę', guardianFirst: 'Pasiėmė:', guardianLast: 'Globėjo pavardė', signature: 'Parašas', clear: 'Išvalyti', signatureHint: 'Pasirašykite čia', confirm: 'Patvirtinti:', endSession: 'Baigti saugų seansą', saved: 'ĮRAŠAS IŠSAUGOTAS', newEntry: 'Naujas įrašas <span>→</span>', finish: 'Baigti', privacy: 'Skirta tik mokyklos lankomumo apskaitai. Nesidalykite QR kodu ar PIN kodu.', invalidPin: 'PIN kodas neatpažintas. Bandykite dar kartą.', required: 'Pasirinkite vaiko vardą ir klasę bei įveskite pasiėmusiojo vardą ir pavardę.', missingSignature: 'Prieš patvirtindami įrašą, pasirašykite.', unconnected: 'Mokyklos registras dar neprijungtas. Kreipkitės į mokyklos darbuotoją.', sendError: 'Įrašo nepavyko išsiųsti. Kreipkitės į mokyklos darbuotoją.', sending: 'Siunčiamas įrašas…', dropped: 'Atvyko', picked: 'Išvyko', by: 'Užregistravo'
  },
  en: {
    brand: 'School arrival register', accessTitle: 'Private school register', accessCopy: 'Please scan the printed school QR code to open this page.', pinEyebrow: 'PARENT / GUARDIAN ACCESS', pinTitle: 'Welcome to<br /><i>SF Genys</i>', pinCopy: 'Enter the family PIN provided by the school. The QR code and PIN are both required.', pinLabel: 'Family PIN', continue: 'Continue <span>→</span>', pinHelp: 'Need help? Please speak with a school staff member.', registerEyebrow: 'SF GENYS · PRIVATE REGISTER', registerTitle: 'Check in or<br /><i>check out</i>', actionLegend: 'What would you like to record?', drop: 'Drop off', pickup: 'Pick up', child: 'Child', childPlaceholder: 'Select child', schoolClass: 'Class / group', classPlaceholder: 'Select class', guardianFirst: 'Guardian first name', guardianLast: 'Guardian last name', signature: 'Signature', clear: 'Clear', signatureHint: 'Sign here', confirm: 'Confirm', endSession: 'End secure session', saved: 'RECORD SAVED', newEntry: 'New entry <span>→</span>', finish: 'Finish', privacy: 'For school attendance records only. Do not share the QR code or family PIN.', invalidPin: 'That PIN is not recognised. Please try again.', required: 'Please select the child and class/group, and enter the guardian’s name.', missingSignature: 'Please add your signature before confirming.', unconnected: 'The school register is not connected yet. Please ask a staff member for help.', sendError: 'Your entry could not be sent. Please ask a staff member for help.', sending: 'Sending entry…', dropped: 'Dropped off', picked: 'Picked up', by: 'by'
  }
};
let language = localStorage.getItem('sf-genys-checkin-language') || 'lt';
const text = key => translations[language][key];
const setText = (id, value) => document.getElementById(id).innerHTML = value;
function actionLabel(action) { return action === 'DROP OFF' ? text('drop') : text('pickup'); }
function updateConfirmButton() {
  const action = document.querySelector('input[name="action"]:checked').value;
  document.getElementById('confirm-attendance').innerHTML = `${text('confirm')} <span id="submit-action">${actionLabel(action).toLowerCase()}</span> <span>→</span>`;
}
function renderDate() {
  document.getElementById('current-date').textContent = new Intl.DateTimeFormat(language === 'lt' ? 'lt-LT' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
}
function applyLanguage(nextLanguage) {
  language = nextLanguage; localStorage.setItem('sf-genys-checkin-language', language); document.documentElement.lang = language;
  const copy = { 'brand-title': 'brand', 'access-title': 'accessTitle', 'access-copy': 'accessCopy', 'pin-eyebrow': 'pinEyebrow', 'pin-title': 'pinTitle', 'pin-copy': 'pinCopy', 'pin-label': 'pinLabel', 'pin-continue': 'continue', 'pin-help': 'pinHelp', 'register-eyebrow': 'registerEyebrow', 'register-title': 'registerTitle', 'drop-label': 'drop', 'pickup-label': 'pickup', 'child-label': 'child', 'child-placeholder': 'childPlaceholder', 'class-label': 'schoolClass', 'class-placeholder': 'classPlaceholder', 'guardian-first-label': 'guardianFirst', 'guardian-last-label': 'guardianLast', 'signature-label': 'signature', 'clear-signature': 'clear', 'signature-hint': 'signatureHint', 'end-session': 'endSession', 'saved-eyebrow': 'saved', 'new-entry': 'newEntry', 'finish-session': 'finish', 'privacy-note': 'privacy' };
  Object.entries(copy).forEach(([id, key]) => setText(id, text(key)));
  document.querySelectorAll('#school-class option[data-lt]').forEach(option => option.textContent = option.dataset[language]);
  document.getElementById('signature-canvas').setAttribute('aria-label', language === 'lt' ? 'Pasirašykite pirštu arba pele' : 'Sign here using your finger or mouse');
  document.querySelectorAll('[data-language]').forEach(button => button.classList.toggle('active', button.dataset.language === language));
  renderDate(); updateConfirmButton();
}

if (!hasQrAccess) show('invalid-access');
else if (sessionStorage.getItem(sessionKey) === 'yes') show('register-screen');
else show('pin-screen');

applyLanguage(language);
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language)));

document.getElementById('pin-form').addEventListener('submit', event => {
  event.preventDefault();
  const pin = document.getElementById('family-pin').value.trim();
  const error = document.getElementById('pin-error');
  if (pin !== DEMO_FAMILY_PIN) { error.textContent = text('invalidPin'); return; }
  sessionStorage.setItem(sessionKey, 'yes');
  sessionStorage.setItem('sf-genys-checkin-pin', pin);
  error.textContent = '';
  show('register-screen');
  requestAnimationFrame(resizeCanvas);
});

const canvas = document.getElementById('signature-canvas');
const context = canvas.getContext('2d');
let signing = false;
let hasSignature = false;
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const image = hasSignature ? canvas.toDataURL() : null;
  canvas.width = Math.max(1, canvas.offsetWidth * ratio); canvas.height = Math.max(1, canvas.offsetHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0); context.lineWidth = 2; context.lineCap = 'round'; context.strokeStyle = '#1d3156';
  if (image) { const saved = new Image(); saved.onload = () => context.drawImage(saved, 0, 0, canvas.offsetWidth, canvas.offsetHeight); saved.src = image; }
}
resizeCanvas(); window.addEventListener('resize', resizeCanvas);
// The form can be hidden on page load, so size the drawing surface after it appears.
if (!document.getElementById('register-screen').hidden) requestAnimationFrame(resizeCanvas);
function point(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function beginSignature(event) {
  event.preventDefault(); signing = true; hasSignature = true;
  if (event.pointerId !== undefined) canvas.setPointerCapture?.(event.pointerId);
  const p = point(event); context.beginPath(); context.moveTo(p.x, p.y);
  context.arc(p.x, p.y, 1, 0, Math.PI * 2); context.fillStyle = context.strokeStyle; context.fill();
}
function continueSignature(event) {
  if (!signing) return; event.preventDefault(); const p = point(event); context.lineTo(p.x, p.y); context.stroke();
}
function endSignature(event) {
  signing = false;
  if (event?.pointerId !== undefined && canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}
canvas.addEventListener('pointerdown', beginSignature); canvas.addEventListener('pointermove', continueSignature);
canvas.addEventListener('pointerup', endSignature); canvas.addEventListener('pointercancel', endSignature);
// Fallback for older mobile browsers that do not emit Pointer Events.
canvas.addEventListener('touchstart', event => { const touch = event.touches[0]; beginSignature({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => event.preventDefault() }); }, { passive: false });
canvas.addEventListener('touchmove', event => { const touch = event.touches[0]; continueSignature({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => event.preventDefault() }); }, { passive: false });
canvas.addEventListener('touchend', endSignature);
document.getElementById('clear-signature').addEventListener('click', () => { context.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; });

document.querySelectorAll('input[name="action"]').forEach(input => input.addEventListener('change', () => {
  updateConfirmButton();
}));
function submitToReceiver(record) {
  const receiverForm = document.createElement('form');
  receiverForm.method = 'POST';
  receiverForm.action = checkinConfig.endpoint;
  receiverForm.target = 'attendance-receiver';
  receiverForm.hidden = true;
  const payload = document.createElement('input');
  payload.type = 'hidden'; payload.name = 'payload'; payload.value = JSON.stringify(record);
  receiverForm.appendChild(payload); document.body.appendChild(receiverForm);
  receiverForm.submit(); receiverForm.remove();
}
document.getElementById('attendance-form').addEventListener('submit', async event => {
  event.preventDefault();
  const signatureError = document.getElementById('signature-error');
  const formElement = event.currentTarget;
  const submitButton = document.getElementById('confirm-attendance');
  if (!formElement.checkValidity()) {
    signatureError.textContent = text('required');
    formElement.reportValidity();
    return;
  }
  if (!hasSignature) { signatureError.textContent = text('missingSignature'); return; }
  signatureError.textContent = '';
  if (!checkinConfig.endpoint) {
    signatureError.textContent = text('unconnected');
    return;
  }
  const form = new FormData(formElement);
  const now = new Date();
  const record = { id: crypto.randomUUID(), timestamp: now.toISOString(), child: form.get('child'), schoolClass: form.get('schoolClass'), action: form.get('action'), guardian: `${form.get('guardianFirst')} ${form.get('guardianLast')}`, signature: canvas.toDataURL('image/png'), familyPin: sessionStorage.getItem('sf-genys-checkin-pin'), accessToken: params.get('access') };
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  records.push(record); localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  submitButton.disabled = true;
  submitButton.textContent = text('sending');
  try {
    submitToReceiver(record);
  } catch (error) {
    signatureError.textContent = text('sendError');
    submitButton.disabled = false;
    updateConfirmButton();
    return;
  }
  submitButton.disabled = false;
  updateConfirmButton();
  document.getElementById('success-child').textContent = record.child;
  document.getElementById('success-detail').textContent = `${record.action === 'DROP OFF' ? text('dropped') : text('picked')} ${new Intl.DateTimeFormat(language === 'lt' ? 'lt-LT' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(now)} ${text('by')} ${record.guardian}.`;
  formElement.reset(); document.querySelector('input[name="action"][value="DROP OFF"]').checked = true;
  updateConfirmButton(); context.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false;
  show('success-screen');
});
function endSession() { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem('sf-genys-checkin-pin'); location.href = location.pathname; }
document.getElementById('end-session').addEventListener('click', endSession);
document.getElementById('finish-session').addEventListener('click', endSession);
document.getElementById('new-entry').addEventListener('click', () => { show('register-screen'); requestAnimationFrame(resizeCanvas); });
