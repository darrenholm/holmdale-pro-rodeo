/**
 * migrate-sponsors-vendors.js
 * 
 * Run this script to create sponsors, vendors, sign_locations, and sponsor_schedule
 * tables in your Railway Postgres database, then import data from the uploaded files.
 * 
 * Usage:
 *   Set DATABASE_URL env variable, then:
 *   node migrate-sponsors-vendors.js
 * 
 *   Or pass it inline:
 *   DATABASE_URL="postgresql://..." node migrate-sponsors-vendors.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ─── Parse pipe-delimited table format ─────────────────────
function parseTable(text) {
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 1) return [];
  
  // First line with pipes is the header
  const headerLine = lines[0];
  const headers = headerLine.split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|')
      .map(c => c.trim())
      .filter((c, idx) => idx > 0 && idx <= headers.length);
    
    if (cols.length === 0) continue;
    
    const row = {};
    headers.forEach((h, j) => {
      let val = (cols[j] || '').trim();
      if (val === '' || val === '-') val = null;
      row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

// ─── Sponsor data ──────────────────────────────────────────
const SPONSORS_DATA = `|        ID         |                SName                 |      Address      |       City        |     Province      |       Phone       |      Contact      |       Email       |      Amount       |    PostalCode     |     Sponsor20     |     Sponsor20     |     Sponsor20     |     Sponsor20     |     Sponsor20     |      Amt2025      |      Amt2026      |      Amt2027      |      Amt2028      |      Amt2024      |       Logo        |
|                 1 | Sprucedale Agromart                  |                   | Hanover           |                   |                   | April Weiler      | aweiler@s         |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |              1000 |                   |
|                 6 | Hanover Chrysler                     |                   | Hanover           | On                | 519-379-          | Mitch             | mfletcher@        |              5000 |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              5000 |                   |                   |                   |              5000 |                   |
|                 7 | Batte Pole Line                      |                   | Walkerton         | ON                | 519-901-          | Tyler Batte       | tyler_batte       |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              5000 |                   |                   |                   |              5000 |                   |
|                 8 | Ecostrat                             |                   |                   | ON                | 647-702-          | Rebecca           | rebecca@          |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              5000 |                   |
|                 9 | Matcrete Contracting                 |                   |                   |                   | 519-889-          | Aaron             | acf_14@ho         |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                10 | Teeswater Concrete                   |                   |                   | On                | 519-531-          | Mike Gowon        | mike@tee          |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                11 | Foerster Plumbing,                   |                   |                   | On                | 519-519-          | Luke              | heatherfoer       |                   |                   |                -1 |                 0 |                 0 |                 0 |                 0 |                   |                   |                   |                   |              1000 |                   |
|                13 | Sunbelt Rentals                      |                   | Walkerton         | On                | 519-379-          | Bryan             | brian.weiler      |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |               500 |                   |
|                14 | Tim Hortons                          |                   |                   |                   | 519-327-          | Katie             | timhanoverkm      |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                15 | Kubota / Howick                      |                   | Gorrie            | On                | 519-291-          | Adam Chicken      | howickfarms       |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                16 | MacLean's Ale                        |                   | Hanover           | ON                | 519-506-5         | Tyler Scott       | tyler@macl        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                17 | Independent Supply /                 |                   | Walkerton         | On                | 519 881-          | Robert/Ash        | ashleyd@in        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                18 | Forde's Source for                   |                   | Walkerton         | On                |                   | Steve Chicken     | forde_sfs@        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1500 |                   |                   |                   |              1500 |                   |
|                19 | Hanover Honda                        |                   | Hanover           | On                | 519-364-          | Paul              | paul@hanov        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                20 | NAPA                                 |                   | Walkerton         | On                | 519-881-          | Brian Chicken     | walkerton@        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                21 | Brockton Chev Buick                  |                   | Walkerton         | On                | 519-881-          | Adam              | adamdawson@       |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              5000 |                   |                   |                   |              5000 |                   |
|                22 | Chicken - Lawyer                     |                   | Walkerton         | On                | 519-881-          | Jim Chicken       |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1500 |                   |                   |                   |              1500 |                   |
|                23 | Chicken Farm Equip                   |                   | Mildmay           | On                |                   |                   |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                24 | Chicken Chicken Bran                 |                   | Walkerton         | On                |                   | Jessica           | jessica.he        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                25 | Chicken of Brockton                  |                   | Walkerton         | On                | 519 881-2         | Mike Hami         |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                26 | Quality Inn                          |                   | Walkerton         | On                | 226-678-          | Mike Hill         | walkerton.gm      |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                27 | Chicken Chicken                      |                   |                   | On                | 519-507-          | Fred              |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                28 | Chicken Chicken Cre                  |                   | Walkerton         | On                |                   |                   | keri@south        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1500 |                   |                   |                   |              2500 |                   |
|                29 | Chicken Chicken Bui                  |                   | Walkerton         |                   | 226-830-          | Tanner            | tannerchicken     |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                30 | Chicken Brothers                     |                   |                   |                   | 519-492-          | Sheldon           |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                31 | MDS Trucking                         |                   | Walkerton         |                   | 519-881-          | Mark              | mdstrucking       |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                32 | Chicken Chicken Cre                  |                   |                   |                   |                   | Jordan            | jordan@bro        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                33 | Canadian Tire                        |                   | Walkerton         |                   |                   |                   |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                34 | Chicken Chicken                      |                   |                   |                   | 519-880-          | Ady               |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                35 | Chicken Chicken Ava                  |                   |                   |                   | 519-377-          |                   | info@avalo        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                36 | Chicken Chicken                      |                   | Walkerton         | ON                |                   | Ryan              | ryan@south        |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |              2500 |                   |
|                37 | Chicken Chicken                      |                   | Walkerton         |                   | 519-507-          | Ross Green        | ross@walk         |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                38 | Chicken Chicken                      |                   |                   |                   |                   | Ryan              |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |              1000 |                   |
|                40 | Chicken Chicken                      |                   |                   |                   |                   | Danny             |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                41 | Bruce Power                          |                   |                   |                   |                   |                   |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |              5000 |                   |                   |                   |              5000 |                   |
|                42 | Chicken Chicken                      |                   |                   |                   | 519-376-          |                   |                   |                   |                   |                -1 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |               500 |                   |
|                43 | Chicken Chicken                      |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                44 | Chicken Chicken                      |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                45 | Chicken Chicken                      |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                46 | Chicken                              |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                47 | Chicken Excavating                   |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |                   |                   |
|                48 | Chicken                              |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                49 | Chicken RV                           |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                50 | Chicken Trucking                     |                   | Durham            |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                51 | C and P septic                       |                   | Teeswater         |                   | (519) 357-        |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1200 |                   |                   |                   |                   |                   |
|                52 | Young Farms                          |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                53 | 519 Table and Pour                   |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                54 | Weberdale Farms                      |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                55 | Premier Equipment                    |                   |                   |                   |                   | Todd              |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                56 | Dirt Pro Construction                |                   |                   |                   |                   | Dylan             |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              2500 |                   |                   |                   |                   |                   |
|                57 | Dawsons Tire & Auto                  | 318910            | Kemble            | ON                | 519 373-          |                   | Johndewy1         |                   | N4K 5N4           |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |
|                58 | 519 Truck Doctor                     |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |               500 |                   |                   |                   |                   |                   |
|                59 | Foxton fuels                         |                   |                   |                   |                   |                   |                   |                   |                   |                 0 |                -1 |                 0 |                 0 |                 0 |              1000 |                   |                   |                   |                   |                   |`;

const VENDORS_DATA = `|        ID         |       SName       |      Address      |       City        |     Province      |       Phone       |      Contact      |       Email       |    PostalCode     |    Vendor2024     |      Amt2024      |    Vendor2025     |      Amt2025      |     Paid2025      |    Vendor2026     |      Amt2026      |     Paid2026      |    Vendor2027     |      Amt2027      |     Paid2027      |    Vendor2028     |      Amt2028      |     Paid2028      |     BoothSize     |      Comment      |      Product      |
|                 1 | 6 & 10            |                   |                   |                   | 416-456-          | Oleg              | 6and10mar         |                   |                -1 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 2 | Pizza Hut         |                   |                   |                   | 647-333-          | Harddik           | hp7778800         |                   |                -1 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 3 | Low & Slow        |                   |                   |                   | 519-386-          | Bill              | lowandslo         |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 4 | Walkerton         |                   |                   |                   | 519-881-          | Cathy             | spitzig@wi        |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 5 | Dairy             |                   |                   |                   | (519) 495-        | Steph             |                   |                   |                 0 |                   |                -1 |               400 |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 6 | Saugeen           |                   |                   |                   | 519-375-          | Barb              | barbpandp         |                   |                 0 |                   |                -1 |                 0 |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 7 | Gifted            |                   |                   |                   | 519-509-          | Laura             | info@gifted       |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                 8 | The Hat           |                   |                   |                   | 7059704772        | Sherri            | thehateffect      |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   |                   |
|                10 | Cheesie           |                   |                   |                   | 519-706-          | Laureen           |                   |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   | Food              |
|                11 | Hot Rodz          |                   |                   |                   | 905-818-043       | Roddy             | hotrodzfoo        |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   | Food              |
|                13 | Vikki's           |                   |                   |                   |                   |                   |                   |                   |                 0 |                   |                -1 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                 0 |                   |                 0 |                   |                   | Hats and          |`;

const SIGN_LOCATIONS_DATA = `|        ID         |                  Location                   |    CrossStreet    |     Installed     |    InstallDate    |      Removed      |      RemoveD      |
|                 2 | Durham st                                   | Yonge.            |                -1 |        2024-07-29 |                 0 |                   |
|                 4 | SR10                                        | Conc 2            |                -1 |        2024-07-29 |                 0 |                   |
|                 5 | SR 10                                       | Conc 4            |                -1 |        2024-07-29 |                 0 |                   |
|                 6 | SR 10                                       | Conc 6            |                -1 |        2024-07-29 |                 0 |                   |
|                 7 | CR 19                                       | Conc 6            |                -1 |        2024-07-29 |                 0 |                   |
|                 9 | CR19                                        | Conc 8            |                -1 |        2024-07-29 |                 0 |                   |
|                11 | Conc 8                                      | East of SR        |                -1 |        2024-07-29 |                 0 |                   |
|                12 | Conc 8                                      | W of SR 10        |                -1 |        2024-07-29 |                 0 |                   |
|                13 | CR 3                                        | North of          |                -1 |        2024-07-29 |                 0 |                   |
|                15 | West of CR 3                                | Conc 8            |                -1 |        2024-07-30 |                 0 |                   |
|                16 | CR 3                                        | South of          |                -1 |        2024-07-29 |                 0 |                   |
|                18 | County Rd 19                                | Conc 2            |                -1 |        2024-07-29 |                 0 |                   |
|                19 | County Rd 19                                | Conc 4            |                -1 |        2024-07-29 |                 0 |                   |`;

const SPONSOR_SCHEDULE_DATA = `|        ID         |     SponsorID     |       Year        |      Amount       |
|                 2 |                 6 |              2025 |              5000 |`;

async function run() {
  const client = await pool.connect();

  try {
    console.log('Creating tables...');

    // ─── SPONSORS TABLE ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id SERIAL PRIMARY KEY,
        legacy_id INTEGER,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        province VARCHAR(50),
        phone VARCHAR(50),
        contact_name VARCHAR(255),
        email VARCHAR(255),
        postal_code VARCHAR(20),
        logo_url TEXT,
        amt_2024 NUMERIC(10,2) DEFAULT 0,
        amt_2025 NUMERIC(10,2) DEFAULT 0,
        amt_2026 NUMERIC(10,2) DEFAULT 0,
        amt_2027 NUMERIC(10,2) DEFAULT 0,
        amt_2028 NUMERIC(10,2) DEFAULT 0,
        active_2024 BOOLEAN DEFAULT false,
        active_2025 BOOLEAN DEFAULT false,
        active_2026 BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ sponsors table created');

    // ─── VENDORS TABLE ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        legacy_id INTEGER,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        city VARCHAR(100),
        province VARCHAR(50),
        phone VARCHAR(50),
        contact_name VARCHAR(255),
        email VARCHAR(255),
        postal_code VARCHAR(20),
        product VARCHAR(255),
        booth_size VARCHAR(100),
        comment TEXT,
        amt_2024 NUMERIC(10,2) DEFAULT 0,
        amt_2025 NUMERIC(10,2) DEFAULT 0,
        paid_2025 BOOLEAN DEFAULT false,
        amt_2026 NUMERIC(10,2) DEFAULT 0,
        paid_2026 BOOLEAN DEFAULT false,
        amt_2027 NUMERIC(10,2) DEFAULT 0,
        paid_2027 BOOLEAN DEFAULT false,
        amt_2028 NUMERIC(10,2) DEFAULT 0,
        paid_2028 BOOLEAN DEFAULT false,
        active_2024 BOOLEAN DEFAULT false,
        active_2025 BOOLEAN DEFAULT false,
        active_2026 BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ vendors table created');

    // ─── SIGN LOCATIONS TABLE ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS sign_locations (
        id SERIAL PRIMARY KEY,
        legacy_id INTEGER,
        location VARCHAR(255),
        cross_street VARCHAR(255),
        installed BOOLEAN DEFAULT false,
        install_date DATE,
        removed BOOLEAN DEFAULT false,
        remove_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ sign_locations table created');

    // ─── SPONSOR SCHEDULE TABLE ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS sponsor_schedule (
        id SERIAL PRIMARY KEY,
        legacy_id INTEGER,
        sponsor_id INTEGER REFERENCES sponsors(id),
        year INTEGER,
        amount NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ sponsor_schedule table created');

    // ─── IMPORT SPONSORS ───
    const sponsors = parseTable(SPONSORS_DATA);
    console.log(`\nImporting ${sponsors.length} sponsors...`);
    for (const s of sponsors) {
      const amt2024 = parseFloat(s.Amt2024) || 0;
      const amt2025 = parseFloat(s.Amt2025) || 0;
      const amt2026 = parseFloat(s.Amt2026) || 0;
      await client.query(`
        INSERT INTO sponsors (legacy_id, name, address, city, province, phone, contact_name, email, postal_code, amt_2024, amt_2025, amt_2026, active_2024, active_2025)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `, [
        parseInt(s.ID), s.SName, s.Address, s.City, s.Province, s.Phone, s.Contact, s.Email, s.PostalCode,
        amt2024, amt2025, amt2026,
        amt2024 > 0, amt2025 > 0
      ]);
    }
    console.log(`  ✓ ${sponsors.length} sponsors imported`);

    // ─── IMPORT VENDORS ───
    const vendors = parseTable(VENDORS_DATA);
    console.log(`\nImporting ${vendors.length} vendors...`);
    for (const v of vendors) {
      const amt2024 = parseFloat(v.Amt2024) || 0;
      const amt2025 = parseFloat(v.Amt2025) || 0;
      const paid2025 = (v.Paid2025 && parseInt(v.Paid2025) !== 0) ? true : false;
      const amt2026 = parseFloat(v.Amt2026) || 0;
      const paid2026 = (v.Paid2026 && parseInt(v.Paid2026) !== 0) ? true : false;
      await client.query(`
        INSERT INTO vendors (legacy_id, name, address, city, province, phone, contact_name, email, postal_code, product, booth_size, comment, amt_2024, amt_2025, paid_2025, amt_2026, paid_2026, active_2024, active_2025)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      `, [
        parseInt(v.ID), v.SName, v.Address, v.City, v.Province, v.Phone, v.Contact, v.Email, v.PostalCode,
        v.Product, v.BoothSize, v.Comment,
        amt2024, amt2025, paid2025, amt2026, paid2026,
        parseInt(v.Vendor2024) === -1, parseInt(v.Vendor2025) === -1
      ]);
    }
    console.log(`  ✓ ${vendors.length} vendors imported`);

    // ─── IMPORT SIGN LOCATIONS ───
    const signs = parseTable(SIGN_LOCATIONS_DATA);
    console.log(`\nImporting ${signs.length} sign locations...`);
    for (const sl of signs) {
      await client.query(`
        INSERT INTO sign_locations (legacy_id, location, cross_street, installed, install_date, removed)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        parseInt(sl.ID), sl.Location, sl.CrossStreet,
        parseInt(sl.Installed) === -1,
        sl.InstallDate || null,
        parseInt(sl.Removed) !== 0
      ]);
    }
    console.log(`  ✓ ${signs.length} sign locations imported`);

    // ─── IMPORT SPONSOR SCHEDULE ───
    const schedules = parseTable(SPONSOR_SCHEDULE_DATA);
    console.log(`\nImporting ${schedules.length} sponsor schedules...`);
    for (const ss of schedules) {
      // Find the sponsor by legacy_id
      const res = await client.query('SELECT id FROM sponsors WHERE legacy_id = $1', [parseInt(ss.SponsorID)]);
      const sponsorId = res.rows.length > 0 ? res.rows[0].id : null;
      await client.query(`
        INSERT INTO sponsor_schedule (legacy_id, sponsor_id, year, amount)
        VALUES ($1,$2,$3,$4)
      `, [parseInt(ss.ID), sponsorId, parseInt(ss.Year), parseFloat(ss.Amount) || 0]);
    }
    console.log(`  ✓ ${schedules.length} sponsor schedules imported`);

    console.log('\n✅ All done! Tables created and data imported.');

  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
