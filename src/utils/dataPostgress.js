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
        let countQuery = `SELECT COUNT(*) FROM ${params.entity}`;
        let conditions = [];
        let values = [];
        let joins = '';
        let selectedFields = [`${params.entity}.*`]; // Default: select all from main entity

        // Handle dynamic JOINs based on 'query.join'
        if (query.join) {
            const joinParams = query.join.split(',').map(join => join.trim());
            joinParams.forEach((join) => {
                const [table, onField, foreignField] = join.split(':');
                if (table && onField && foreignField) {
                    joins += ` LEFT JOIN ${table} ON ${onField} = ${table}.${foreignField} `;
                }
            });
        }

        // Handle Fields Selection with Aliases (table.field.alias)
        if (query.fields) {
            const fields = query.fields.split(',').map(field => field.trim());
            
            fields.forEach(field => {
                const parts = field.split('.');

                // If field has 3 parts (table.field.alias)
                if (parts.length === 3) {
                    // Handle join table fields
                    const [table, column, alias] = parts;
                    selectedFields.push(`${table}.${column} AS ${alias}`);
                }
                // If field has 2 parts (table.field)
                else if (parts.length === 2) {
                    const [table, column] = parts;
                    selectedFields.push(`${table}.${column}`);
                } 
                // If no table prefix (field)
                else {
                    selectedFields.push(`${params.entity}.${parts[0]}`);
                }
            });
        }

        // Handle dynamic sum (as COUNT)
        if (query.sum) {
            const sumParams = query.sum.split(',').map(sum => sum.trim());
            sumParams.forEach(sum => {
                const parts = sum.split('.');
                if (parts.length === 3) {
                    const [table, field, alias] = parts;
                    selectedFields.push(`COUNT(${table}.${field}) AS ${alias}`);
                }
            });
        }

        // Correct the table aliases in the query
        baseQuery = `SELECT ${selectedFields.join(', ')} FROM ${params.entity} ${joins}`;
        countQuery = `SELECT COUNT(*) FROM ${params.entity} ${joins}`;

        // Add conditions
        if (query.id) {
            conditions.push(`id = $${values.length + 1}`);
            values.push(query.id);
        }

        for (const key in query) {
            if (!['limit', 'id', 'start', 'projection', 'sort', 'count', 'groupBy', 'join', 'aggregate', 'fields', 'sum'].includes(key)) {
                if (['title', 'name', 'description'].includes(key)) {
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
            countQuery += ` WHERE ` + conditions.join(' AND ');
        }

        // Handle GROUP BY
        if (query.groupBy) {
            const groupByFields = query.groupBy.split(',').map(field => field.trim());
            baseQuery += ` GROUP BY ${groupByFields.join(', ')}`;
            countQuery = countQuery.replace('SELECT COUNT(*)', `SELECT COUNT(DISTINCT ${groupByFields.join(', ')})`);
        }

        // Sorting
        if (query.sort) {
            if (query.groupBy) {
                const sortFields = query.sort.split(',').map(field => {
                    const [col, order] = field.split(':');
                    return `${col} ${order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
                }).join(', ');
                baseQuery += ` ORDER BY ` + sortFields;
            } else {
                const sortFields = query.sort.split(',').map(field => {
                    const [col, order] = field.split(':');
                    return `${col} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
                }).join(', ');
                baseQuery += ` ORDER BY ` + sortFields;
            }
        }

        // Pagination
        baseQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(query.limit ? parseInt(query.limit) : 25);
        values.push(query.start ? parseInt(query.start) : 0);

        try {
            if (query.count === 'true') {
                console.log('making query: ', countQuery);
                const countResult = await pool.query(countQuery, values.slice(0, conditions.length));
                const totalCount = countResult.rows[0].count;
                resolve({ totalCount: parseInt(totalCount) });
            } else {
                console.log('making query: ', baseQuery);
                const result = await pool.query(baseQuery, values);
                resolve({ data: result.rows });
            }
        } catch (error) {
            console.error('Query failed:', error);
            reject(error);
        }
    });
};
