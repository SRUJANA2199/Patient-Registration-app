import { useState, useEffect } from "react";
import { identifier } from '@electric-sql/pglite/template';
import './PatientRegistrationStyles.css';

function PatientRegistrationApp({ db }) {
  const [patients, setPatients] = useState([]);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  
  const [customQuery, setCustomQuery] = useState("");
  const [queryResults, setQueryResults] = useState([]);
  const [queryColumns, setQueryColumns] = useState([]);
  const [queryError, setQueryError] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [showQueryResults, setShowQueryResults] = useState(false);
  
  // Load patients on initial render
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;
    
    const loadPatients = async () => {
      // Always try loading from localStorage first for immediate UI feedback
      const storedPatients = localStorage.getItem('patients');
      if (storedPatients) {
        try {
          const parsedPatients = JSON.parse(storedPatients);
          if (isMounted) {
            setPatients(parsedPatients);
            setLoading(false);
          }
        } catch (err) {
          console.error("Error parsing stored patients:", err);
        }
      }
      
      // Then try to load from database if available
      if (!db) {
        console.log("Database connection not available yet");
        if (!storedPatients) {
          setLoading(false);
        }
        setUsingFallback(true);
        return;
      }

      try {
        console.log("Loading patients from database...");
        
        // Using template literals syntax for query
        const result = await db.sql`
          SELECT * FROM ${identifier`patient`} ORDER BY id ASC
        `;
        
        if (isMounted) {
          const loadedPatients = result.rows;
          setPatients(loadedPatients);
          setLoading(false);
          setUsingFallback(false);
          
          // Update localStorage as backup
          localStorage.setItem('patients', JSON.stringify(loadedPatients));
        }
        
        // Set up change listener on the patient table
        console.log("Setting up change listener...");
        
        // Use an approach that works with base PGlite functionality
        const checkForChanges = async () => {
          if (!isMounted) return;
          
          try {
            const result = await db.sql`
              SELECT * FROM ${identifier`patient`} ORDER BY id ASC
            `;
            const updatedPatients = result.rows;
            setPatients(updatedPatients);
            
            // Also update localStorage as backup
            localStorage.setItem('patients', JSON.stringify(updatedPatients));
          } catch (e) {
            console.error("Error checking for changes:", e);
          }
        };
        
        // Set up a polling interval for keeping data in sync
        const pollInterval = setInterval(checkForChanges, 1000);
        
        // Return cleanup function
        unsubscribe = () => {
          clearInterval(pollInterval);
        };
        
      } catch (error) {
        console.error("Failed to load patients from DB:", error);
        if (isMounted && !storedPatients) {
          setLoading(false);
          setUsingFallback(true);
        }
      }
    };
    
    loadPatients();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [db]);

  // Handle input change for patient form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient({
      ...newPatient,
      [name]: value
    });
  };

  // Add a new patient - with local storage fallback
  const addPatient = async () => {
    // Basic validation
    if (!newPatient.name.trim() || !newPatient.age || !newPatient.gender || !newPatient.phoneNumber.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      // Generate sequential ID (1, 2, 3...)
      const generateSequentialId = () => {
        // If there are no patients, start with ID 1
        if (patients.length === 0) {
          return 1;
        }
        
        // Otherwise, find the maximum ID and add 1
        const maxId = Math.max(...patients.map(patient => patient.id));
        return maxId + 1;
      };
      
      // Create patient object with consistent structure regardless of storage method
      const newPatientObj = {
        id: generateSequentialId(), // Sequential ID (1, 2, 3...)
        name: newPatient.name.trim(),
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        phone_number: newPatient.phoneNumber.trim()
      };
      
      if (db && !usingFallback) {
        // Use template literals for parametrized query
        await db.sql`
          INSERT INTO ${identifier`patient`} (id, name, age, gender, phone_number) 
          VALUES (${newPatientObj.id}, ${newPatientObj.name}, ${newPatientObj.age}, ${newPatientObj.gender}, ${newPatientObj.phone_number})
        `;
        
        // Manually refresh the patient list after adding
        const refreshResult = await db.sql`
          SELECT * FROM ${identifier`patient`} ORDER BY id ASC
        `;
        const updatedPatients = refreshResult.rows;
        setPatients(updatedPatients);
        
        // Always back up to localStorage for persistence across page refreshes
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
      } else {
        // Fallback to localStorage only
        const updatedPatients = [...patients, newPatientObj];
        setPatients(updatedPatients);
        
        // Save to localStorage
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
      }
      
      // Reset form
      setNewPatient({
        name: "",
        age: "",
        gender: "Male",
        phoneNumber: ""
      });
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error("Failed to add patient:", error);
      setError(`Failed to add patient: ${error.message}`);
    }
  };

  // Delete a patient - with local storage fallback
  const deletePatient = async (id) => {
    try {
      if (db && !usingFallback) {
        await db.sql`DELETE FROM ${identifier`patient`} WHERE id = ${id}`;
        
        // Manually refresh the patient list after deleting
        const result = await db.sql`
          SELECT * FROM ${identifier`patient`} ORDER BY id ASC
        `;
        const updatedPatients = result.rows;
        setPatients(updatedPatients);
        
        // Back up to localStorage
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
      } else {
        // Fallback to localStorage only
        const updatedPatients = patients.filter(patient => patient.id !== id);
        setPatients(updatedPatients);
        
        // Save to localStorage
        localStorage.setItem('patients', JSON.stringify(updatedPatients));
      }
    } catch (error) {
      console.error("Failed to delete patient:", error);
      setError(`Failed to delete patient: ${error.message}`);
    }
  };

  // Enhanced custom SQL query execution function
  const executeCustomQuery = async () => {
    if (!db || !customQuery.trim()) {
      setQueryError("Please enter a valid SQL query");
      return;
    }
    
    setQueryLoading(true);
    setQueryError(null);
    
    try {
      // Parse the query input to handle common SQL patterns
      let result;
      const query = customQuery.trim().toLowerCase().replace(/;$/, ""); // Remove trailing semicolon
      
      // Handle basic SELECT queries
      if (query === "select * from patient") {
        result = await db.sql`SELECT * FROM ${identifier`patient`}`;
      }
      // Handle queries with WHERE clauses for different conditions
      else if (query.startsWith("select * from patient where")) {
        // Extract the WHERE condition
        const whereClause = query.substring(query.indexOf("where") + 5).trim();
        
        // Handle different types of WHERE conditions
        
        // 1. ID conditions (=, >, <, >=, <=)
        if (/\bid\s*(=|>|<|>=|<=)\s*\d+/.test(whereClause)) {
          const operator = whereClause.match(/(=|>|<|>=|<=)/)[0];
          const idValue = parseInt(whereClause.split(operator)[1].trim());
          
          if (operator === "=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE id = ${idValue}`;
          } else if (operator === ">") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE id > ${idValue}`;
          } else if (operator === "<") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE id < ${idValue}`;
          } else if (operator === ">=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE id >= ${idValue}`;
          } else if (operator === "<=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE id <= ${idValue}`;
          }
        }
        // 2. Age conditions (=, >, <, >=, <=)
        else if (/\bage\s*(=|>|<|>=|<=)\s*\d+/.test(whereClause)) {
          const operator = whereClause.match(/(=|>|<|>=|<=)/)[0];
          const ageValue = parseInt(whereClause.split(operator)[1].trim());
          
          if (operator === "=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE age = ${ageValue}`;
          } else if (operator === ">") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE age > ${ageValue}`;
          } else if (operator === "<") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE age < ${ageValue}`;
          } else if (operator === ">=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE age >= ${ageValue}`;
          } else if (operator === "<=") {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE age <= ${ageValue}`;
          }
        }
        // 3. Name conditions (using LIKE or =)
        else if (/\bname\s*(=|like)\s*['"][^'"]+['"]/.test(whereClause)) {
          const nameMatch = whereClause.match(/name\s*(=|like)\s*['"]([^'"]+)['"]/i);
          if (nameMatch) {
            const operator = nameMatch[1].toLowerCase();
            const nameValue = nameMatch[2];
            
            if (operator === "=") {
              result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE name = ${nameValue}`;
            } else if (operator === "like") {
              result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE name LIKE ${nameValue}`;
            }
          } else {
            throw new Error("Invalid name condition format");
          }
        }
        // 4. Gender condition (=)
        else if (/\bgender\s*=\s*['"][^'"]+['"]/.test(whereClause)) {
          const genderMatch = whereClause.match(/gender\s*=\s*['"]([^'"]+)['"]/i);
          if (genderMatch && genderMatch[1]) {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE gender = ${genderMatch[1]}`;
          } else {
            throw new Error("Invalid gender condition format");
          }
        }
        // 5. Phone number condition (=)
        else if (/\bphone_number\s*=\s*['"][^'"]+['"]/.test(whereClause)) {
          const phoneMatch = whereClause.match(/phone_number\s*=\s*['"]([^'"]+)['"]/i);
          if (phoneMatch && phoneMatch[1]) {
            result = await db.sql`SELECT * FROM ${identifier`patient`} WHERE phone_number = ${phoneMatch[1]}`;
          } else {
            throw new Error("Invalid phone_number condition format");
          }
        }
        else {
          throw new Error("This WHERE clause is not recognized. Try using conditions on id, name, age, gender, or phone_number.");
        }
      }
      // Handle SELECT with specific columns
      else if (query.startsWith("select") && query.includes("from patient") && !query.includes("*")) {
        const columnsStr = query.substring(6, query.indexOf("from")).trim();
        const columns = columnsStr.split(',').map(col => col.trim());
        
        // Validate columns
        const validColumns = ['id', 'name', 'age', 'gender', 'phone_number'];
        const invalidColumns = columns.filter(col => !validColumns.includes(col));
        
        if (invalidColumns.length > 0) {
          throw new Error(`Invalid column(s): ${invalidColumns.join(', ')}. Valid columns are: ${validColumns.join(', ')}`);
        }
        
        // Build a dynamic query based on requested columns
        const columnIdentifiers = columns.map(col => identifier(col));
        const dynamicQuery = `SELECT ${columnIdentifiers.join(', ')} FROM patient`;
        
        result = await db.sql(dynamicQuery);
      }
      // Handle COUNT queries
      else if (query === "select count(*) from patient") {
        result = await db.sql`SELECT COUNT(*) FROM ${identifier`patient`}`;
      }
      else {
        throw new Error("Query not supported. Try simple SELECT queries on the patient table with WHERE conditions using id, name, age, gender, or phone_number.");
      }
      
      if (result.rows && result.rows.length > 0) {
        // Get column names from the first result object
        const columns = Object.keys(result.rows[0]);
        setQueryColumns(columns);
        setQueryResults(result.rows);
        setShowQueryResults(true);
      } else {
        // Handle empty results
        setQueryColumns([]);
        setQueryResults([]);
        setShowQueryResults(true);
      }
    } catch (error) {
      console.error("Query execution error:", error);
      setQueryError(`Query error: ${error.message}`);
    } finally {
      setQueryLoading(false);
    }
  };

  // If there's an error with the database
  if (error) {
    return (
      <div className="error-container">
        <h1 className="error-title">Patient Registration</h1>
        <div className="error-alert" role="alert">
          <strong className="error-bold">Error: </strong>
          <span className="error-message">{error}</span>
          <button 
            className="error-dismiss-button"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Added top-centered header */}
      <div className="app-header">
        <h1 className="app-title">Patient Registration System</h1>
      </div>
     
      <div className="main-content">
        {usingFallback && (
          <div className="fallback-notice">
            Using local storage for data persistence. Your data will be available even after page refresh.
          </div>
        )}
        
        {/* Add new patient form */}
        <div className="patient-form">
          <h2 className="section-title">Register New Patient</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Full Name"
                value={newPatient.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                min="0"
                max="150"
                className="form-input"
                placeholder="Age"
                value={newPatient.age}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-input"
                value={newPatient.gender}
                onChange={handleInputChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-input"
                placeholder="Phone Number"
                value={newPatient.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <button
            className="register-button"
            onClick={addPatient}
          >
            Register Patient
          </button>
        </div>
        
        {/* Patient list */}
        <div className="patient-list">
          <h2 className="section-title">Registered Patients</h2>
          
          {loading ? (
            <div className="loading-message">Loading patients...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="table-header">ID</th>
                    <th className="table-header">Name</th>
                    <th className="table-header">Age</th>
                    <th className="table-header">Gender</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-message">No patients registered</td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="table-row">
                        <td className="table-cell">{patient.id}</td>
                        <td className="table-cell">{patient.name}</td>
                        <td className="table-cell">{patient.age}</td>
                        <td className="table-cell">{patient.gender}</td>
                        <td className="table-cell">{patient.phone_number}</td>
                        <td className="table-cell">
                          <button
                            onClick={() => deletePatient(patient.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Right sidebar - SQL Query Panel */}
      <div className="query-panel">
        <div className="query-container">
          <h2 className="section-title">Execute Custom SQL Query</h2>
          
          <div className="query-textarea-container">
            <textarea
              className="query-textarea"
              rows="6"
              placeholder="Enter SQL query (e.g. SELECT * FROM patient WHERE age > 40)"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
            ></textarea>
          </div>
          
          <div className="query-buttons">
            <button
              className="execute-button"
              onClick={executeCustomQuery}
              disabled={queryLoading || !db}
            >
              {queryLoading ? "Executing..." : "Execute Query"}
            </button>
            
            <button
              className="clear-button"
              onClick={() => {
                setShowQueryResults(false);
                setCustomQuery("");
                setQueryResults([]);
                setQueryColumns([]);
                setQueryError(null);
              }}
            >
              Clear
            </button>
          </div>
          
          {queryError && (
            <div className="query-error">
              {queryError}
            </div>
          )}
          
          {/* Query Results */}
          {showQueryResults && (
            <div className="query-results">
              <h3 className="results-title">Query Results</h3>
              
              {queryResults.length === 0 ? (
                <div className="no-results-message">
                  Query executed successfully. No results to display or non-SELECT query executed.
                </div>
              ) : (
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {queryColumns.map((column, index) => (
                          <th 
                            key={index}
                            className="results-header"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.map((row, rowIndex) => (
                        <tr key={rowIndex} className="results-row">
                          {queryColumns.map((column, colIndex) => (
                            <td key={`${rowIndex}-${colIndex}`} className="results-cell">
                              {row[column] !== null ? String(row[column]) : "(null)"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientRegistrationApp;