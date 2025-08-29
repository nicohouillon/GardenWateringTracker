# 🌱 Garden Watering Tracker

A web-based garden watering tracking system built with Google Apps Script and Google Sheets. This application allows multiple gardeners to log watering activities and automatically sends email notifications to all participants when the garden is watered.

## Features

- **📝 Easy Logging**: Simple form to record watering activities with date, gardener name, watered status, and notes
- **📊 Weekly View**: Browse watering records by week with intuitive navigation
- **📧 Email Notifications**: Automatic email alerts sent to all registered gardeners when watering occurs
- **📱 Mobile Friendly**: Responsive design that works well on phones, tablets, and desktop
- **🗑️ Record Management**: Edit and delete watering records as needed
- **⏰ Real-time Updates**: Instant synchronization with Google Sheets backend

## Setup Instructions

### 1. Create Google Sheets Spreadsheet

1. Create a new Google Sheets document
2. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit` → ID is `1ABC...XYZ`

### 2. Set Up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default `Code.gs` content with the code from `code.js`
4. Create a new HTML file called `index` and paste the content from `index.html`

### 3. Configure Environment Variables

1. In Apps Script, go to **Project Settings** → **Script Properties**
2. Add the following properties:

| Property Name | Value | Description |
|---------------|-------|-------------|
| `SPREADSHEET_ID` | Your spreadsheet ID | The ID from step 1 |
| `GARDENER_EMAILS` | `["email1@example.com", "email2@example.com"]` | JSON array of email addresses |

### 4. Enable Required Services

1. In Apps Script, go to **Services** (+ icon)
2. Add **Gmail API** service

### 5. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Choose type: **Web app**
3. Set execute as: **Me**
4. Set access: **Anyone** (or **Anyone with Google account** for more security)
5. Click **Deploy**
6. Copy the web app URL

### 6. Set Up Permissions

1. The first time you run the app, you'll need to authorize permissions
2. Grant access to:
   - Google Sheets (to read/write data)
   - Gmail (to send notifications)

## Usage

### Adding Watering Records

1. Open the web app URL
2. Select the date (defaults to today)
3. Enter the gardener's name
4. Check "Garden was watered today" if applicable
5. Add any notes about conditions, issues, etc.
6. Click "Add Record"

### Viewing Records

- Records are displayed by week
- Use "Previous Week" and "Next Week" buttons to navigate
- Each record shows:
  - Date and day of week
  - Gardener name
  - Watering status (with colored badges)
  - Notes (if any)
  - Delete button

### Email Notifications

When a watering record is added with "watered" checked:
- All email addresses in `GARDENER_EMAILS` receive a notification
- Email includes date, gardener name, and notes
- Sent from your Gmail account with display name "Greenway 57 Garden Bot"

## Project Structure

```
garden-watering-tracker/
├── code.js           # Google Apps Script backend code
├── index.html        # Frontend web interface
└── README.md         # This file
```

### Key Functions

**Backend (code.js)**:
- `doGet()` - Serves the HTML interface
- `doPost()` - Handles API requests from frontend
- `addWateringRecord()` - Adds/updates watering records
- `getWateringRecords()` - Fetches records for a specific week
- `deleteWateringRecord()` - Removes records
- `sendWateringNotification()` - Sends email alerts

**Frontend (index.html)**:
- Responsive form interface
- Week-by-week record browsing
- Real-time data synchronization
- Mobile-optimized design

## Data Storage

Records are stored in Google Sheets with the following columns:
- **Date**: Date of watering activity
- **Gardener**: Name of person who watered (or didn't water)
- **Watered**: Boolean indicating if watering occurred
- **Notes**: Optional text notes
- **Timestamp**: When the record was created/updated

## Timezone Handling

The application handles timezones carefully to ensure dates display consistently:
- Frontend sends dates as ISO strings (YYYY-MM-DD)
- Backend normalizes dates to UTC for consistent storage
- Display formatting respects local timezone settings
- Email notifications use local date formatting

## Customization

### Changing Email Template

Edit the `sendWateringNotification()` function in `code.js` to customize:
- Email subject line
- HTML email body
- Sender display name

### Styling

Modify the `<style>` section in `index.html` to change:
- Colors and themes
- Layout and spacing
- Mobile responsiveness
- Typography

### Adding Fields

To add new data fields:
1. Update the HTML form in `index.html`
2. Modify the `addWateringRecord()` function in `code.js`
3. Update the display logic in `handleGetRecordsSuccess()`

## Troubleshooting

### Common Issues

**"Could not open spreadsheet" error**:
- Verify the `SPREADSHEET_ID` is correct
- Ensure the Apps Script has permission to access the sheet

**Emails not sending**:
- Check that Gmail API is enabled
- Verify email addresses in `GARDENER_EMAILS` are valid JSON
- Ensure Gmail permissions are granted

**Records not displaying**:
- Check browser console for JavaScript errors
- Verify the web app deployment is accessible
- Ensure Apps Script execution permissions are granted

**Timezone issues**:
- The recent fix in `sendWateringNotification()` should resolve date display issues
- Ensure your Apps Script project timezone matches your location

### Debug Mode

Uncomment the test connection button in `index.html` to verify:
- Apps Script connectivity
- Spreadsheet access
- Data retrieval

## Contributing

This is a community garden project. To contribute:
1. Test changes thoroughly with the debug functions
2. Ensure mobile responsiveness is maintained
3. Document any new configuration requirements
4. Consider email notification impact for all users

## License

This project is open source and available for community garden use.

## Support

For technical issues:
1. Check the troubleshooting section above
2. Review Google Apps Script execution logs
3. Verify all configuration steps were completed
4. Test with the debug connection button

---

*Built with ❤️ for the Greenway 57 Garden Society*