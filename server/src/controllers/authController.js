import { login } from "../services/authService.js";

export async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (e) {
    next(e);
  }
}
