
## Plan: Configure Super Admin User with Credentials

### Overview
Set up `deepesh.k.sharma@gmail.com` as the super admin with the password `Root@132#`. Since this is a fully API-driven application, the password must be configured on your **backend server**, not in the frontend code.

---

### What Needs to Be Done

#### Backend Configuration (Your Server)
Your backend needs to store the user credentials securely. Here's what to implement:

**1. Password Storage**
The password `Root@132#` must be hashed using a secure algorithm (bcrypt recommended) before storing in the database.

```sql
-- Example: Adding password_hash column to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Update with hashed password (done via your backend, NOT raw SQL)
-- The backend should hash 'Root@132#' using bcrypt and store the hash
```

**2. Backend Auth Endpoint Implementation**

Your `/api/auth/login` endpoint should:
1. Receive email and password
2. Look up user by email
3. Verify password against stored hash using bcrypt
4. Return JWT token with user info if valid

```javascript
// Example Node.js/Express implementation
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = await db.query(
    'SELECT u.*, get_user_role(u.id) as role FROM users u WHERE email = $1 AND is_active = true',
    [email]
  );
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Update last login
  await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
  
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
```

**3. Create the Super Admin Account**

Run this on your backend (Node.js example):
```javascript
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
  const email = 'deepesh.k.sharma@gmail.com';
  const password = 'Root@132#';
  const saltRounds = 12;
  
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Insert or update user with password
  await db.query(`
    INSERT INTO users (email, name, password_hash, is_active) 
    VALUES ($1, 'Deepesh K. Sharma', $2, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2
  `, [email, passwordHash]);
  
  // Ensure super_admin role is assigned
  await db.query(`
    INSERT INTO user_roles (user_id, role)
    SELECT id, 'super_admin' FROM users WHERE email = $1
    ON CONFLICT (user_id, role) DO NOTHING
  `, [email]);
}
```

---

### Database Schema Update

Add password_hash column to the users table:

```sql
-- Add to database/schema.sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
```

The updated users table will be:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200),
    password_hash VARCHAR(255),  -- NEW: Stores bcrypt hash
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

---

### Frontend Changes

No frontend changes are needed. The Login page already correctly:
- Collects email and password
- Sends credentials to `/api/auth/login`
- Stores the returned JWT token
- Navigates to dashboard on success

---

### Files to Modify

| File | Changes |
|------|---------|
| `database/schema.sql` | Add `password_hash` column to users table |

---

### Backend API Requirements

Your backend must implement these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Validate email/password, return JWT |
| `/api/auth/me` | GET | Return current user profile from JWT |
| `/api/auth/logout` | POST | Invalidate session (optional) |

---

### Security Considerations

1. **Never store plain text passwords** - Always use bcrypt with salt rounds of 12+
2. **Use HTTPS** - All API calls must be over HTTPS in production
3. **JWT Secret** - Use a strong, random JWT secret (at least 256 bits)
4. **Token Expiration** - Set reasonable expiration (24h recommended)
5. **Rate Limiting** - Implement login attempt rate limiting to prevent brute force

---

### Summary

The frontend is ready for authentication. You need to:
1. Add `password_hash` column to the users table in your database
2. Implement the `/api/auth/login` endpoint on your backend
3. Run a script to create the super admin with the hashed password

The login credentials will be:
- **Email**: `deepesh.k.sharma@gmail.com`
- **Password**: `Root@132#`
- **Role**: `super_admin` (full system access)
