import JWT from "jsonwebtoken";

export const signAccessToken = (user) => {
  return new Promise((resolve, reject) => {
    const secretKey = process.env.JWT_ACCESS_TOKEN_SECRET;

    const payload = {
      "https://hasura.io/jwt/claims": {
        "x-hasura-default-role": "user",
        "x-hasura-allowed-roles": ["user"],
        "x-hasura-user-id": user.id.toString(),
      },
      email: user.email,
    };

    const options = {
      expiresIn: "100d",
      issuer: "graphql-egitimi",
      audience: user.id.toString(),
    };

    JWT.sign(payload, secretKey, options, (err, token) => {
      if (err) {
        return reject(err);
      }

      resolve(token);
    });
  });
};

export const verifyAccessToken = (req, res, next) => {
  const authHeaders = req.headers.authorization || req.query.token?.toString();

  if (!authHeaders) {
    return next(Boom.unauthorized("No token provided"));
  }

  const bearerToken = authHeaders.split(" ");
  const token = bearerToken[bearerToken.length - 1];

  JWT.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next(Boom.unauthorized("Invalid token"));
    }
    req.payload = decoded;
    req.token = token;
    next();
  });
};
