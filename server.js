// server.js

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sanj@123',
  database: 'staff_leave_management',
});



connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

app.get('/', (req, res) => {
  res.send('Welcome to the Staff Leave Management API'); // You can customize this response
})

app.post('/login', (req, res) => {
  const sql = "SELECT * FROM Users WHERE email = ? AND password = ?";
  

  connection.query(sql, [req.body.email,req.body.password], (err, data) => {
    if (err) {
      return res.json("error");

    }

    if (data.length > 0) {
      // User found, login successful
      return res.json("Login Successful");
    } else {
      // No user found, login failed
      return res.json("Login Failed");
    }
  });
});

app.post('/Hodhome', (req, res) => {
  const { email, password } = req.body;

  const hodLoginSql = 'SELECT * FROM Admin WHERE email = ? AND password = ?';

  connection.query(hodLoginSql, [email, password], (err, data) => {
    if (err) {
      console.error('Error during HOD login:', err);
      return res.json({ status: 'error', message: 'Error during HOD login' });
    }

    if (data.length > 0) {
      // HOD login successful
      return res.json({ status: 'success', message: 'HOD login successful' });
    } else {
      // HOD login failed
      return res.json({ status: 'error', message: 'Invalid HOD credentials' });
    }
  });
});

// ... (existing code)

app.post('/addStaff', (req, res) => {
  // Extract form data
  const { staffId, firstName, lastName, gender, email, department, hireDate, contactNumber } = req.body;

  // Fetch dept_id from Department table based on d_name
  const fetchDeptIdSql = 'SELECT dept_id FROM Department WHERE d_name = ?';

  connection.query(fetchDeptIdSql, [department], (fetchDeptIdErr, fetchDeptIdResults) => {
    if (fetchDeptIdErr) {
      console.error('Error fetching dept_id:', fetchDeptIdErr);
      return res.json({ status: 'error', message: 'Error fetching department ID' });
    }

    if (fetchDeptIdResults.length === 0) {
      return res.json({ status: 'error', message: 'Department not found' });
    }

    const deptId = fetchDeptIdResults[0].dept_id;

    // Insert data into Staff table
    const insertStaffSql = 'INSERT INTO Staff (staff_id, F_name, L_name, Gender, email, dept_id, hire_date, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    connection.query(
      insertStaffSql,
      [staffId, firstName, lastName, gender, email, deptId, hireDate, contactNumber],
      (insertStaffErr, insertStaffResults) => {
        if (insertStaffErr) {
          console.error('Error inserting into Staff:', insertStaffErr);
          return res.json({ status: 'error', message: 'Error inserting into Staff table' });
        }

        return res.json({ status: 'success', message: 'Staff added successfully' });
      }
    );
  });
});

app.get('/api/staff', (req, res) => {
  const fetchStaffSql = `
    SELECT staff_id, F_name, L_name, Gender, email, dept_id, hire_date, contact_number
    FROM Staff
  `;

  connection.query(fetchStaffSql, (fetchStaffErr, fetchStaffResults) => {
    if (fetchStaffErr) {
      console.error('Error fetching data from Staff:', fetchStaffErr);
      return res.json({ status: 'error', message: 'Error fetching data from Staff table' });
    }

    return res.json(fetchStaffResults);
  });
});

