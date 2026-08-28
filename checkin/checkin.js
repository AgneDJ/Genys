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

if (!hasQrAccess) show('invalid-access');
else if (sessionStorage.getItem(sessionKey) === 'yes') show('register-screen');
else show('pin-screen');

const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
document.getElementById('current-date').textContent = dateFormatter.format(new Date());

document.getElementById('pin-form').addEventListener('submit', event => {
  event.preventDefault();
  const pin = document.getElementById('family-pin').value.trim();
  const error = document.getElementById('pin-error');
  if (pin !== DEMO_FAMILY_PIN) { error.textContent = 'That PIN is not recognised. Please try again.'; return; }
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
  document.getElementById('submit-action').textContent = input.value.toLowerCase();
}));
document.getElementById('attendance-form').addEventListener('submit', async event => {
  event.preventDefault();
  const signatureError = document.getElementById('signature-error');
  if (!hasSignature) { signatureError.textContent = 'Please add your signature before confirming.'; return; }
  signatureError.textContent = '';
  if (!checkinConfig.endpoint) {
    signatureError.textContent = 'The school register is not connected yet. Please ask a staff member for help.';
    return;
  }
  const form = new FormData(event.currentTarget);
  const now = new Date();
  const record = { id: crypto.randomUUID(), timestamp: now.toISOString(), child: form.get('child'), schoolClass: form.get('schoolClass'), action: form.get('action'), guardian: `${form.get('guardianFirst')} ${form.get('guardianLast')}`, signature: canvas.toDataURL('image/png'), familyPin: sessionStorage.getItem('sf-genys-checkin-pin'), accessToken: params.get('access') };
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  records.push(record); localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  try {
    await fetch(checkinConfig.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(record) });
  } catch (error) {
    signatureError.textContent = 'Your entry could not be sent. Please ask a staff member for help.';
    return;
  }
  document.getElementById('success-child').textContent = record.child;
  document.getElementById('success-detail').textContent = `${record.action === 'DROP OFF' ? 'Dropped off' : 'Picked up'} at ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(now)} by ${record.guardian}.`;
  event.currentTarget.reset(); document.querySelector('input[name="action"][value="DROP OFF"]').checked = true;
  document.getElementById('submit-action').textContent = 'drop off'; context.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false;
  show('success-screen');
});
function endSession() { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem('sf-genys-checkin-pin'); location.href = location.pathname; }
document.getElementById('end-session').addEventListener('click', endSession);
document.getElementById('finish-session').addEventListener('click', endSession);
document.getElementById('new-entry').addEventListener('click', () => { show('register-screen'); requestAnimationFrame(resizeCanvas); });
