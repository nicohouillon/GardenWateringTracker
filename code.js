// Google Apps Script Code for Garden Watering Tracker with Email Notifications

// Configuration - UPDATE THESE EMAIL ADDRESSES AND SPREADSHEET_ID
const emails_list = getEnv('GARDENER_EMAILS');
const GARDENER_EMAILS = JSON.parse(emails_list);
console.log(GARDENER_EMAILS);
// !!! IMPORTANT: Replace with your actual Google Sheet ID
const SPREADSHEET_ID = getEnv('SPREADSHEET_ID');

// Web app entry point
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Garden Watering Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Handle form submissions
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addRecord') {
      return ContentService.createTextOutput(JSON.stringify(addWateringRecord(data)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === 'getRecords') {
      return ContentService.createTextOutput(JSON.stringify(getWateringRecords(data.weekStart)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === 'deleteRecord') {
      return ContentService.createTextOutput(JSON.stringify(deleteWateringRecord(data.date)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Add a watering record
function addWateringRecord(data) {
  const sheet = getOrCreateSheet();
  const { date, gardener, watered, notes } = data;
  
  // Check if record already exists
  const existingRowIndex = findRecordRow(sheet, date);
  
  if (existingRowIndex > 0) {
    // Update existing record
    sheet.getRange(existingRowIndex, 1, 1, 5).setValues([[date, gardener, watered, notes, new Date()]]);
  } else {
    // Add new record
    sheet.appendRow([date, gardener, watered, notes, new Date()]);
  }
  
  // Send email notification if watered
  if (watered) {
    sendWateringNotification(date, gardener, notes);
  }
  
  return { // Changed from ContentService.createTextOutput
    success: true,
    message: 'Record added successfully'
  };
}

// Get watering records for a specific week - HIGHLY ROBUST VERSION
function getWateringRecords(weekStart) {
  console.log("Backend: getWateringRecords called with weekStart (frontend ISO date string):", weekStart);
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    console.log("Backend: Fetched data length from sheet:", data.length);

    if (data.length <= 1) { // Only header row or no data
      console.log("Backend: No records or only header row. Returning empty array.");
      return {
        success: true,
        records: []
      };
    }

    // --- Key Change 1: Force weekStart/weekEnd to be UTC dates ---
    // The frontend sends "YYYY-MM-DD". We parse this directly as a UTC date at midnight.
    // Example: "2025-07-06" becomes Date object representing 2025-07-06T00:00:00Z
    const clientWeekStartDate = new Date(weekStart + 'T00:00:00Z');
    const clientWeekEndDate = new Date(weekStart + 'T00:00:00Z');
    clientWeekEndDate.setUTCDate(clientWeekEndDate.getUTCDate() + 6); // Add 6 days in UTC
    clientWeekEndDate.setUTCHours(23, 59, 59, 999); // Set to end of the 7th day in UTC

    console.log("Backend: Calculated Week Range (UTC) - Start:", clientWeekStartDate.toISOString(), "End:", clientWeekEndDate.toISOString());

    const records = data.slice(1).filter((row, index) => {
      const recordRawDate = row[0]; // Date value from Google Sheet
      let recordDateInSheet;

      // Ensure recordRawDate is a valid Date object for comparison
      if (recordRawDate instanceof Date && !isNaN(recordRawDate.getTime())) {
        recordDateInSheet = recordRawDate;
      } else if (typeof recordRawDate === 'string') {
        // Attempt to parse string from sheet into a Date object
        recordDateInSheet = new Date(recordRawDate);
        if (isNaN(recordDateInSheet.getTime())) { // Check for "Invalid Date"
            console.warn(`Backend: Invalid date string in sheet row ${index + 2}: ${recordRawDate}. Skipping row.`);
            return false;
        }
      } else {
        console.warn(`Backend: Skipping row ${index + 2} due to unexpected date type in sheet: ${typeof recordRawDate}, value: ${recordRawDate}`);
        return false;
      }
      
      // --- Key Change 2: Normalize sheet date to UTC midnight for comparison ---
      // This creates a new Date object representing the exact calendar date at 00:00:00 UTC
      // regardless of the original Date object's time or timezone offset.
      const recordDateUTC = new Date(Date.UTC(
          recordDateInSheet.getFullYear(),
          recordDateInSheet.getMonth(),
          recordDateInSheet.getDate()
      ));

      const isInRange = recordDateUTC >= clientWeekStartDate && recordDateUTC <= clientWeekEndDate;
      // console.log(`Backend: Sheet Row ${index + 2} Date (UTC): ${recordDateUTC.toISOString().slice(0, 10)}, Is In Range: ${isInRange}`);
      return isInRange;
    }).map(row => ({
      // --- Key Change 3: Format output date consistently as YYYY-MM-DD UTC string ---
      // This ensures the frontend receives a timezone-agnostic date string.
      date: (row[0] instanceof Date && !isNaN(row[0].getTime())) ? new Date(Date.UTC(row[0].getFullYear(), row[0].getMonth(), row[0].getDate())).toISOString().split('T')[0] : String(row[0] || ''),
      gardener: String(row[1] || ''),
      watered: Boolean(row[2]),
      notes: String(row[3] || ''),
      timestamp: (row[4] instanceof Date && !isNaN(row[4].getTime())) ? row[4].toISOString() : String(row[4] || '')
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending (newest first)

    console.log("Backend: Filtered records count:", records.length);
    console.log("Backend: First filtered record (if any):", records.length > 0 ? JSON.stringify(records[0]) : "N/A");

    return {
      success: true,
      records: records
    };
  } catch (error) {
    console.error('Backend: Critical Error in getWateringRecords:', error);
    return {
      success: false,
      error: error.message || "An unknown error occurred while fetching records."
    };
  }
}

// Delete a watering record
function deleteWateringRecord(date) {
  const sheet = getOrCreateSheet();
  const rowIndex = findRecordRow(sheet, date);
  
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
  }
  
  return { // Changed from ContentService.createTextOutput
    success: true,
    message: 'Record deleted successfully'
  };
}

// Helper function to get or create spreadsheet
function getOrCreateSheet() {
  const sheetName = 'Watering Records';
  let spreadsheet;
  
  try {
    console.log('Attempting to open spreadsheet with ID:', SPREADSHEET_ID);
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Spreadsheet opened successfully');
  } catch (e) {
    console.error('Failed to open spreadsheet:', e);
    throw new Error('Could not open spreadsheet with ID: ' + SPREADSHEET_ID + '. Please ensure the ID is correct and you have access. Error: ' + e.message);
  }
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    console.log('Sheet not found, creating new sheet:', sheetName);
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers
    sheet.getRange(1, 1, 1, 5).setValues([['Date', 'Gardener', 'Watered', 'Notes', 'Timestamp']]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    console.log('New sheet created with headers');
  } else {
    console.log('Sheet found:', sheetName);
  }
  
  return sheet;
}

// Find row index for a specific date
function findRecordRow(sheet, date) {
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    let rowDate = data[i][0];
    let compareDate = date;
    
    // Convert both to string format for comparison
    if (rowDate instanceof Date) {
      rowDate = rowDate.toISOString().split('T')[0];
    }
    if (compareDate instanceof Date) {
      compareDate = compareDate.toISOString().split('T')[0];
    }
    
    if (rowDate === compareDate) {
      return i + 1; // Return 1-based index
    }
  }
  
  return -1;
}

// Send email notification when garden is watered
function sendWateringNotification(date, gardener, notes) {
  try {
    // Parse the date string as a local date to avoid timezone shifts
    let formattedDate;
    
    if (typeof date === 'string') {
      // Split the date string and create a Date object in local timezone
      const dateParts = date.split('-'); // ["YYYY", "MM", "DD"]
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      
      // Create Date object in local timezone (not UTC)
      const localDate = new Date(year, month, day);
      
      formattedDate = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (date instanceof Date) {
      // If it's already a Date object, format it directly
      formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      // Fallback
      formattedDate = String(date);
    }
    
    const subject = `🌱 Garden Watered - ${formattedDate}`;
    
    let body = `<div>
    Great news! The garden was watered today.<br><br>
    📅 Date: ${formattedDate}<br>
    👨‍🌾 Gardener: ${gardener}<br>
    ${notes ? `📝 Notes: ${notes}<br>` : ''}
    <br>
    Thank you for taking care of our garden! 🌿<br><br>
    <span style="font-size:small;color:#888;">This is an automated notification from the Garden Watering Tracker on behalf of Greenway57 Garden Society</span>
  </div>`;
    
    // Send email to all gardeners
    GARDENER_EMAILS.forEach(email => {
      if (email && email.includes('@')) {
        try {
          sendEmailWithGmailApi(email, subject, body);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error in sendWateringNotification:', error);
  }
}

function sendEmailWithGmailApi(to, subject, htmlBody) {
  try {
    const displayName = "Greenway 57 Garden Bot";
    const aliases = GmailApp.getAliases();
    const fromEmail = aliases.length > 0 ? aliases[1] : Session.getActiveUser().getEmail();
    const actualFromEmail = fromEmail || Session.getActiveUser().getEmail();

    console.log('Subject:', subject);
    console.log('HTML Body length:', htmlBody.length);
    console.log('HTML Body preview:', htmlBody.substring(0, 100));
    // Encode subject as UTF-8 bytes, then standard base64 (like your working version)
    const subjectBase64 = Utilities.base64Encode(Utilities.newBlob(subject).getBytes()).replace(/=+$/, '');
    const encodedSubject = '=?UTF-8?B?' + subjectBase64 + '?=';

    const raw = [
      'To: ' + to,
      'From: "' + displayName + '" <' + actualFromEmail + '>',
      'Subject: ' + encodedSubject,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody
    ].join('\r\n');

    // Encode the entire raw email as UTF-8 bytes, then base64
    const utf8Bytes = Utilities.newBlob(raw).getBytes();
    const encodedEmail = Utilities.base64EncodeWebSafe(utf8Bytes);

    // Send using Gmail API (like your working version)
    Gmail.Users.Messages.send(
      { raw: encodedEmail },
      'me'
    );
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * @param {string|undefined} key
 * @returns {string|null|object}
 */
function getEnv(key) {
  if (key) {
    return PropertiesService.getScriptProperties().getProperty(key);
  }
  return PropertiesService.getScriptProperties().getProperties();
}

// Test function to debug connectivity
function testConnection() {
  try {
    console.log('Testing connection...');
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    console.log('Test successful, data rows:', data.length);
    return {
      success: true,
      message: 'Connection successful',
      rowCount: data.length,
      spreadsheetId: SPREADSHEET_ID
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString(),
      spreadsheetId: SPREADSHEET_ID
    };
  }
}