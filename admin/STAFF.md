# Staff Member Roles & Permissions

This document outlines the recommended staff roles for the ParcelPeer admin system, their responsibilities, permissions, and implementation guide.

## 🎯 Recommended: Customer Support Staff Role

### Overview
A Customer Support Staff role provides a middle tier between regular users and full administrators, allowing you to delegate routine customer service tasks while maintaining security and control.

### What They Would Handle

1. **User Verification**
   - Verify new user accounts
   - Check identity documents
   - Approve or reject verification requests
   - Flag suspicious accounts

2. **Basic Dispute Resolution**
   - Handle simple disputes between users
   - Communicate with disputing parties
   - Gather information and evidence
   - Escalate complex cases to admins
   - Track dispute progress

3. **Review Moderation**
   - Review user-submitted reviews
   - Delete inappropriate or offensive content
   - Flag spam or fake reviews
   - Maintain platform quality standards

4. **User Support**
   - Answer user questions
   - Help with account issues
   - Guide users through platform features
   - Resolve common problems
   - Provide technical assistance

5. **Transaction Support**
   - Help with payment inquiries
   - Assist with wallet questions
   - Explain transaction history
   - Guide users through payment processes
   - Cannot process refunds (admin only)

6. **Route Inquiries**
   - Assist users with route-related questions
   - Help carriers optimize routes
   - Provide route information
   - Coordinate between senders and carriers

### Permissions Matrix

| Feature | User | Support | Admin |
|---------|------|---------|-------|
| View Dashboard | ❌ | ✅ | ✅ |
| View Users | ❌ | ✅ | ✅ |
| Verify Users | ❌ | ✅ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |
| Promote to Admin | ❌ | ❌ | ✅ |
| View Parcels | ❌ | ✅ | ✅ |
| Update Parcel Status | ❌ | ✅ | ✅ |
| Delete Parcels | ❌ | ❌ | ✅ |
| View Routes | ❌ | ✅ | ✅ |
| Update Routes | ❌ | ❌ | ✅ |
| View Payments | ❌ | ✅ | ✅ |
| Process Refunds | ❌ | ❌ | ✅ |
| View Reviews | ❌ | ✅ | ✅ |
| Delete Reviews | ❌ | ✅ | ✅ |
| View Disputes | ❌ | ✅ | ✅ |
| Comment on Disputes | ❌ | ✅ | ✅ |
| Resolve Disputes | ❌ | ❌ | ✅ |
| View Subscriptions | ❌ | ✅ | ✅ |
| Cancel Subscriptions | ❌ | ❌ | ✅ |
| View Wallet Transactions | ❌ | ✅ | ✅ |
| Adjust Wallets | ❌ | ❌ | ✅ |
| Access Settings | ❌ | ❌ | ✅ |

### Support Staff Capabilities

#### ✅ Can Do:
- View all platform data (read-only for most)
- Verify user accounts
- Update parcel tracking status
- Moderate and delete reviews
- Add comments to disputes
- Communicate with users
- Generate support reports
- Export data for analysis
- Create support tickets
- Update ticket status

#### ❌ Cannot Do:
- Delete user accounts
- Manage admin accounts
- Process financial refunds
- Cancel subscriptions
- Delete parcels or routes
- Modify payment records
- Change system settings
- Access admin-only features
- Promote users to admin
- Adjust wallet balances

## 🔧 Implementation Guide

### 1. Database Schema Changes

```typescript
// In shared/schema.ts - Update the users table

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  
  // Update role field to include 'support'
  role: text('role', { enum: ['user', 'support', 'admin'] })
    .notNull()
    .default('user'),
  
  // ... other fields
})
```

### 2. Middleware for Support Access

```typescript
// In server/middleware/rbac.ts

export const requireSupport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.user.role === 'support' || req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ 
      error: 'Forbidden: Support or Admin access required' 
    })
  }
}

// For admin-only routes (existing)
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ 
      error: 'Forbidden: Admin access required' 
    })
  }
}
```

### 3. Backend Routes Organization

```typescript
// In server/routes.ts

// Support-accessible routes (support + admin)
app.get('/api/support/users', requireSupport, supportRoutes.getUsers)
app.patch('/api/support/users/:id/verify', requireSupport, supportRoutes.verifyUser)
app.get('/api/support/disputes', requireSupport, supportRoutes.getDisputes)
app.post('/api/support/disputes/:id/comment', requireSupport, supportRoutes.addComment)

// Admin-only routes
app.delete('/api/admin/users/:id', requireAdmin, adminRoutes.deleteUser)
app.post('/api/admin/disputes/:id/resolve', requireAdmin, adminRoutes.resolveDispute)
app.patch('/api/admin/subscriptions/:id/cancel', requireAdmin, adminRoutes.cancelSubscription)
```

