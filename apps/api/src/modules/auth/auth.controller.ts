import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ZodResponse } from "nestjs-zod";
import type { Request, Response } from "express";
import {
  LoginDto,
  RegisterDto,
  GoogleAuthDto,
  AuthResponseDto,
  UserDto,
  Verify2FaDto,
} from "./auth.dto";
import { AuthService } from "./auth.service";
import { JwtCookieGuard } from "./jwt-cookie.guard";
import { CurrentUser } from "./current-user.decorator";
import type { User } from "@ceylonweddings/contracts";
import { RateLimit } from "../../common/rate-limit.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @RateLimit({ points: 10, duration: 60, errorMessage: "Too many registration attempts. Please try again in a minute." })
  @ZodResponse({ type: AuthResponseDto })
  register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.register(body, response);
  }

  @Post("login")
  @RateLimit({ points: 10, duration: 60, errorMessage: "Too many login attempts. Please wait a minute before trying again." })
  @ZodResponse({ type: AuthResponseDto })
  login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(body, response);
  }

  @Post("google")
  @RateLimit({ points: 15, duration: 60 })
  @ZodResponse({ type: AuthResponseDto })
  google(@Body() body: GoogleAuthDto, @Res({ passthrough: true }) response: Response) {
    return this.auth.google(body, response);
  }

  @Post("logout")
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.auth.logout(request, response);
  }

  @Get("me")
  @UseGuards(JwtCookieGuard)
  @ZodResponse({ type: UserDto })
  me(@CurrentUser() user: User) {
    return user;
  }

  @Post("2fa/generate")
  @UseGuards(JwtCookieGuard)
  generate2Fa(@CurrentUser() user: User) {
    return this.auth.generate2Fa(user);
  }

  @Post("2fa/enable")
  @UseGuards(JwtCookieGuard)
  enable2Fa(@CurrentUser() user: User, @Body() body: Verify2FaDto) {
    return this.auth.enable2Fa(user, body.token);
  }

  @Post("2fa/disable")
  @UseGuards(JwtCookieGuard)
  disable2Fa(@CurrentUser() user: User, @Body() body: Verify2FaDto) {
    return this.auth.disable2Fa(user, body.token);
  }
}

