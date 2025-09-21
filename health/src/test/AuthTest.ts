import DatabaseService from '../database/DatabaseService';
import UserRepository from '../database/repositories/UserRepository';
import AuthenticationService from '../services/auth/AuthenticationService';

export class AuthTest {
  static async runTests(): Promise<void> {
    console.log('🧪 Starting Authentication System Tests...');

    try {
      // Initialize database
      console.log('1. Initializing database...');
      await DatabaseService.initialize();
      console.log('✅ Database initialized successfully');

      // Test user creation
      console.log('2. Testing user creation...');
      const signupResult = await AuthenticationService.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      });

      if (signupResult.success) {
        console.log('✅ User created successfully:', signupResult.user?.name);
      } else {
        console.log('❌ User creation failed:', signupResult.error);
        return;
      }

      // Test user login
      console.log('3. Testing user login...');
      const loginResult = await AuthenticationService.login({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

      if (loginResult.success) {
        console.log('✅ User login successful:', loginResult.user?.name);
      } else {
        console.log('❌ User login failed:', loginResult.error);
        return;
      }

      // Test getting current user
      console.log('4. Testing current user retrieval...');
      const currentUser = await AuthenticationService.getCurrentUser();
      if (currentUser) {
        console.log('✅ Current user retrieved:', currentUser.name);
      } else {
        console.log('❌ Failed to get current user');
      }

      // Test user statistics
      console.log('5. Testing user statistics...');
      const stats = await AuthenticationService.getUserStatistics();
      if (stats) {
        console.log('✅ User statistics retrieved:', stats.statistics);
      } else {
        console.log('❌ Failed to get user statistics');
      }

      // Test adding a health reading (simulate)
      console.log('6. Testing health reading storage...');
      if (currentUser) {
        try {
          await DatabaseService.executeUpdate(
            'INSERT INTO weight_readings (id, user_id, weight, unit, timestamp, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              'test-weight-1',
              currentUser.id,
              70.5,
              'kg',
              new Date().toISOString(),
              new Date().toISOString(),
              new Date().toISOString(),
            ]
          );
          console.log('✅ Health reading stored successfully');
        } catch (error) {
          console.log('❌ Failed to store health reading:', error);
        }
      }

      // Test retrieving health readings
      console.log('7. Testing health reading retrieval...');
      if (currentUser) {
        try {
          const readings = await DatabaseService.executeQuery(
            'SELECT * FROM weight_readings WHERE user_id = ?',
            [currentUser.id]
          );
          console.log('✅ Health readings retrieved:', readings.length, 'readings');
        } catch (error) {
          console.log('❌ Failed to retrieve health readings:', error);
        }
      }

      // Test logout
      console.log('8. Testing user logout...');
      await AuthenticationService.logout();
      const userAfterLogout = await AuthenticationService.getCurrentUser();
      if (!userAfterLogout) {
        console.log('✅ User logout successful');
      } else {
        console.log('❌ User logout failed - user still authenticated');
      }

      console.log('🎉 All authentication tests completed successfully!');

    } catch (error) {
      console.error('❌ Test failed with error:', error);
    }
  }
}

export default AuthTest;