### 4. Frontend Role Management

```typescript
// In admin/src/contexts/AuthContext.tsx

interface User {
  id: string
  email: string
  role: 'user' | 'support' | 'admin'
  // ... other fields
}

// Check permissions
export function hasPermission(user: User, permission: string): boolean {
  const permissions = {
    admin: ['*'], // All permissions
    support: [
      'view_users',
      'verify_users',
      'view_parcels',
      'update_parcel_status',
      'view_disputes',
      'comment_disputes',
      'moderate_reviews',
      // ... support permissions
    ],
    user: []
  }
  
  return permissions[user.role].includes(permission) || 
         permissions[user.role].includes('*')
}
```

### 5. Support Dashboard Page

```typescript
// In admin/src/pages/SupportDashboard.tsx

export default function SupportDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support Dashboard</h1>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction 
          title="Pending Verifications"
          count={pendingVerifications}
          icon={<UserCheck />}
          link="/support/verifications"
        />
        <QuickAction 
          title="Open Disputes"
          count={openDisputes}
          icon={<AlertTriangle />}
          link="/support/disputes"
        />
        <QuickAction 
          title="Flagged Reviews"
          count={flaggedReviews}
          icon={<Flag />}
          link="/support/reviews"
        />
      </div>
      
      {/* Recent Support Tickets */}
      <RecentTickets />
      
      {/* Activity Log */}
      <SupportActivityLog />
    </div>
  )
}
```

### 6. Update Layout Navigation

```typescript
// In admin/src/components/Layout.tsx

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'support'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'support'] },
  { name: 'Parcels', href: '/parcels', icon: Package, roles: ['admin', 'support'] },
  { name: 'Routes', href: '/routes', icon: Route, roles: ['admin'] }, // Admin only
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['admin'] }, // Admin only
  { name: 'Reviews', href: '/reviews', icon: Star, roles: ['admin', 'support'] },
  { name: 'Disputes', href: '/disputes', icon: AlertTriangle, roles: ['admin', 'support'] },
  { name: 'Subscriptions', href: '/subscriptions', icon: Sparkles, roles: ['admin'] },
  { name: 'Wallet', href: '/wallet', icon: Wallet, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
]

// Filter navigation by role
const visibleNav = navigation.filter(item => 
  item.roles.includes(user.role)
)
```

## 💡 Alternative Staff Role Options

### Option 2: Dispute Resolution Specialist

**Focus**: Dedicated dispute handling

**Responsibilities:**
- Handle all dispute cases
- Mediate between parties
- Investigate claims
- Propose resolutions
- Track dispute metrics
- Generate dispute reports

**Permissions:**
- ✅ Full access to disputes
- ✅ View related parcels and payments
- ✅ View user profiles
- ✅ Communicate with users
- ❌ Cannot process refunds (admin approves)

**When to use:**
- High volume of disputes
- Need specialized dispute handlers
- Want detailed dispute tracking

### Option 3: Operations Manager

**Focus**: Logistics and operations

**Responsibilities:**
- Monitor route performance
- Manage carrier relationships
- Optimize delivery routes
- Track operational metrics
- Coordinate logistics
- Generate operations reports

**Permissions:**
- ✅ Full access to routes
- ✅ View parcels and tracking
- ✅ Update route information
- ✅ View carrier data
- ✅ Access operations analytics
- ❌ Cannot access user personal data
- ❌ Cannot process payments

**When to use:**
- Growing logistics operations
- Need route optimization
- Managing carrier network

### Option 4: Financial Manager

**Focus**: Financial operations

**Responsibilities:**
- Handle payment inquiries
- Review transactions
- Manage subscriptions
- Process refunds (with approval)
- Generate financial reports
- Monitor revenue metrics

**Permissions:**
- ✅ View all payments
- ✅ View wallet transactions
- ✅ Propose refunds
- ✅ View subscription data
- ✅ Access financial analytics
- ❌ Cannot access user personal data
- ❌ Cannot modify payments directly

**When to use:**
- Need dedicated financial oversight
- High transaction volume
- Complex subscription management

## 🎨 UI/UX Considerations

### Support Dashboard Features

1. **Quick Actions Panel**
   - Pending verifications count
   - Open disputes count
   - Flagged content count
   - Today's tasks

2. **Support Queue**
   - Prioritized task list
   - Ticket assignment
   - Status tracking
   - Time tracking

3. **User Communication**
   - In-app messaging
   - Email templates
   - Notification system
   - Communication history

4. **Performance Metrics**
   - Tickets resolved
   - Response time
   - User satisfaction
   - Individual performance

5. **Knowledge Base**
   - Common solutions
   - Support guides
   - FAQ management
   - Internal documentation

