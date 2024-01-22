import Boom from "@hapi/boom";
import bcrypt from "bcryptjs";
import express from "express";
import hasura from "../../clients/hasura";
import { signAccessToken, verifyAccessToken } from "./helpers";
import { INSERT_USER_MUTATION, IS_EXISTS_USER, LOGIN_QUERY } from "./queries";
import { loginSchema, registerSchema } from "./validation";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const input = req.body.input.data;
  input.email = input.email.toLowerCase();

  const { error } = registerSchema.validate(input);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  try {
    const isExistsUser = await hasura.request(IS_EXISTS_USER, {
      email: input.email,
    });

    if (isExistsUser.users.length > 0) {
      throw Boom.conflict(`User already exists (${input.email})`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const { insert_users_one: user } = await hasura.request(INSERT_USER_MUTATION, {
      input: {
        ...input,
        password: hashedPassword,
      },
    });
    const accessToken = await signAccessToken(user);

    res.json({
      accessToken,
    });
  } catch (error) {
    return next(Boom.badRequest(error));
  }
});

router.post("/login", async (req, res, next) => {
  const input = req.body.input.data;
  input.email = input.email.toLowerCase();

  const { error } = loginSchema.validate(input);
  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  try {
    const { users } = await hasura.request(LOGIN_QUERY, {
      email: input.email,
    });

    if (users.length === 0) {
      throw Boom.unauthorized("Invalid email or password");
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
      throw Boom.unauthorized("Invalid email or password");
    }

    const accessToken = await signAccessToken(user);
    return res.json({
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/me", verifyAccessToken, (req, res, next) => {
  console.log("req.payload:::", req.payload);
  /* {
  'https://hasura.io/jwt/claims': {
    'x-hasura-default-role': 'user',
    'x-hasura-allowed-roles': [ 'user' ],
    'x-hasura-user-id': '16'
  },
  email: '6e4796ceabc54112ab60@mailspons.com',
  iat: 1705684961,
  exp: 1714324961,
  aud: '16',
  iss: 'graphql-egitimi'
} */
  const { aud } = req.payload;

  return res.json({
    user_id: aud,
  });
});

export default router;
