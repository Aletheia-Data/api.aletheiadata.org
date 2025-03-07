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

    // Add conditions based on the query parameters
    if (query.id) {
        conditions.push(`id = $${values.length + 1}`);
        values.push(query.id);
    }

    for (const key in query) {
        if (!['limit', 'id', 'start', 'projection', 'sort', 'count', 'groupBy'].includes(key)) {
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
        countQuery += ` WHERE ` + conditions.join(' AND ');
    }

    // Check for 'groupBy' parameter and modify the query to group by the specified fields
    if (query.groupBy) {
      const groupByFields = query.groupBy.split(',').map(field => field.trim()); // Split by comma and trim spaces
      baseQuery = baseQuery.replace('SELECT *', `SELECT ${groupByFields.join(', ')}, COUNT(*) AS group_count`);
      baseQuery += ` GROUP BY ${groupByFields.join(', ')}`; // Add GROUP BY clause based on the groupBy fields
      countQuery = countQuery.replace('SELECT COUNT(*)', `SELECT COUNT(DISTINCT ${groupByFields.join(', ')})`); // Adjust count query to count distinct combinations of groupBy fields
    }

    // Handle sorting:
    if (query.sort) {
      if (query.groupBy){
        const sortOrder = query.sort && (query.sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') || 'DESC';
        baseQuery += ` ORDER BY group_count ${sortOrder}`;
      } else {
        const sortFields = query.sort.split(',').map(field => {
          const [col, order] = field.split(':');
          return `${col} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
        }).join(', ');
        baseQuery += ` ORDER BY ` + sortFields;
      }
    }

    // Add pagination parameters to the baseQuery only (not the countQuery)
    baseQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(query.limit ? parseInt(query.limit) : 25);
    values.push(query.start ? parseInt(query.start) : 0);

    console.log('Final base query: ', baseQuery);
    console.log('Query parameters: ', values);

    try {
      if (query.count === 'true') {
        console.log('Executing count query: ', countQuery, values.slice(0, conditions.length));
        // Execute the count query with only conditions (no LIMIT/OFFSET)
        const countResult = await pool.query(countQuery, values.slice(0, conditions.length)); // Pass only the necessary values
        console.log('Count result: ', countResult);
        const totalCount = countResult.rows[0].count;
        resolve({
          totalCount: parseInt(totalCount), // Send back only the count
        });
      } else {
        console.log('Executing main data query: ', baseQuery, values);
        const result = await pool.query(baseQuery, values);
        resolve({
          data: result.rows, // Send back the data rows
        });
      }
    } catch (error) {
      console.error('Query failed:', error);
      reject(error);
    }
  });
};
