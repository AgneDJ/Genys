# Connect the SF Genys register to Google Sheets

This script writes every check-in and check-out to the Google Sheet provided by the school, stores the signature PNG privately in Drive, and updates a daily Google Doc plus a daily Word `.docx` copy. It creates a separate attendance worksheet and daily document for each selected class/group.

1. Open the school spreadsheet, then select **Extensions → Apps Script**.
2. Replace the default code with `Code.gs` from this folder and save it.
3. In the script, replace `validPins: ['2026']` with the real family PINs. Do not use the same PIN for every family in production.
4. Set the Apps Script project time zone to the school’s local time zone in **Project Settings**.
5. Select **Deploy → New deployment → Web app**. Set **Execute as** to *Me* and **Who has access** to *Anyone*. Authorize the requested Google Drive, Docs and Sheets permissions.
6. Copy the generated `/exec` web-app URL into `checkin/config.js` as `endpoint`.
7. Deploy the website again and submit a test entry. The `Attendance` tab, signature folder, daily Google Doc, and daily `.docx` file will be created automatically.

The web app URL is intentionally not included in this repository: it belongs to the school’s Google account and is only available after the deployment above.
