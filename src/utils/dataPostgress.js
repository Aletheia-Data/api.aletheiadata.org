const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.NEON_POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

exports.find = async (params, query) => {
    return new Promise(async (resolve, reject) => {
        let baseQuery = `SELECT * FROM ${params.entity}`;
        let conditions = [];
        let values = [];

        if (query.id) {
            conditions.push(`id = $${values.length + 1}`);
            values.push(query.id);
        }

        for (const key in query) {
            if (!['limit', 'id', 'start', 'projection', 'sort'].includes(key)) {
                if (key === 'title' || key === 'name' || key === 'description') {
                    conditions.push(`${key} ILIKE $${values.length + 1}`);
                    values.push(`%${query[key]}%`);
                } else {
                    conditions.push(`${key} = $${values.length + 1}`);
                    values.push(query[key]);
                }
            }
        }

        if (conditions.length > 0) {
            baseQuery += ` WHERE ` + conditions.join(' AND ');
        }

        if (query.sort) {
            const sortFields = query.sort.split(',').map(field => {
                const [col, order] = field.split(':');
                return `${col} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
            }).join(', ');
            baseQuery += ` ORDER BY ` + sortFields;
        }

        baseQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(query.limit ? parseInt(query.limit) : 25);
        values.push(query.start ? parseInt(query.start) : 0);
        console.log('query: ', baseQuery);
        
        try {
            const result = await pool.query(baseQuery, values);
            resolve(result.rows);
        } catch (error) {
            console.error('Query failed:', error);
            reject(error);
        }
    });
};
