import { authRepository } from "./auth.repository";
import { hashPassword, comparePassword } from "../utils/hash.utils";
import { signToken } from "../utils/jwt.utils";
import { ConflictError, UnauthorizedError, NotFoundError } from "../errors/app.errors";
import { RegisterDto, LoginDto, UpdateMeDto } from "./auth.schemas";

export const authService = {
  async register(dto: RegisterDto) {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await hashPassword(dto.password);
    const user = await authRepository.createUser({
      name:         dto.name,
      email:        dto.email,
      passwordHash,
      phone:        dto.phone,
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return { user, token };
  },

  async login(dto: LoginDto) {
    const user = await authRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async updateMe(userId: string, dto: UpdateMeDto) {
    return authRepository.updateUser(userId, dto);
  },
};
