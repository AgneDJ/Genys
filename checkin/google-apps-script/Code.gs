/* SF Genys attendance receiver — paste into Extensions > Apps Script in the
   provided Google Sheet. See README.md in this folder before deploying. */
const SETTINGS = {
  spreadsheetId: '1T-T-EPUCfzy0hWExJkW3UJ2Z4J9inFyVO74LiydEbW0',
  sheetName: 'Attendance',
  // Replace these demonstration PINs with the family's real 4–6 digit PINs.
  validPins: ['2026'],
  signaturesFolder: 'SF Genys attendance signatures',
  documentsFolder: 'SF Genys daily attendance documents'
};

function doPost(event) {
  try {
    const record = JSON.parse(event.postData.contents);
    validateRecord_(record);
    const timestamp = new Date(record.timestamp);
    const signature = saveSignature_(record.signature, timestamp, record.child);
    appendToSheet_(record, timestamp, signature.file.getUrl());
    updateDailyDocument_(record, timestamp, signature.blob);
    return response_({ ok: true });
  } catch (error) {
    console.error(error);
    return response_({ ok: false, error: error.message });
  }
}

function validateRecord_(record) {
  if (!SETTINGS.validPins.includes(String(record.familyPin || ''))) throw new Error('Invalid family PIN.');
  ['timestamp', 'child', 'action', 'guardian', 'signature'].forEach(key => {
    if (!record[key]) throw new Error(`Missing ${key}.`);
  });
  if (!['DROP OFF', 'PICK UP'].includes(record.action)) throw new Error('Invalid action.');
  if (!record.signature.startsWith('data:image/png;base64,')) throw new Error('Invalid signature.');
}

function appendToSheet_(record, timestamp, signatureUrl) {
  const spreadsheet = SpreadsheetApp.openById(SETTINGS.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(SETTINGS.sheetName) || spreadsheet.insertSheet(SETTINGS.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date & time', 'Date', 'Time', 'Child', 'Action', 'Guardian', 'Signature']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#dbe8ff');
    sheet.setFrozenRows(1);
  }
  const timezone = Session.getScriptTimeZone();
  sheet.appendRow([
    timestamp,
    Utilities.formatDate(timestamp, timezone, 'yyyy-MM-dd'),
    Utilities.formatDate(timestamp, timezone, 'h:mm a'),
    record.child,
    record.action,
    record.guardian,
    `=HYPERLINK("${signatureUrl}", "Open signature")`
  ]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('yyyy-mm-dd h:mm AM/PM');
  sheet.autoResizeColumns(1, 7);
}

function saveSignature_(dataUrl, timestamp, child) {
  const encoded = dataUrl.split(',')[1];
  const safeChild = child.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  const filename = `${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss')}_${safeChild}.png`;
  const blob = Utilities.newBlob(Utilities.base64Decode(encoded), 'image/png', filename);
  const file = getOrCreateFolder_(SETTINGS.signaturesFolder).createFile(blob);
  return { file, blob };
}

function updateDailyDocument_(record, timestamp, signatureBlob) {
  const date = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const title = `Attendance_${date}`;
  const folder = getOrCreateFolder_(SETTINGS.documentsFolder);
  const files = folder.getFilesByName(title);
  const existingDocument = files.hasNext() ? files.next() : null;
  const document = existingDocument ? DocumentApp.openById(existingDocument.getId()) : DocumentApp.create(title);
  if (!existingDocument) document.getBody().appendParagraph(`Child Drop-off and Pickup Register — ${date}`).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  const body = document.getBody();
  body.appendHorizontalRule();
  body.appendParagraph(`${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'h:mm a')} — ${record.child} — ${record.action}`).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(`Guardian: ${record.guardian}`);
  body.appendParagraph('Signature:');
  body.appendImage(signatureBlob).setWidth(220);
  document.saveAndClose();
  moveToFolder_(DriveApp.getFileById(document.getId()), folder);
  exportWordCopy_(document.getId(), folder, `${title}.docx`);
}

function exportWordCopy_(documentId, folder, filename) {
  const oldCopies = folder.getFilesByName(filename);
  while (oldCopies.hasNext()) oldCopies.next().setTrashed(true);
  const wordFile = DriveApp.getFileById(documentId).getAs(MimeType.MICROSOFT_WORD).setName(filename);
  folder.createFile(wordFile);
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function moveToFolder_(file, folder) {
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
