/**
 * migrate-to-schedules.cjs
 * 
 * Moves yearly amount data from sponsors and vendors tables
 * into sponsor_schedule and vendor_schedule tables.
 * 
 * Usage:
 *   $env:DATABASE_URL="postgresql://..."
 *   node migrate-to-schedules.cjs
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();

  try {
    // ─── Create vendor_schedule table ───
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_schedule (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id),
        year INTEGER NOT NULL,
        amount NUMERIC(10,2) DEFAULT 0,
        paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ vendor_schedule table created');

    // ─── Populate sponsor_schedule from sponsors table ───
    // Clear existing schedule data first
    await client.query('DELETE FROM sponsor_schedule');

    const sponsors = await client.query('SELECT id, amt_2024, amt_2025, amt_2026, amt_2027, amt_2028 FROM sponsors');
    let sponsorCount = 0;

    for (const s of sponsors.rows) {
      const years = [
        { year: 2024, amt: parseFloat(s.amt_2024) || 0 },
        { year: 2025, amt: parseFloat(s.amt_2025) || 0 },
        { year: 2026, amt: parseFloat(s.amt_2026) || 0 },
        { year: 2027, amt: parseFloat(s.amt_2027) || 0 },
        { year: 2028, amt: parseFloat(s.amt_2028) || 0 },
      ];

      for (const y of years) {
        if (y.amt > 0) {
          await client.query(
            'INSERT INTO sponsor_schedule (sponsor_id, year, amount) VALUES ($1, $2, $3)',
            [s.id, y.year, y.amt]
          );
          sponsorCount++;
        }
      }
    }
    console.log(`✓ ${sponsorCount} sponsor schedule entries created`);

    // ─── Populate vendor_schedule from vendors table ───
    const vendors = await client.query('SELECT id, amt_2024, amt_2025, paid_2025, amt_2026, paid_2026, amt_2027, paid_2027, amt_2028, paid_2028 FROM vendors');
    let vendorCount = 0;

    for (const v of vendors.rows) {
      const years = [
        { year: 2024, amt: parseFloat(v.amt_2024) || 0, paid: false },
        { year: 2025, amt: parseFloat(v.amt_2025) || 0, paid: v.paid_2025 || false },
        { year: 2026, amt: parseFloat(v.amt_2026) || 0, paid: v.paid_2026 || false },
        { year: 2027, amt: parseFloat(v.amt_2027) || 0, paid: v.paid_2027 || false },
        { year: 2028, amt: parseFloat(v.amt_2028) || 0, paid: v.paid_2028 || false },
      ];

      for (const y of years) {
        if (y.amt > 0) {
          await client.query(
            'INSERT INTO vendor_schedule (vendor_id, year, amount, paid) VALUES ($1, $2, $3, $4)',
            [v.id, y.year, y.amt, y.paid]
          );
          vendorCount++;
        }
      }
    }
    console.log(`✓ ${vendorCount} vendor schedule entries created`);

    // ─── Add paid column to sponsor_schedule if not exists ───
    try {
      await client.query('ALTER TABLE sponsor_schedule ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false');
      console.log('✓ Added paid column to sponsor_schedule');
    } catch(e) { /* already exists */ }

    console.log('\n✅ Done! Yearly data moved to schedule tables.');
    console.log('You can now remove the amt_20XX columns from sponsors/vendors if desired.');

  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