### Role Indicator

```typescript
// Show role badge in layout
<div className="flex items-center space-x-2">
  <span className={`px-2 py-1 text-xs rounded-full ${
    user.role === 'admin' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800'
  }`}>
    {user.role === 'admin' ? '👑 Admin' : '🛟 Support'}
  </span>
</div>
```

## 📊 Benefits of Support Staff Role

### 1. Scalability
- Admins can delegate routine tasks
- Handle more users without hiring more admins
- Support staff can be in different time zones
- Better 24/7 coverage

### 2. Efficiency
- Support staff handle 80% of routine issues
- Admins focus on strategic decisions
- Faster response times for users
- Reduced admin workload

### 3. Security
- Limited permissions reduce risk
- Support staff can't access sensitive functions
- Audit trail for all support actions
- Separation of duties

### 4. Cost-Effective
- Support staff typically cost less than admins
- Don't need full admin training
- Can specialize in customer service
- Better resource allocation

### 5. Better User Experience
- More staff available to help
- Faster response times
- Specialized support focus
- Improved customer satisfaction

## 🚀 Implementation Roadmap

### Phase 1: Backend (Week 1)
- [ ] Update database schema
- [ ] Create support middleware
- [ ] Add support routes
- [ ] Implement permission checks
- [ ] Add activity logging
- [ ] Write tests

### Phase 2: Frontend (Week 2)
- [ ] Create support dashboard
- [ ] Add role selection in user management
- [ ] Implement permission-based UI
- [ ] Add support-specific pages
- [ ] Create role indicators
- [ ] Update navigation

### Phase 3: Features (Week 3)
- [ ] Build ticket system
- [ ] Add user messaging
- [ ] Create support queue
- [ ] Implement performance tracking
- [ ] Add knowledge base
- [ ] Setup notifications

### Phase 4: Testing & Launch (Week 4)
- [ ] Test all permissions
- [ ] User acceptance testing
- [ ] Create documentation
- [ ] Train support staff
- [ ] Gradual rollout
- [ ] Monitor and iterate

## 📚 Documentation Needs

### For Support Staff
1. **Support Staff Handbook**
   - Role responsibilities
   - How to use the dashboard
   - Common tasks guide
   - Escalation procedures
   - Communication guidelines

2. **Training Materials**
   - Video tutorials
   - Written guides
   - Practice scenarios
   - Knowledge base articles

### For Administrators
1. **Role Management Guide**
   - How to create support accounts
   - Permission management
   - Monitoring support activity
   - Performance evaluation

2. **Security Guidelines**
   - Access control policies
   - Data protection rules
   - Incident response
   - Audit procedures

## 🔐 Security Considerations

### Access Control
- Support staff use same authentication as admins
- JWT tokens include role information
- Backend validates role on every request
- Frontend hides unauthorized features

### Audit Logging
```typescript
// Log all support actions
await createAuditLog({
  userId: req.user.id,
  role: req.user.role,
  action: 'VERIFY_USER',
  resourceId: userId,
  details: { reason: 'Document verified' },
  timestamp: new Date()
})
```

### Data Protection
- Support staff can view user data
- Cannot export bulk personal data
- Cannot modify sensitive fields
- All actions are logged

### Regular Reviews
- Quarterly permission audits
- Review support staff activity
- Update permissions as needed
- Remove inactive accounts

## 📈 Success Metrics

### Support Performance
- Average response time
- Tickets resolved per day
- User satisfaction rating
- Escalation rate

### System Impact
- Reduction in admin workload
- Faster issue resolution
- Increased user satisfaction
- Cost per support ticket

### Quality Metrics
- Accuracy of resolutions
- Repeat ticket rate
- Policy compliance
- User feedback scores

## 🎓 Training Program

### Week 1: Platform Overview
- Platform features and functionality
- User journey understanding
- Common user issues
- Platform policies

### Week 2: Tools & Systems
- Support dashboard training
- Ticket system usage
- Communication tools
- Reporting systems

### Week 3: Scenarios & Practice
- Real scenario practice
- Role-playing exercises
- Escalation procedures
- Quality standards

### Week 4: Shadowing & Go-Live
- Shadow experienced staff
- Supervised support
- Feedback and coaching
- Full access granted

## 📞 Support

For questions about staff roles and implementation:
- Review this documentation
- Check the main README.md
- Contact the development team
- Review code examples in repository

---

**Recommended Next Steps:**
1. Review this document with your team
2. Decide which staff role(s) to implement
3. Create implementation timeline
4. Assign development resources
5. Plan training program
6. Gradual rollout with monitoring

**Status**: 📋 Planning Document
**Version**: 1.0
**Last Updated**: January 2025
