# Connect the SF Genys register to Google Sheets

This script writes every check-in and check-out to the Google Sheet provided by the school. The signature image is placed directly in the matching row, and the script creates a separate attendance worksheet for each selected class/group. It does not create, delete, or access files in Google Drive.

1. Open the school spreadsheet, then select **Extensions → Apps Script**.
2. Replace the default code with `Code.gs` from this folder and save it.
3. Keep the four-digit PIN strings in `CHILD_PINS` synchronized with the child PINs in `checkin/Vaiku_sarasas.js`. The updated codes use the last four digits of the previous codes; leading zeros must be retained.
4. Set the Apps Script project time zone to the school’s local time zone in **Project Settings**.
5. Select **Deploy → New deployment → Web app**. Set **Execute as** to *Me* and **Who has access** to *Anyone*. Authorize the Google Sheets permission.
6. Copy the generated `/exec` web-app URL into `checkin/config.js` as `endpoint`.
7. Deploy the website again and submit a test entry. The matching class attendance tab is created automatically and will contain the signature image in the final column.

Opening the Web App URL in a browser should display a small `attendance receiver is ready` response. That only tests the connection; records are added when the check-in page sends a `POST` request.

The web app URL is intentionally not included in this repository: it belongs to the school’s Google account and is only available after the deployment above.

For an existing web app, replace its code with the updated `Code.gs`, then use **Deploy → Manage deployments → Edit → New version → Deploy** to keep the same endpoint URL. Updating the local file alone does not update the live Google Apps Script.
