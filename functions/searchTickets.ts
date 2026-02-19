import sql from 'npm:mssql@10.0.0';

Deno.serve(async (req) => {
  let pool;
  try {
    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    const password = Deno.env.get('SQL_SERVER_PASSWORD');
    if (!password) {
      return Response.json({ error: 'SQL_SERVER_PASSWORD not set in environment' }, { status: 500 });
    }

    const config = {
      server: 'roundhouse.proxy.rlwy.net',
      port: 20151,
      user: 'sa',
      password: password,
      database: 'master',
      authentication: { type: 'default' },
      options: { encrypt: true, trustServerCertificate: true }
    };

    pool = new sql.ConnectionPool(config);
    await pool.connect();

    const searchCode = code.trim().toUpperCase();
    const result = await pool.request()
      .input('code', sql.NVarChar(255), searchCode)
      .query('SELECT * FROM ticket_orders WHERE UPPER(confirmation_code) = @code');

    return Response.json({ results: result.recordset || [] });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (pool) await pool.close();
  }
});