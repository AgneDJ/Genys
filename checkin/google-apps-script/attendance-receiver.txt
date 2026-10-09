/* SF Genys attendance receiver — paste into Extensions > Apps Script in the
   provided Google Sheet. See README.md in this folder before deploying. */
// Keep this map private in Apps Script. Each PIN must match the selected child.
// Target: Lankomumas/Attendance. Update this ID only when changing the attendance document.
const SPREADSHEET_ID = '1T-T-EPUCfzy0hWExJkW3UJ2Z4J9inFyVO74LiydEbW0';

const CHILD_PINS = {
  'Miles': '1799',
  'Sara Kirtikar': '4992', 'Anouk Vala-Thiery (Anūkė)': '4792',
  'Percy Andrius Alexander (Persiukas)': '7140', 'Saulė Vierra': '4995',
  'Lukas Stempel': '6201', 'Emma Presswood': '0994',
  'Julius Djacenko': '8379', 'Emilija Burlingė': '6355',
  'Athena Bouzidi': '4087', 'Jonas Sebastian Laucys': '1792',
  'Ulla Putz': '4073', 'Melissa Jariga': '7726',
  'Marija Kudirka': '6046', 'Pranas Kudirka': '1347',
  'Aurelija Vierra': '1260', 'Emily Radlinski': '8858',
  'Karim Rapolas Ghassan El Chmaytilli (Karimas)': '0922',
  'Nida Kiaune': '5208', 'Julius Kudirka': '3950',
  'Noah Bouzidi': '3010', 'Melina Grivickas': '9234',
  'Mavi Grivickas': '8297', 'Jonas Aklifazla': '7117',
  'Arya Apke': '7694', 'Jordan Abudeab': '6389',
  'Christopher Radlinski': '7231', 'Akila Aklifazla': '1103',
  'Kalani Valverde': '1906', 'Nida Šukytė': '7171',
  'Ugnė Olivia Laučys': '6387', 'Amber Apke': '1009',
  'Arvydas Kudirka': '2102', 'Adam Abudeab': '8075',
  'Kintas Valverde': '0389'
};

