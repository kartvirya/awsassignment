# Development User Testing Guide

## How to Test Different User Roles

The application now includes a **Development User Switcher** that allows you to quickly switch between different user roles for testing purposes. This is only available in development mode.

### Using the Dev User Switcher

1. **Access the Switcher**: Look for the orange "Dev Mode" button in the bottom-right corner of the screen
2. **Switch Users**: Click the button to open the user switcher panel
3. **Select User**: Choose any user from the list to switch to their account
4. **Test Features**: Navigate through the dashboard to test role-specific features

### Available Test Users

#### Students
- **Alice Johnson** (student1)
  - Email: alice.johnson@email.com
  - Has completed sessions and progress data
  - Active conversations with counselors

- **Bob Smith** (student2)
  - Email: bob.smith@email.com
  - Has some sessions and resource progress
  - Pending session requests

- **Emma Davis** (student3)
  - Email: emma.davis@email.com
  - New user with minimal activity

#### Counsellors
- **Dr. Sarah Wilson** (counsellor1)
  - Email: dr.sarah.wilson@email.com
  - Has multiple students assigned
  - Active sessions and resource uploads

- **Dr. Michael Brown** (counsellor2)
  - Email: dr.michael.brown@email.com
  - Handles group sessions
  - Resource creator

- **Dr. Lisa Garcia** (counsellor3)
  - Email: dr.lisa.garcia@email.com
  - Specializes in audio resources
  - Individual sessions

#### Admins
- **Admin Jones** (admin1)
  - Email: admin.jones@email.com
  - Full system access
  - User management capabilities

- **Admin Taylor** (admin2)
  - Email: admin.taylor@email.com
  - Alternative admin account
  - System configuration access

### Testing Features by Role

#### As a Student:
- View personal dashboard with session progress
- Browse available CBT resources
- Book sessions with counsellors
- Send/receive messages
- Track progress on resources

#### As a Counsellor:
- Manage student sessions
- Upload and manage resources
- View student progress
- Handle session requests
- Message students

#### As an Admin:
- User management (create/edit/delete users)
- System settings and configuration
- View analytics and reports
- Manage all sessions and resources
- System-wide messaging

### Sample Data Available

The system includes:
- **5 Sessions** with different statuses (pending, confirmed, completed)
- **5 Resources** of various types (worksheets, videos, audio, interactive)
- **5 Messages** between different users
- **5 Progress Records** showing user interaction with resources

### Quick Navigation Tips

1. **Dashboard Navigation**: Use the sidebar to switch between different sections
2. **Quick Actions**: Use the overview page buttons to jump directly to specific features
3. **Role-Specific Views**: Each role has customized dashboard sections
4. **Real-time Updates**: The interface updates when you switch users

### Testing Scenarios

1. **Student Journey**: 
   - Switch to Alice → View progress → Book session → Send message

2. **Counsellor Workflow**:
   - Switch to Dr. Wilson → Review pending sessions → Check student progress → Upload resource

3. **Admin Tasks**:
   - Switch to Admin Jones → View user analytics → Manage system settings → Monitor all activity

### Notes

- All data is stored in a real PostgreSQL database
- User switching persists until you clear it or switch to another user
- The dev switcher is only available in development mode
- All features are fully functional with real data, not mock data