app.post('/leaveRequest', (req, res) => {
  // Extract form data
  const { staffId, leaveType, sDates, eDates, designation, department, reason } = req.body;

  // Fetch leave_type_id from LeaveType table based on leave_type_name
  const fetchLeaveTypeIdSql = 'SELECT leave_type_id FROM LeaveType WHERE leave_type_name = ?';

  connection.query(fetchLeaveTypeIdSql, [leaveType], (fetchLeaveTypeIdErr, fetchLeaveTypeIdResults) => {
    if (fetchLeaveTypeIdErr) {
      console.error('Error fetching leave_type_id:', fetchLeaveTypeIdErr);
      return res.json({ status: 'error', message: 'Error fetching leave type ID' });
    }

    if (fetchLeaveTypeIdResults.length === 0) {
      return res.json({ status: 'error', message: 'Leave type not found' });
    }

    const leaveTypeId = fetchLeaveTypeIdResults[0].leave_type_id;

    // Fetch dept_id from Department table based on d_name
    const fetchDeptIdSql = 'SELECT dept_id FROM Department WHERE d_name = ?';

    connection.query(fetchDeptIdSql, [department], (fetchDeptIdErr, fetchDeptIdResults) => {
      if (fetchDeptIdErr) {
        console.error('Error fetching dept_id:', fetchDeptIdErr);
        return res.json({ status: 'error', message: 'Error fetching department ID' });
      }

      if (fetchDeptIdResults.length === 0) {
        return res.json({ status: 'error', message: 'Department not found' });
      }

      const deptId = fetchDeptIdResults[0].dept_id;

      // Calculate the difference between start and end dates to get number_of_days
      const startDate = new Date(sDates);
      const endDate = new Date(eDates);
      const timeDifference = endDate - startDate;
      const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

      // Insert data into LeaveRequest table
      const insertLeaveRequestSql = `
        INSERT INTO LeaveRequest
        (staff_id, leave_type_id, start_date, end_date, designation, dept_id, number_of_days, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        insertLeaveRequestSql,
        [staffId, leaveTypeId, sDates, eDates, designation, deptId, numberOfDays, reason],
        (insertLeaveRequestErr, insertLeaveRequestResults) => {
          if (insertLeaveRequestErr) {
            console.error('Error inserting into LeaveRequest:', insertLeaveRequestErr);
            return res.json({ status: 'error', message: 'Error inserting into LeaveRequest table' });
          }

          return res.json({ status: 'success', message: 'Leave request submitted successfully' });
        }
      );
    });
  });
});


// server.js

// ... (existing code)

// server.js

// ... (existing code)


app.put('/editStaff/:staffId', (req, res) => {
  const staffId = req.params.staffId;
  const updatedStaffDetails = req.body;

  // Update data in the Staff table
  const updateStaffSql = `
    UPDATE Staff
    SET F_name = ?, L_name = ?, Gender = ?, email = ?, dept_id = ?, hire_date = ?, contact_number = ?
    WHERE staff_id = ?
  `;

  connection.query(
    updateStaffSql,
    [
      updatedStaffDetails.firstName,
      updatedStaffDetails.lastName,
      updatedStaffDetails.gender,
      updatedStaffDetails.email,
      updatedStaffDetails.department,
      updatedStaffDetails.hireDate,
      updatedStaffDetails.contactNumber,
      staffId,
    ],
    (updateStaffErr, updateStaffResults) => {
      if (updateStaffErr) {
        console.error('Error updating Staff details:', updateStaffErr);
        return res.json({ status: 'error', message: 'Error updating Staff details' });
      }

      return res.json({ status: 'success', message: 'Staff details updated successfully' });
    }
  );
});

// ... (existing code)


// ... (existing code)
app.get('/api/department/:departmentName', (req, res) => {
  const departmentName = req.params.departmentName;

  const fetchDeptIdSql = 'SELECT dept_id FROM Department WHERE d_name = ?';

  connection.query(fetchDeptIdSql, [departmentName], (fetchDeptIdErr, fetchDeptIdResults) => {
    if (fetchDeptIdErr) {
      console.error('Error fetching dept_id:', fetchDeptIdErr);
      return res.json({ status: 'error', message: 'Error fetching department ID' });
    }

    return res.json(fetchDeptIdResults);
  });
});


app.delete('/deleteStaff/:staffId', (req, res) => {
  const staffId = req.params.staffId;

  const deleteStaffSql = 'DELETE FROM Staff WHERE staff_id = ?';

  connection.query(deleteStaffSql, [staffId], (deleteStaffErr, deleteStaffResults) => {
    if (deleteStaffErr) {
      console.error('Error deleting Staff:', deleteStaffErr);
      return res.json({ status: 'error', message: 'Error deleting Staff' });
    }

    return res.json({ status: 'success', message: 'Staff deleted successfully' });
  });
});


// server.js

// ... (existing code)

app.post('/alternateArrangement', async (req, res) => {
  const arrangements = req.body.arrangements;

  try {
    // Loop through each arrangement and process it
    for (const arrangement of arrangements) {
      const { date } = arrangement;

      // Check if the date falls within the range specified by start_date and end_date in LeaveRequest
      const leaveRequestQuery = `
        SELECT leave_request_id
        FROM LeaveRequest
        WHERE start_date <= ? AND end_date >= ?
      `;

      const leaveRequestResult = await executeQuery(leaveRequestQuery, [date, date]);

      if (leaveRequestResult.length > 0) {
        // Date falls within the range, get the leave_request_id
        const leaveRequestId = leaveRequestResult[0].leave_request_id;

        // Now, store the data in the AlternateArrangement table
        const insertArrangementQuery = `
          INSERT INTO AlternateArrangement
          (leave_request_id, date, subject_lab_name, class, time, alternate_faculty_name)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        await executeQuery(insertArrangementQuery, [
          leaveRequestId,
          arrangement.date,
          arrangement.subjectLab,
          arrangement.classValue,
          arrangement.time,
          arrangement.alternateFacultyName,
        ]);
      } else {
        // Date does not fall within any leave request range, handle accordingly
        console.log(`No leave request found for the date: ${date}`);
      }
    }

    return res.json({ status: 'success', message: 'Alternate arrangement details submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ status: 'error', message: 'Error processing alternate arrangement details' });
  }
});

// Function to execute SQL queries with promises
function executeQuery(query, values) {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// ... (existing code)





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});