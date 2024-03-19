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
  const fetchLeaveTypeIdSql = 'SELECT leave_type_id, total_days FROM LeaveType WHERE leave_type_name = ?';

  connection.query(fetchLeaveTypeIdSql, [leaveType], (fetchLeaveTypeIdErr, fetchLeaveTypeIdResults) => {
    if (fetchLeaveTypeIdErr) {
      console.error('Error fetching leave_type_id:', fetchLeaveTypeIdErr);
      return res.json({ status: 'error', message: 'Error fetching leave type ID' });
    }

    if (fetchLeaveTypeIdResults.length === 0) {
      return res.json({ status: 'error', message: 'Leave type not found' });
    }

    const leaveTypeId = fetchLeaveTypeIdResults[0].leave_type_id;
    const totalDays = fetchLeaveTypeIdResults[0].total_days;

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

          // Insert or update data in LeaveBalance table
          const insertLeaveBalanceSql = `
            INSERT INTO LeaveBalance (staff_id, leave_type_id, balance)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)
          `;

          connection.query(
            insertLeaveBalanceSql,
            [staffId, leaveTypeId, totalDays],
            (insertLeaveBalanceErr, insertLeaveBalanceResults) => {
              if (insertLeaveBalanceErr) {
                console.error('Error inserting into LeaveBalance:', insertLeaveBalanceErr);
                return res.json({ status: 'error', message: 'Error updating LeaveBalance table' });
              }

              return res.json({ status: 'success', message: 'Leave request submitted successfully' });
            }
          );
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

      // Fetch the leave_request_id and staff_id from LeaveRequest based on date
      const leaveRequestQuery = `
        SELECT leave_request_id, staff_id
        FROM LeaveRequest
        WHERE start_date <= ? AND end_date >= ?
      `;

      const leaveRequestResult = await executeQuery(leaveRequestQuery, [date, date]);

      if (leaveRequestResult.length > 0) {
        const { leave_request_id, staff_id } = leaveRequestResult[0];

        // Now, store the data in the AlternateArrangement table
        const insertArrangementQuery = `
          INSERT INTO AlternateArrangement
          (leave_request_id, staff_id, date, subject_lab_name, class, time, alternate_faculty_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await executeQuery(insertArrangementQuery, [
          leave_request_id,
          staff_id,
          arrangement.date,
          arrangement.subjectLab,
          arrangement.classValue,
          arrangement.time,
          arrangement.alternateFacultyName,
        ]);

        // Update the status in the Approval table
        const updateApprovalQuery = `
          INSERT INTO \approval\
          (leave_request_id, status)
          VALUES (?, ?)
        `;

        await executeQuery(updateApprovalQuery, [leave_request_id, 'Pending']);
      } else {
        // Date does not fall within any leave request range, handle accordingly
        console.log(`No leave request found for the date: ${date}`);
      }
    }

    return res.json({ status: 'success', message: 'Data submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ status: 'error', message: 'Error processing data' });
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

app.get('/api/pendingLeaveRequests', (req, res) => {
  const fetchPendingLeaveRequestsSql = `
    SELECT lr.staff_id, lr.leave_type_id, lr.start_date, lr.end_date,
          lr.designation, lr.dept_id, lr.number_of_days, lr.reason, a.status,
          CONCAT(s.F_name, ' ', s.L_name) AS staff_name, lt.leave_type_name
    FROM LeaveRequest lr
    JOIN Staff s ON lr.staff_id = s.staff_id
    JOIN LeaveType lt ON lr.leave_type_id = lt.leave_type_id
    JOIN Approval a ON lr.leave_request_id = a.leave_request_id
    WHERE a.status= 'Pending';
  `;

  connection.query(fetchPendingLeaveRequestsSql, (fetchPendingLeaveRequestsErr, fetchPendingLeaveRequestsResults) => {
    if (fetchPendingLeaveRequestsErr) {
      console.error('Error fetching pending leave requests:', fetchPendingLeaveRequestsErr);
      return res.json({ status: 'error', message: 'Error fetching pending leave requests' });
    }

    return res.json(fetchPendingLeaveRequestsResults);
  });
});


app.get('/api/alternateArrangement/:staffId', (req, res) => {
  const staffId = req.params.staffId;

  const fetchArrangementsSql = `
    SELECT aa.arrangement_id, aa.date, aa.subject_lab_name, aa.class, aa.time, aa.alternate_faculty_name
    FROM AlternateArrangement aa
    WHERE aa.staff_id = ?
  `;

  connection.query(fetchArrangementsSql, [staffId], (err, results) => {
    if (err) {
      console.error('Error fetching alternate arrangements:', err);
      return res.json({ status: 'error', message: 'Error fetching alternate arrangements' });
    }
    return res.json(results);
  });
});

app.get('/api/leaveBalance/:staffId', (req, res) => {
  const staffId = req.params.staffId;

  const fetchLeaveBalanceSql = `
    SELECT lb.leave_type_id, lb.balance
    FROM LeaveBalance lb
    WHERE lb.staff_id = ?
  `;

  connection.query(fetchLeaveBalanceSql, [staffId], (err, results) => {
    if (err) {
      console.error('Error fetching leave balance:', err);
      return res.json({ status: 'error', message: 'Error fetching leave balance' });
    }
    return res.json(results);
  });
});

app.put('/api/approveLeave/:leaveRequestId', (req, res) => {
  const leaveRequestId = req.params.leaveRequestId;
  const { status } = req.body;

  // Update the status in the Approval table
  const updateQuery = `
    UPDATE Approval
    SET status = ?
    WHERE leave_request_id = ?
  `;

  connection.query(updateQuery, [status, leaveRequestId], (error, results) => {
    if (error) {
      console.error('Error updating leave approval status:', error);
      res.status(500).json({ status: 'error', message: 'Error updating leave approval status' });
      return;
    }
    res.json({ status: 'success', message: 'Leave approval status updated successfully' });
  });
});


app.get('/api/leaveBalance/:staffId', (req, res) => {
  const staffId = req.params.staffId;

  const fetchLeaveBalanceSql = `
    SELECT lb.leave_type_id, lb.balance
    FROM LeaveBalance lb
    WHERE lb.staff_id = ?
  `;

  connection.query(fetchLeaveBalanceSql, [staffId], (err, results) => {
    if (err) {
      console.error('Error fetching leave balance:', err);
      return res.json({ status: 'error', message: 'Error fetching leave balance' });
    }
    return res.json(results);
  });
});

app.put('/api/approveLeave1/:staffId', (req, res) => {
  const staffId = req.params.staffId;
  const { status } = req.body;
  console.log(staffId);
  // Query to retrieve leave_request_id based on staff_id
  const leaveRequestIdQuery = `
    SELECT lr.leave_request_id
    FROM LeaveRequest lr
    WHERE lr.staff_id = ?
  `;

  connection.query(leaveRequestIdQuery, [staffId], (error, results) => {
    if (error) {
      console.error('Error retrieving leave_request_id:', error);
      res.status(500).json({ status: 'error', message: 'Error updating leave approval status' });
      return;
    }
    console.log(results);
    if (results.length === 0) {
      console.error('No leave request found for staff_id:', staffId);
      res.status(404).json({ status: 'error', message: 'No leave request found for staff' });
      return;
    }

    // Extract leave_request_id from the results
    const leaveRequestId = results[0].leave_request_id;

    // Update query using the retrieved leave_request_id
    const updateQuery = `
      UPDATE Approval
      SET status = ?
      WHERE leave_request_id = ?
    `;

    connection.query(updateQuery, [status, leaveRequestId], (updateError, updateResults) => {
      if (updateError) {
        console.error('Error updating leave approval status:', updateError);
        res.status(500).json({ status: 'error', message: 'Error updating leave approval status' });
        return;
      }

      res.json({ status: 'success', message: 'Leave approval status updated successfully' });
    });
  });
});



app.get('/api/approvedLeaveRequests', (req, res) => {
  const fetchapprovedLeaveRequestsSql = `
    SELECT lr.staff_id, lr.leave_type_id, lr.start_date, lr.end_date,
          lr.designation, lr.dept_id, lr.number_of_days, lr.reason, a.status,
          CONCAT(s.F_name, ' ', s.L_name) AS staff_name, lt.leave_type_name
    FROM LeaveRequest lr
    JOIN Staff s ON lr.staff_id = s.staff_id
    JOIN LeaveType lt ON lr.leave_type_id = lt.leave_type_id
    JOIN Approval a ON lr.leave_request_id = a.leave_request_id
    WHERE a.status= 'Approved';
  `;

  connection.query(fetchapprovedLeaveRequestsSql, (fetchapprovedLeaveRequestsErr, fetchapprovedLeaveRequestsResults) => {
    if (fetchapprovedLeaveRequestsErr) {
      console.error('Error fetching approved leave requests:', fetchapprovedLeaveRequestsErr);
      return res.json({ status: 'error', message: 'Error fetching approved leave requests' });
    }

    return res.json(fetchapprovedLeaveRequestsResults);
  });
});


app.put('/api/declineleave/:staffId', (req, res) => {
  const staffId = req.params.staffId;
  const { status } = req.body;
  console.log(staffId);
  // Query to retrieve leave_request_id based on staff_id
  const leaveRequestIdQuery = `
    SELECT lr.leave_request_id
    FROM LeaveRequest lr
    WHERE lr.staff_id = ?
  `;

  connection.query(leaveRequestIdQuery, [staffId], (error, results) => {
    if (error) {
      console.error('Error retrieving leave_request_id:', error);
      res.status(500).json({ status: 'error', message: 'Error updating leave decline status' });
      return;
    }
    console.log(results);
    if (results.length === 0) {
      console.error('No leave request found for staff_id:', staffId);
      res.status(404).json({ status: 'error', message: 'No leave request found for staff' });
      return;
    }

    // Extract leave_request_id from the results
    const leaveRequestId = results[0].leave_request_id;

    // Update query using the retrieved leave_request_id
    const updateQuery = `
      UPDATE Approval
      SET status = ?
      WHERE leave_request_id = ?
    `;

    connection.query(updateQuery, [status, leaveRequestId], (updateError, updateResults) => {
      if (updateError) {
        console.error('Error updating leave decline status:', updateError);
        res.status(500).json({ status: 'error', message: 'Error updating leave decline status' });
        return;
      }

      res.json({ status: 'success', message: 'Leave decline status updated successfully' });
    });
  });
});


app.get('/api/declinedLeaveRequests', (req, res) => {
  const fetchdeclinedLeaveRequestsSql = `
    SELECT lr.staff_id, lr.leave_type_id, lr.start_date, lr.end_date,
          lr.designation, lr.dept_id, lr.number_of_days, lr.reason, a.status,
          CONCAT(s.F_name, ' ', s.L_name) AS staff_name, lt.leave_type_name
    FROM LeaveRequest lr
    JOIN Staff s ON lr.staff_id = s.staff_id
    JOIN LeaveType lt ON lr.leave_type_id = lt.leave_type_id
    JOIN Approval a ON lr.leave_request_id = a.leave_request_id
    WHERE a.status= 'Declined';
  `;

  connection.query(fetchdeclinedLeaveRequestsSql, (fetchdeclinedLeaveRequestsErr, fetchdeclinedLeaveRequestsResults) => {
    if (fetchdeclinedLeaveRequestsErr) {
      console.error('Error fetching declined leave requests:', fetchdeclinedLeaveRequestsErr);
      return res.json({ status: 'error', message: 'Error fetching declined leave requests' });
    }

    return res.json(fetchdeclinedLeaveRequestsResults);
  });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});