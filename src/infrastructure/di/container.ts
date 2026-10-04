import { container } from 'tsyringe';
import { AuthController } from '../../presentation/controllers/user/auth/auth.controller';
import { AdminAuthController } from '../../presentation/controllers/admin/auth/admin.auth.controller';
import { UserManagementController } from '../../presentation/controllers/admin/user-management/user-management.controller';
import { registerDependencies } from './dependency-regestration';
import { PrismaClient } from '@prisma/client/extension';
import Redis from 'ioredis';
import { OnboardingController } from '../../presentation/controllers/user/onboarding/onboarding.controller';
import { LookupController } from '../../presentation/controllers/lookup/lookup.controller';
import { LocationController } from '../../presentation/controllers/user/location/location.controller';
import { UsersController } from '../../presentation/controllers/user/users/users.controller';
import { TripController } from '../../presentation/controllers/trip/trip.controller';
import { ConnectionsController } from '../../presentation/controllers/user/connections/connection.controller';
import { ProfileController } from '../../presentation/controllers/user/profile/profile.controller';
import { AdminsController } from '../../presentation/controllers/admin/admins/admins.controller';
import { AdminAuthMiddleware } from '../../presentation/middleware/user/auth/adminAuthMiddleware';
import { UserAuthMiddleware } from '../../presentation/middleware/user/auth/userAuth.middleware';
import { VerificationQueueController } from '../../presentation/controllers/admin/verification-queue/verification.controller';
import { AiAssistantController } from '../../presentation/controllers/user/ai-assistant/ai-assistant.controller';
import { ChatController } from '../../presentation/controllers/user/chat/chat.controller';
import { CallController } from '../../presentation/controllers/user/call/call.controller';
import { Server } from 'socket.io';
import { AdminAnalyticsController } from '../../presentation/controllers/admin/analytics/admin-analytics.controller';

export interface AppContainer {
  adminControllers: AdminControllers;
  authController: AuthController;
  onboardingController: OnboardingController;
  lookupController: LookupController;
  locationController: LocationController;
  usersController: UsersController;
  tripController: TripController;
  connectionsController: ConnectionsController;
  profileController: ProfileController;
  assistantController: AiAssistantController;
  authMiddlewares: AuthMiddlewares;
  chatController: ChatController;
  callController: CallController;
}

export interface AuthMiddlewares {
  adminAuthMiddleware: AdminAuthMiddleware;
  userAuthMiddleware: UserAuthMiddleware;
}
export interface AdminControllers {
  adminAuthController: AdminAuthController;
  userManagementController: UserManagementController;
  adminsController: AdminsController;
  verificationController: VerificationQueueController;
  adminAnalyticsController: AdminAnalyticsController;
}

export function buildContainer(
  db: PrismaClient,
  redis: Redis,
  io: Server,
): AppContainer {
  registerDependencies(db, redis, io);
  const authController = container.resolve(AuthController);
  const adminAuthController = container.resolve(AdminAuthController);
  const userManagementController = container.resolve(UserManagementController);
  const onboardingController = container.resolve(OnboardingController);
  const lookupController = container.resolve(LookupController);
  const locationController = container.resolve(LocationController);
  const usersController = container.resolve(UsersController);
  const tripController = container.resolve(TripController);
  const connectionsController = container.resolve(ConnectionsController);
  const profileController = container.resolve(ProfileController);
  const adminsController = container.resolve(AdminsController);
  const verificationController = container.resolve(VerificationQueueController);
  const assistantController = container.resolve(AiAssistantController);
  const chatController = container.resolve(ChatController);
  const callController = container.resolve(CallController);
  const adminAnalyticsController = container.resolve(AdminAnalyticsController);

  const adminAuthMiddleware = container.resolve(AdminAuthMiddleware);
  const userAuthMiddleware = container.resolve(UserAuthMiddleware);

  return {
    authController,
    adminControllers: {
      adminAuthController,
      userManagementController,
      adminsController,
      verificationController,
      adminAnalyticsController,
    },
    onboardingController,
    lookupController,
    locationController,
    usersController,
    tripController,
    connectionsController,
    profileController,
    authMiddlewares: {
      userAuthMiddleware,
      adminAuthMiddleware,
    },
    assistantController,
    chatController,
    callController,
  };
}
