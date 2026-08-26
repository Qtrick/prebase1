/**
 * PreBase waitlist — Google Apps Script web app.
 *
 * Receives form-encoded POST requests from the PreBase launch site and appends
 * rows to a "Waitlist" sheet in the bound spreadsheet.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 */

var SHEET_NAME = 'Waitlist';
var HEADERS = [
  'Timestamp',
  'Email',
  'Role',
  'Source',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'Referrer',
  'Page URL'
];

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};

    // Honeypot: silently accept, store nothing.
    if (String(params.website || '').trim() !== '') {
      return json({ ok: true, status: 'created' });
    }

    var email = String(params.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return json({ ok: false, status: 'error' });
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) {
      return json({ ok: false, status: 'error' });
    }

    try {
      var sheet = getSheet();

      if (emailExists(sheet, email)) {
        return json({ ok: true, status: 'already_registered' });
      }

      sheet.appendRow([
        new Date(),
        safe(email),
        safe(params.role),
        safe(params.source),
        safe(params.utm_source),
        safe(params.utm_medium),
        safe(params.utm_campaign),
        safe(params.utm_content),
        safe(params.utm_term),
        safe(params.referrer),
        safe(params.page_url)
      ]);

      return json({ ok: true, status: 'created' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json({ ok: false, status: 'error' });
  }
}

function doGet() {
  return json({ ok: true, status: 'ready' });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function emailExists(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var values = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return true;
  }
  return false;
}

function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}

/** Trim, cap length, and neutralise spreadsheet formula injection. */
function safe(value) {
  var str = String(value == null ? '' : value).trim().slice(0, 500);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
