import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import sql from 'npm:mssql@10.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const config = {
            server: 'holmgraphics.database.windows.net',
            database: 'HolmdaleFarms',
            user: 'darren',
            password: Deno.env.get('SQL_SERVER_PASSWORD'),
            port: 1433,
            options: {
                encrypt: true,
                trustServerCertificate: false
            }
        };

        console.log('Connecting to SQL Server...');
        await sql.connect(config);

        console.log('Fetching Staff data...');
        const result = await sql.query`SELECT * FROM Staff`;

        console.log(`Found ${result.recordset.length} staff records`);

        if (result.recordset.length === 0) {
            return Response.json({ 
                success: true, 
                message: 'No staff records found',
                data: []
            });
        }

        // Show sample data structure
        const sampleRecord = result.recordset[0];
        console.log('Sample record:', sampleRecord);

        // Import to Base44 if Staff entity exists
        try {
            const imported = await base44.asServiceRole.entities.Staff.bulkCreate(
                result.recordset.map(record => ({
                    ...record,
                    // Add any field transformations here if needed
                }))
            );

            return Response.json({ 
                success: true, 
                message: `Imported ${imported.length} staff records`,
                sample: sampleRecord,
                imported: imported.length
            });
        } catch (entityError) {
            // If Staff entity doesn't exist yet, return the data structure
            return Response.json({
                success: false,
                message: 'Staff entity not found. Create it first based on this structure:',
                sampleRecord: sampleRecord,
                columns: Object.keys(sampleRecord),
                totalRecords: result.recordset.length,
                data: result.recordset
            });
        }

    } catch (error) {
        console.error('Import error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    } finally {
        await sql.close();
    }
});