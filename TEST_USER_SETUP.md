# Test User Setup

## Demo User with Mock Data

The application now supports a special demo user that uses rich mock data instead of real API calls. This is perfect for demonstrations, testing, and showcasing the application's features.

## Test User Details

- **Email**: `demo@easel.com`
- **Password**: Use any password that meets validation requirements
- **User ID**: 999999 (used internally)

## How It Works

When a user logs in with the email `demo@easel.com`, the frontend automatically detects this as the test user and:

- ✅ **Projects**: Shows 5 rich mock projects with different statuses
- ✅ **Azure Credentials**: Shows 3 mock Azure subscriptions  
- ✅ **Resources**: Shows realistic Azure resources with metrics
- ✅ **Conversations**: Shows AI conversation history
- ✅ **All API Calls**: Simulated with realistic delays

## Creating the Test User

### Option 1: Register Through UI
1. Go to `/register` in the application
2. Use email: `demo@easel.com`
3. Use any strong password (e.g., `DemoPassword123@`)
4. Fill in other required fields
5. Complete registration

### Option 2: Create Directly in Database
If you have database access, you can create the user directly:

```sql
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Company, EmailVerified, CreatedAt, LastLoginAt, IsActive)
VALUES (
  'demo@easel.com', 
  '[hash of your chosen password]',
  'Demo',
  'User', 
  'Easel Demo',
  1,
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z',
  1
);
```

## Mock Data Included

### Projects (5 projects)
- **E-commerce Platform** - Active with 3 resources
- **API Gateway Service** - Active with 1 resource  
- **Personal Blog Platform** - Provisioning status
- **Analytics Dashboard** - Draft status
- **Task Management System** - Analyzing status

### Azure Resources
- App Services, SQL Databases, Storage Accounts
- Realistic pricing and configuration
- Different resource states and locations

### Azure Credentials
- 3 mock subscriptions (Production, Development, Testing)
- Realistic subscription IDs and names
- Validation and management features working

## Benefits

1. **Rich Demo Experience**: Show all features without real Azure setup
2. **Safe Testing**: No real resources created or costs incurred
3. **Consistent Data**: Same demo data every time for presentations
4. **Performance**: Mock data loads faster than real API calls
5. **Offline Capable**: Works without real Azure connectivity

## For Other Users

All other users (any email except `demo@easel.com`) will:
- Use real API calls to the backend
- Require actual Azure credentials
- Create real Azure resources
- Have persistent data in the database

## Visual Indicator

When logged in as the demo user, a blue banner appears at the top of pages indicating "Demo Mode" so users know they're seeing mock data.

## Development Notes

The test user detection is implemented in:
- `/lib/test-user.ts` - Detection logic and constants
- `/lib/mock-data-enhanced.ts` - Rich mock data
- `/lib/projects.ts` - Conditional API calls
- `/lib/azure.ts` - Conditional API calls  
- `/components/ui/test-user-banner.tsx` - Visual indicator