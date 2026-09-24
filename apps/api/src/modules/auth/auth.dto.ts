import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import {
  authResponseSchema,
  googleAuthBodySchema,
  healthResponseSchema,
  loginBodySchema,
  registerBodySchema,
  userSchema,
} from "@ceylonweddings/contracts";

export class LoginDto extends createZodDto(loginBodySchema) {}
export class RegisterDto extends createZodDto(registerBodySchema) {}
export class GoogleAuthDto extends createZodDto(googleAuthBodySchema) {}
export class AuthResponseDto extends createZodDto(authResponseSchema) {}
export class UserDto extends createZodDto(userSchema) {}
export class HealthResponseDto extends createZodDto(healthResponseSchema) {}

export class Verify2FaDto extends createZodDto(
  z.object({
    token: z.string().length(6),
  })
) {}

