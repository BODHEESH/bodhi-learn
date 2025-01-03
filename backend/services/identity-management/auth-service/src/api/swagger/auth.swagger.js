// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\v1\swagger\auth.swagger.js

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and authorization endpoints
 *
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and return tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account blocked or requires MFA
 *
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Invalidate current session and tokens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully
 *
 * /api/v1/auth/password/reset:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *
 * /api/v1/auth/password/update:
 *   post:
 *     tags: [Authentication]
 *     summary: Update password
 *     description: Update user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordUpdateRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid password format
 *       401:
 *         description: Current password incorrect
 *
 * /api/v1/auth/mfa/setup:
 *   post:
 *     tags: [Authentication]
 *     summary: Setup MFA
 *     description: Generate and return MFA setup information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MFASetupResponse'
 *
 * /api/v1/auth/mfa/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify MFA code
 *     description: Verify TOTP or backup code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MFAVerifyRequest'
 *     responses:
 *       200:
 *         description: MFA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid MFA code
 *
 * /api/v1/auth/mfa/disable:
 *   post:
 *     tags: [Authentication]
 *     summary: Disable MFA
 *     description: Disable MFA for current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MFAVerifyRequest'
 *     responses:
 *       204:
 *         description: MFA disabled successfully
 *       401:
 *         description: Invalid MFA code
 */
