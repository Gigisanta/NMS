import { Database } from "bun:sqlite";
import { resolve } from "path";

const pathArg = process.argv[2] || "C:/Users/tomas/Desktop/NMS/db/custom.db";
const dbPath = resolve(pathArg);
console.log(`Checking database at: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables:", tables.map(t => t.name).join(", "));
  
  if (tables.some(t => t.name === 'clients')) {
    const clients = db.query("SELECT * FROM clients").all();
    console.log(`Total clients: ${clients.length}`);
    clients.forEach(c => {
      console.log(`- ${c.nombre} ${c.apellido} (Group: ${c.grupoId})`);
    });
  }

  if (tables.some(t => t.name === 'groups')) {
    const groups = db.query("SELECT * FROM groups").all();
    console.log(`Total groups: ${groups.length}`);
    groups.forEach(g => {
      console.log(`- ${g.name} (ID: ${g.id})`);
    });
  }
} catch (error) {
  console.error(error);
}
