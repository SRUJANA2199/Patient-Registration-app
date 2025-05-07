
**Documentation of  each feature as a separate git commit with a clear commit history.**


Commit 1)Initialize project structure


Initialize patient registration system project with React

- Set up React application structure
- Configure basic dependencies (React, PGlite)
- Add basic file structure for components
  
Commit 2)Database connection and initialization


Implement database connection with PGlite

- Create singleton pattern for PGlite instance
- Add database initialization function
- Configure IndexedDB persistence for offline capability
- Implement patient table schema creation
- Add loading states during database initialization

  
Commit 3)Patient registration core functionality


Add core patient registration functionality

- Create patient registration form with validation
- Implement form state management
- Add patient data submission to database
- Display registered patients in table format
- Implement patient deletion functionality

 
Commit 4)Local storage fallback system


Implement local storage fallback mechanism

- Add local storage caching for patient data
- Create fallback system for offline operation
- Implement data synchronization between local storage and database
- Display notification when in fallback mode
- Ensure data persistence across page refreshes


Commit 5)Custom SQL query functionality

Add custom SQL query execution panel

- Create SQL query input interface
- Implement query execution functionality
- Add support for SELECT queries with various conditions
- Display query results in formatted table
- Handle query errors gracefully
- Implement clear functionality for query results


Commit 6)Enhanced SQL query parsing

Enhance SQL query parsing with specialized handlers

- Add support for WHERE clauses with various conditions
- Implement handlers for specific column queries (id, name, age, gender)
- Add support for LIKE operator in name searches
- Create COUNT query handler
- Implement column-specific SELECT queries
- Add query validation and error handling


Commit 7)Improve UI styling and layout

- Create responsive grid layout for the application
- Add styled components for forms and tables
- Implement loading and error states with visual feedback
- Add progress indicator for database operations
- Style query panel and results display
- Implement consistent color scheme and typography
 
Commit 8)Error handling and user feedback


- Implement comprehensive error handling for database operations
- Add user-friendly error messages
- Create dismissible error alerts
- Add validation feedback for form inputs
- Implement status indicators for database operations
- Add fallback notification system


**Provide setup and usage instructions for the repository.**

1. Clone the Repository
git clone https://github.com/your-username/patient-registration-system.git
cd patient-registration-system

2. Install Dependencies
npm install

3. Start Development Server
npm start

4.Build for Production
 npm run build

 **Deploy your solution to a publicly accessible URL **
 
 https://patientregistrationsystemm.netlify.app/

** Describe any challenges faced during development**

Working with PGlite was initially challenging due to the limited availability of projects and tutorials. 
However, I was able to overcome that by thoroughly reviewing the official documentation, which, although time-consuming, proved to be effective.
