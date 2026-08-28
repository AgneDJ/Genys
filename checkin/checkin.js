/*
  Front-end prototype settings. Before publishing, move validation and record
  storage to a server-side endpoint. Client-side values must never be relied on
  as security controls for a production attendance register.
*/
const QR_ACCESS_TOKEN = 'sf-genys-entry';
const DEMO_FAMILY_PIN = '2026';
const STORAGE_KEY = 'sf-genys-attendance-records';

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
  error.textContent = '';
  show('register-screen');
});

const canvas = document.getElementById('signature-canvas');
const context = canvas.getContext('2d');
let signing = false;
let hasSignature = false;
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const image = hasSignature ? canvas.toDataURL() : null;
  canvas.width = canvas.offsetWidth * ratio; canvas.height = canvas.offsetHeight * ratio;
  context.scale(ratio, ratio); context.lineWidth = 2; context.lineCap = 'round'; context.strokeStyle = '#1d3156';
  if (image) { const saved = new Image(); saved.onload = () => context.drawImage(saved, 0, 0, canvas.offsetWidth, canvas.offsetHeight); saved.src = image; }
}
resizeCanvas(); window.addEventListener('resize', resizeCanvas);
function point(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
canvas.addEventListener('pointerdown', event => { signing = true; hasSignature = true; canvas.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); });
canvas.addEventListener('pointermove', event => { if (!signing) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); });
canvas.addEventListener('pointerup', () => signing = false); canvas.addEventListener('pointercancel', () => signing = false);
document.getElementById('clear-signature').addEventListener('click', () => { context.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; });

document.querySelectorAll('input[name="action"]').forEach(input => input.addEventListener('change', () => {
  document.getElementById('submit-action').textContent = input.value.toLowerCase();
}));
document.getElementById('attendance-form').addEventListener('submit', event => {
  event.preventDefault();
  const signatureError = document.getElementById('signature-error');
  if (!hasSignature) { signatureError.textContent = 'Please add your signature before confirming.'; return; }
  signatureError.textContent = '';
  const form = new FormData(event.currentTarget);
  const now = new Date();
  const record = { id: crypto.randomUUID(), timestamp: now.toISOString(), child: form.get('child'), action: form.get('action'), guardian: `${form.get('guardianFirst')} ${form.get('guardianLast')}`, signature: canvas.toDataURL('image/png') };
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  records.push(record); localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  document.getElementById('success-child').textContent = record.child;
  document.getElementById('success-detail').textContent = `${record.action === 'DROP OFF' ? 'Dropped off' : 'Picked up'} at ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(now)} by ${record.guardian}.`;
  event.currentTarget.reset(); document.querySelector('input[name="action"][value="DROP OFF"]').checked = true;
  document.getElementById('submit-action').textContent = 'drop off'; context.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false;
  show('success-screen');
});
function endSession() { sessionStorage.removeItem(sessionKey); location.href = location.pathname; }
document.getElementById('end-session').addEventListener('click', endSession);
document.getElementById('finish-session').addEventListener('click', endSession);
document.getElementById('new-entry').addEventListener('click', () => show('register-screen'));
