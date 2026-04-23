import { changePassword, login } from "../services/authService.js";

export async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password, req);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function postChangePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePassword(req.user.id, currentPassword, newPassword, req);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
