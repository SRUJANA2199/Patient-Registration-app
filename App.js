import { useState, useEffect } from "react";
import { PGlite } from "@electric-sql/pglite";
import PatientRegistrationApp from "./PatientRegistrationApp";

// Create a singleton instance of PGlite to prevent multiple instantiations
let pgliteInstance = null;

// Function to get the PGlite instance
const getPGliteInstance = async () => {
  if (!pgliteInstance) {
    console.log("Creating new PGlite instance...");
    pgliteInstance = await PGlite.create({
      dbName: 'patient_registration_db',
      persistenceMode: 'indexeddb'
    });
  }
  return pgliteInstance;
};

// Main App component
function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    
    const initApp = async () => {
      try {
        console.log("Initializing database...");
        
      
        const pglite = await getPGliteInstance();
        
      
        console.log("Setting up patient table...");
        await pglite.exec(`
          CREATE TABLE IF NOT EXISTS patient (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            phone_number TEXT NOT NULL
          );
          
          -- Add some sample data only if table is empty
          INSERT INTO patient (name, age, gender, phone_number)
          SELECT 'John Doe', 45, 'Male', '555-123-4567'
          WHERE NOT EXISTS (SELECT 1 FROM patient LIMIT 1);
          
          INSERT INTO patient (name, age, gender, phone_number)
          SELECT 'Jane Smith', 32, 'Female', '555-987-6543'
          WHERE NOT EXISTS (SELECT 1 FROM patient LIMIT 1);
          
          INSERT INTO patient (name, age, gender, phone_number)
          SELECT 'Robert Johnson', 56, 'Male', '555-456-7890'
          WHERE NOT EXISTS (SELECT 1 FROM patient LIMIT 1);
        `);
        
        console.log("Database initialized successfully");
        setDb(pglite);
        setLoading(false);
      } catch (err) {
        console.error("Database initialization error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    initApp();
    
    
    return () => {
      
      console.log("Component unmounted");
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-blue-600">
            Patient Registration System
          </h1>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            Database Error
          </h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Failed to initialize database: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      {db ? <PatientRegistrationApp db={db} /> : null}
    </div>
  );
}

export default App;