function doGet(event) {
  const params = event && event.parameter || {};
  if (params.receipt) {
    if (!/^[a-f0-9-]{36}$/i.test(params.receipt) || !/^sfGenysReceipt_[A-Za-z0-9_]+$/.test(params.callback || '')) {
      return response_({ ok: false, error: 'Invalid confirmation request.' });
    }
    const saved = CacheService.getScriptCache().get('receipt_' + params.receipt);
    const result = saved ? JSON.parse(saved) : { receipt: params.receipt, pending: true };
    return ContentService.createTextOutput(params.callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return response_({ ok: true, version: 'four-digit-confirmed-v2', message: 'SF Genys attendance receiver is ready.' });
}

function doPost(event) {
  let record;
  let lock;
  try {
    const payload = event.parameter && event.parameter.payload ? event.parameter.payload : event.postData.contents;
    record = JSON.parse(payload);
    validateRecord_(record);
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const cache = CacheService.getScriptCache();
    const previous = cache.get('receipt_' + record.id);
    if (previous && JSON.parse(previous).ok === true) return response_({ ok: true });
    const timestamp = new Date(record.timestamp);
    const signature = signatureBlob_(record.signature, timestamp, record.child);
    appendToSheet_(record, timestamp, signature);
    SpreadsheetApp.flush();
    cache.put('receipt_' + record.id, JSON.stringify({ receipt: record.id, ok: true }), 600);
    return response_({ ok: true });
  } catch (error) {
    console.error(error);
    if (record && /^[a-f0-9-]{36}$/i.test(record.id || '')) {
      CacheService.getScriptCache().put('receipt_' + record.id, JSON.stringify({ receipt: record.id, ok: false, error: error.message }), 600);
    }
    return response_({ ok: false, error: error.message });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validateRecord_(record) {
  if (!/^[a-f0-9-]{36}$/i.test(record.id || '')) throw new Error('Missing record ID.');
  if (!/^\d{4}$/.test(String(record.familyPin || ''))) {
    throw new Error('Enter a four-digit PIN.');
  }

  if (!CHILD_PINS[record.child] || CHILD_PINS[record.child] !== String(record.familyPin || '')) {
    throw new Error('Incorrect PIN for selected child.');
  }
  ['timestamp', 'child', 'schoolClass', 'action', 'guardian', 'signature'].forEach(key => {
    if (!record[key]) throw new Error(`Missing ${key}.`);
  });
  if (!['DROP OFF', 'PICK UP'].includes(record.action)) throw new Error('Invalid action.');
  if (!record.signature.startsWith('data:image/png;base64,')) throw new Error('Invalid signature.');
}

function appendToSheet_(record, timestamp, signature) {
  const spreadsheet = attendanceSpreadsheet_();
  const sheetName = classSheetName_(record.schoolClass);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  prepareSheet_(sheet);
  const timezone = Session.getScriptTimeZone();
  sheet.appendRow([
    Utilities.formatDate(timestamp, timezone, 'yyyy-MM-dd'),
    Utilities.formatDate(timestamp, timezone, 'h:mm a'),
    record.child,
    record.schoolClass,
    record.action === 'DROP OFF' ? 'ATVYKIMAS' : 'IŠVYKIMAS',
    record.guardian,
    ''
  ]);
  const row = sheet.getLastRow();
  sheet.setRowHeight(row, 72);
  sheet.insertImage(signature, 7, row).setWidth(155).setHeight(60);
  sheet.autoResizeColumns(1, 7);
  sheet.setColumnWidth(7, 175);
}

function prepareSheet_(sheet) {
  const headers = ['Data', 'Laikas', 'Vaiko vardas', 'Klasė', 'Veiksmas', 'Tėvų/Globėjų vardas', 'Parašas'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else if (sheet.getRange(1, 1).getValue() === 'Date & time') {
    sheet.deleteColumn(1);
    translateExistingRows_(sheet);
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#dbe8ff');
  sheet.setFrozenRows(1);
}

function translateExistingRows_(sheet) {
  const rowCount = sheet.getLastRow() - 1;
  if (rowCount < 1) return;
  const values = sheet.getRange(2, 1, rowCount, 7).getValues();
  const classes = {
    'Preschool & kindergarten': 'Priešmokyklinė ir darželio klasė',
    'Grades 2–3': '2–3 klasė', 'Grade 4': '4 klasė', 'Grades 5–6': '5–6 klasė',
    'Grades 7–8': '7–8 klasė', 'Dance and song class': 'Šokių ir dainų klasė'
  };
  values.forEach(row => {
    row[3] = classes[row[3]] || row[3];
    row[4] = row[4] === 'DROP OFF' ? 'ATVYKIMAS' : row[4] === 'PICK UP' ? 'IŠVYKIMAS' : row[4];
  });
  sheet.getRange(2, 1, rowCount, 7).setValues(values);
}

function signatureBlob_(dataUrl, timestamp, child) {
  const encoded = dataUrl.split(',')[1];
  const safeChild = child.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const filename = `${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss')}_${safeChild}.png`;
  return Utilities.newBlob(Utilities.base64Decode(encoded), 'image/png', filename);
}

function classSheetName_(schoolClass) {
  return safeName_(schoolClass).slice(0, 100);
}

function safeName_(value) {
  return String(value).replace(/[\\/:?*\[\]]/g, '-').trim() || 'Unassigned';
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function attendanceSpreadsheet_() {
  if (!SPREADSHEET_ID) throw new Error('Set SPREADSHEET_ID to the attendance Google Sheets document ID.');
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Run this once in the Apps Script editor to authorize and verify the target file.
function checkConnection() {
  const spreadsheet = attendanceSpreadsheet_();
  console.log('Connected to: ' + spreadsheet.getName());
  console.log('Spreadsheet URL: ' + spreadsheet.getUrl());
}
