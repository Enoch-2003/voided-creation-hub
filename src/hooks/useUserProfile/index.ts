
// This file exports utilities from the useUserProfile directory.
// The actual useUserProfile hook is defined and exported from ../useUserProfile.ts

export * from './transformUtils';
export * from './fetchUserProfile';
export * from './updateUser';
export * from './userSubscription';

// The problematic line "export { useUserProfile } from './useUserProfile/index';" has been removed.
// If there was a useUserProfile hook defined within this directory (e.g. in a file like _useUserProfileHook.ts)
// it would be exported here, e.g. "export * from './_useUserProfileHook';"
