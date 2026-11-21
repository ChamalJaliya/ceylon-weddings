import { createZodDto } from "nestjs-zod";
import {
  accountSecuritySchema,
  authResponseSchema,
  changePasswordBodySchema,
  googleAuthBodySchema,
  healthResponseSchema,
  loginBodySchema,
  registerBodySchema,
  twoFactorCodeBodySchema,
  twoFactorSetupSchema,
  updatePreferencesBodySchema,
  updateProfileBodySchema,
  userSchema,
} from "@ceylonweddings/contracts";

export class LoginDto extends createZodDto(loginBodySchema) {}
export class RegisterDto extends createZodDto(registerBodySchema) {}
export class GoogleAuthDto extends createZodDto(googleAuthBodySchema) {}
export class AuthResponseDto extends createZodDto(authResponseSchema) {}
export class UserDto extends createZodDto(userSchema) {}
export class HealthResponseDto extends createZodDto(healthResponseSchema) {}

export class Verify2FaDto extends createZodDto(twoFactorCodeBodySchema) {}
export class UpdateProfileDto extends createZodDto(updateProfileBodySchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordBodySchema) {}
export class AccountSecurityDto extends createZodDto(accountSecuritySchema) {}
export class TwoFactorSetupDto extends createZodDto(twoFactorSetupSchema) {}
export class UpdatePreferencesDto extends createZodDto(updatePreferencesBodySchema) {}
