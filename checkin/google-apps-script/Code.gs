/* SF Genys attendance receiver — paste into Extensions > Apps Script in the
   provided Google Sheet. See README.md in this folder before deploying. */
// Keep this map private in Apps Script. Each PIN must match the selected child.
const CHILD_PINS = {
  'Sara Kirtikar': '454992', 'Anouk Vala-Thiery (Anūkė)': '814792',
  'Percy Andrius Alexander (Persiukas)': '147140', 'Saulė Vierra': '914995',
  'Lukas Stempel': '826201', 'Emma Presswood': '110994',
  'Julius Djacenko': '588379', 'Emilija Burlingė': '396355',
  'Athena Bouzidi': '194087', 'Jonas Sebastian Laucys': '801792',
  'Ulla Putz': '714073', 'Melissa Jariga': '227726',
  'Marija Kudirka': '856046', 'Pranas Kudirka': '471347',
  'Aurelija Vierra': '531260', 'Emily Radlinski': '218858',
  'Karim Rapolas Ghassan El Chmaytilli (Karimas)': '600922',
  'Nida Kiaune': '795208', 'Julius Kudirka': '193950',
  'Noah Bouzidi': '483010', 'Melina Grivickas': '809234',
  'Mavi Grivickas': '618297', 'Jonas Aklifazla': '427117',
  'Arya Apke': '777694', 'Jordan Abudeab': '436389',
  'Christopher Radlinski': '867231', 'Akila Aklifazla': '211103',
  'Kalani Valverde': '121906', 'Nida Šukytė': '117171',
  'Ugnė Olivia Laučys': '596387', 'Amber Apke': '741009',
  'Arvydas Kudirka': '662102', 'Adam Abudeab': '508075',
  'Kintas Valverde': '670389'
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
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
  const headers = ['Data', 'Laikas', 'Vaikas', 'Klasė / grupė', 'Veiksmas', 'Globėjas', 'Parašas'];
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
  return `Attendance — ${safeName_(schoolClass)}`.slice(0, 100);
}

function safeName_(value) {
  return String(value).replace(/[\\/:?*\[\]]/g, '-').trim() || 'Unassigned';
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
