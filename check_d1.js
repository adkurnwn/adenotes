import { Database } from 'sqlite3';

// Path to wrangler local state D1 database
const fs = require('fs');
const path = require('path');

const stateDir = path.join(__dirname, '.wrangler/state/v3/d1');
let dbFile = null;

if (fs.existsSync(stateDir)) {
    const files = fs.readdirSync(stateDir).filter(f => f.endsWith('.sqlite'));
    if (files.length > 0) {
        // Assume miniflare randomly named sqlite file
        dbFile = path.join(stateDir, files[0]);
    }
}

if (!dbFile) {
    console.error("No D1 local database found");
    process.exit(1);
}

const db = new Database(dbFile);

db.all('SELECT id, name, slug, owner_email FROM categories LIMIT 5;', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Categories via SQLite:");
        console.log(JSON.stringify(rows, null, 2));
    }
});

db.all('SELECT id, title, slug, owner_email FROM documents LIMIT 5;', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("\nDocuments via SQLite:");
        console.log(JSON.stringify(rows, null, 2));
    }
});

db.close();
