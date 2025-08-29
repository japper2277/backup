- CALENDAR PROJECT STRUCTURE RULES:

  The mic_calendar project uses a modular structure that must be 
  maintained:

  FILES:
  - set_list_Calendar.html (271 lines) - Clean HTML only, no 
  inline styles/scripts
  - css/calendar.css - Main calendar, layout, navigation styles  
  - css/modals.css - All popups, forms, overlays, context menus
  - js/calendar.js - All functionality, event handlers, data 
  management

  WHEN ADDING FEATURES:
  - Keep HTML minimal with clear section comments
  - Add styles to appropriate CSS file (calendar.css vs 
  modals.css)
  - Add JavaScript to js/calendar.js with organized functions
  - Never add inline styles or scripts to HTML
  - Maintain the organized comment structure in HTML

  TRIGGER PHRASES:
  - "Follow the modular structure"
  - "Keep the calendar organized" 
  - "Add this feature to the calendar following our structure"

  The original file was 2000+ lines - keep it modular and 
  maintainable!

  🎯 Why This Memory Entry Helps:

  1. Reminds me of the structure every time you mention the
  calendar
  2. Prevents regression back to inline styles/scripts
  3. Maintains organization as features are added
  4. Gives clear file responsibilities so I know where to put what
  5. Includes trigger phrases you can use to activate this
  behavior