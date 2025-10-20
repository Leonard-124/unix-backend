

// import { auth } from "express-oauth2-jwt-bearer";
// import dotenv from 'dotenv'

// dotenv.config();


// const checkJwt = auth({
//   audience: process.env.AUTH0_AUDIENCE,
//   issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
//   tokenSigningAlg: "RS256",
// });

// export default checkJwt;
///////////////////////////////////

import { auth } from "express-oauth2-jwt-bearer";
import dotenv from 'dotenv';

dotenv.config();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

// Middleware wrapper to ensure req.user is set from req.auth
export default (req, res, next) => {
  checkJwt(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // express-oauth2-jwt-bearer sets req.auth, but we also want req.user for convenience
    if (req.auth?.payload) {
      req.user = {
        sub: req.auth.payload.sub,
        ...req.auth.payload
      };
    }
    
    next();
  });
};
