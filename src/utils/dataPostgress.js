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

      if (query.id) {
          conditions.push(`id = $${values.length + 1}`);
          values.push(query.id);
      }

      for (const key in query) {
          if (!['limit', 'id', 'start', 'projection', 'sort', 'count'].includes(key)) {
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

      // Handle sorting and pagination if needed for data query
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
          if (query.count === 'true') {
              // If count=true, only return the count
              const countResult = await pool.query(countQuery, values);
              const totalCount = countResult.rows[0].count;
              resolve({
                  totalCount: parseInt(totalCount), // Send back the total count
              });
          } else {
              // Else, run the main query for the data
              const result = await pool.query(baseQuery, values);
              resolve({
                  data: result.rows,
              });
          }
      } catch (error) {
          console.error('Query failed:', error);
          reject(error);
      }
  });
};
