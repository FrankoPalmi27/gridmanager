import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id },
      include: { tenant: true }
    });

    if (user) {
      // User exists, return it
      return done(null, user);
    }

    // Check if user exists with same email (local account)
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.emails?.[0]?.value },
      include: { tenant: true }
    });

    if (existingUser) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          provider: 'google'
        },
        include: { tenant: true }
      });
      return done(null, user);
    }

    // For new Google users, we'll handle tenant creation in the frontend
    // Return the Google profile data for the frontend to process
    return done(null, {
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      provider: 'google',
      isNewUser: true
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id || user.googleId);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: id },
          { googleId: id }
        ]
      },
      include: { tenant: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;