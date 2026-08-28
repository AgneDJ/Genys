/* SF Genys attendance receiver — paste into Extensions > Apps Script in the
   provided Google Sheet. See README.md in this folder before deploying. */
const SETTINGS = {
  // Replace these demonstration PINs with the family's real 4–6 digit PINs.
  validPins: ['2026']
};

function doGet() {
  return response_({ ok: true, message: 'SF Genys attendance receiver is ready.' });
}

function doPost(event) {
  try {
    const payload = event.parameter && event.parameter.payload ? event.parameter.payload : event.postData.contents;
    const record = JSON.parse(payload);
    validateRecord_(record);
    const timestamp = new Date(record.timestamp);
    const signature = signatureBlob_(record.signature, timestamp, record.child);
    appendToSheet_(record, timestamp, signature);
    return response_({ ok: true });
  } catch (error) {
    console.error(error);
    return response_({ ok: false, error: error.message });
  }
}

function validateRecord_(record) {
  if (!SETTINGS.validPins.includes(String(record.familyPin || ''))) throw new Error('Invalid family PIN.');
  ['timestamp', 'child', 'schoolClass', 'action', 'guardian', 'signature'].forEach(key => {
    if (!record[key]) throw new Error(`Missing ${key}.`);
  });
  if (!['DROP OFF', 'PICK UP'].includes(record.action)) throw new Error('Invalid action.');
  if (!record.signature.startsWith('data:image/png;base64,')) throw new Error('Invalid signature.');
}

function appendToSheet_(record, timestamp, signature) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = classSheetName_(record.schoolClass);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date & time', 'Date', 'Time', 'Child', 'Class / group', 'Action', 'Guardian', 'Signature']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#dbe8ff');
    sheet.setFrozenRows(1);
  }
  const timezone = Session.getScriptTimeZone();
  sheet.appendRow([
    timestamp,
    Utilities.formatDate(timestamp, timezone, 'yyyy-MM-dd'),
    Utilities.formatDate(timestamp, timezone, 'h:mm a'),
    record.child,
    record.schoolClass,
    record.action,
    record.guardian,
    ''
  ]);
  const row = sheet.getLastRow();
  sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd h:mm AM/PM');
  sheet.setRowHeight(row, 72);
  sheet.insertImage(signature, 8, row).setWidth(155).setHeight(60);
  sheet.autoResizeColumns(1, 8);
  sheet.setColumnWidth(8, 175);
}

function signatureBlob_(dataUrl, timestamp, child) {
  const encoded = dataUrl.split(',')[1];
  const safeChild = child.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const filename = `${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss')}_${safeChild}.png`;
  return Utilities.newBlob(Utilities.base64Decode(encoded), 'image/png', filename);
}

function classSheetName_(schoolClass) {
  return `Attendance — ${safeName_(schoolClass)}`.slice(0, 100);
}

function safeName_(value) {
  return String(value).replace(/[\\/:?*\[\]]/g, '-').trim() || 'Unassigned';
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
