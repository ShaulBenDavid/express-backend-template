import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { googleSignInSchema } from './auth.schema.js';

export const authRouter = Router();

/**
 * FRONTEND INTEGRATION — POST /api/v1/auth/google
 *
 * 1. Load the Google Identity Services script:
 *    <script src="https://accounts.google.com/gsi/client" async defer></script>
 *
 * 2. Initialize the Google client with your Client ID:
 *    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse })
 *
 * 3. Render the sign-in button or call google.accounts.id.prompt()
 *
 * 4. In the callback, send the credential (ID token) to this endpoint:
 *    POST /api/v1/auth/google  →  body: { idToken: response.credential }
 *
 * 5. Store the returned accessToken (e.g. in memory or sessionStorage).
 *    The refreshToken is automatically stored in an HTTP-only cookie.
 *
 * 6. Attach the accessToken to protected requests:
 *    Authorization: Bearer <accessToken>
 */
authRouter.post('/google', validate(googleSignInSchema), authController.googleSignIn);

authRouter.post('/refresh', authController.refresh);

authRouter.post('/logout', authController.logout);
