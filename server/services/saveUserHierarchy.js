const pool = require('../db');

async function saveUserHierarchy(userObj) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = {
  firstName: userObj.firstName || 'John',
  lastName: userObj.lastName || 'Doe',
  companyName: userObj.companyName || '',
  email: userObj.email,
  password: userObj.password || 'default123!',
  jobRole: userObj.jobRole || '',
  address1: userObj.address1 || '',
  address2: userObj.address2 || '',
  city: userObj.city || '',
  state: userObj.state || '',
  phone: userObj.phone || '',
  country: userObj.country || '',
  postalCode: userObj.postalCode || '',
  agreeTerms: userObj.agreeTerms || false,
  agreeMarketing: userObj.agreeMarketing || false,
};

    console.log('userObj received in saveUserHierarchy:', userObj);


    // 1. Insert User
// Check if user exists
const { rows: existing } = await client.query(
  `SELECT id FROM users WHERE email = $1`,
  [user.email]
);

let userId;

if (existing.length > 0) {
  userId = existing[0].id;
  console.log(`User already exists. Using existing ID: ${userId}`);
} else {
  // Insert if not exists
  const insertUserQuery = `
    INSERT INTO users (
      first_name, last_name, company_name, email, password, job_role,
      address1, address2, city, state, phone, country, postal_code,
      agree_terms, agree_marketing
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
    ) RETURNING id
  `;

  const insertRes = await client.query(insertUserQuery, [
    user.firstName, user.lastName, user.companyName,
    user.email, user.password, user.jobRole,
    user.address1, user.address2, user.city, user.state,
    user.phone, user.country, user.postalCode,
    user.agreeTerms, user.agreeMarketing
  ]);

  userId = insertRes.rows[0].id;
  console.log('Inserted new user with ID:', userId);
}


    // 2. Loop through the hierarchy
    for (const org of userObj.organisations || []) {
      const { rows: [{ id: orgId }] } = await client.query(
        `INSERT INTO organisations (user_id, name) VALUES ($1, $2) RETURNING id`,
        [userId, org.name]
      );

      for (const proj of org.projects || []) {
        const { rows: [{ id: projId }] } = await client.query(
          `INSERT INTO projects (organisation_id, name) VALUES ($1, $2) RETURNING id`,
          [orgId, proj.name]
        );

        for (const sub of proj.subprojects || []) {
          const { rows: [{ id: subId }] } = await client.query(
            `INSERT INTO subprojects (project_id, name) VALUES ($1, $2) RETURNING id`,
            [projId, sub.name]
          );

          for (const test of sub.testSetups || []) {
            const { rows: [{ id: testId }] } = await client.query(
              `INSERT INTO test_setups (subproject_id, name) VALUES ($1, $2) RETURNING id`,
              [subId, test.name]
            );

            for (const cable of test.cableIDs || []) {
              const { rows: [{ id: cableId }] } = await client.query(
                `INSERT INTO cable_ids (test_setup_id, name) VALUES ($1, $2) RETURNING id`,
                [testId, cable.name]
              );

              for (const fiber of cable.fibers || []) {
                const { rows: [{ id: fiberId }] } = await client.query(
                  `INSERT INTO fibers (cable_id, name) VALUES ($1, $2) RETURNING id`,
                  [cableId, fiber.name]
                );

                for (const mpo of fiber.mpoLossLength || []) {
                  await client.query(
                    `INSERT INTO mpo_loss_lengths (fiber_id, name) VALUES ($1, $2)`,
                    [fiberId, mpo.name]
                  );
                }

                for (const inspector of fiber.fiberInspectors || []) {
                  await client.query(
                    `INSERT INTO fiber_inspectors (fiber_id, name) VALUES ($1, $2)`,
                    [fiberId, inspector.name]
                  );
                }
              }
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('User hierarchy saved under user ID', userId);
    return userId;

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to save user hierarchy:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = saveUserHierarchy;
