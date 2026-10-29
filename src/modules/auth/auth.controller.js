import { Router } from "express";
import * as authService from "./auth.service.js"
import * as validators from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";
import { BadRequestException } from "../../common/Utils/Errors/exception.error.js";
import { authenticate } from "../../Middlewares/authentication.middleware.js";
import { decodeRefreshToken } from "../../Middlewares/decodeRefreshToken.middleware.js";
const router = Router()

router.post('/register', validation(validators.signup), async (req, res) => {

  const { firstName, lastName, email, password, gender, age, phoneNumber } = req.validate.body
  const result = await authService.registerUser({ firstName, lastName, email, password, gender, age, phoneNumber })
  res.status(201).json({ message: "User registered successfully ", data: result })
})
router.post('/login', validation(validators.login), async (req, res) => {

  const { email, password } = req.validate.body
  const user = await authService.signin({ email, password })
  res.json(user)
}) 

router.post('/refresh-token', async (req, res, next) => {
  const { refreshtoken } = req.headers
  if (!refreshtoken) {
    throw new BadRequestException('Refresh token is required', null, 'MISSING_REFRESH_TOKEN')
  }

  const result = await authService.refreshToken(refreshtoken)
  res.status(200).json({ message: 'Token refreshed successfully', token: result })
})

router.post('/google-register', async (req, res, next) => {
    const { idToken } = req.body

    if (!idToken) throw new BadRequestException('Google ID token is required', null, 'MISSING_GOOGLE_ID_TOKEN')

    const result = await authService.googleRegister(idToken)
    res.status(201).json({ message: 'User registered successfully', data: result })
})


router.post('/google-login', async (req, res, next) => {
    const { idToken } = req.body

    if (!idToken) throw new BadRequestException('Google ID token is required', null, 'MISSING_GOOGLE_ID_TOKEN')

    const result = await authService.googleLogin(idToken)
    res.status(200).json({ message: 'User logged in successfully', data: result })
})



router.post('/logout', authenticate, decodeRefreshToken, async (req, res, next) => {
    const result = await authService.logout( req.accessTokenData, req.refreshTokenData);

    res.status(200).json({message: 'LoggedOut successfully', data: result })
  });


router.patch('/confirm-Email', async (req, res, next) => {
  const {email , otp} = req.body
    const result = await authService.confirmEmail(email,otp);

    res.status(200).json({message: 'Email confirmed successfully', data: result })
  });
  

router.post('/enable-2-StepVerification' ,authenticate, async (req, res, next) => {

      const result = await authService.enableTwoStepVerification( req.accessTokenData);

    res.status(200).json({ message: "OTP sent to your email", status: "OTP_REQUIRED" })
  });


router.patch('/confirm-2-StepVerification', async (req, res, next) => {
  const {email , otp} = req.body
    const result = await authService.confirmTwoStepVerification(email,otp);

    res.status(200).json({message: '2-Step Verification confirmed successfully', data: result })
  });
router.patch('/confirm-login', async (req, res, next) => {
  const {email , otp} = req.body
    const result = await authService.confirmLogin(email,otp);

    res.status(200).json({message: 'login confirmed successfully', data: result })
  });

  router.post('/resend-email-verification', async (req, res) => {
  const { email } = req.body;

  await authService.resendEmailVerification(email);

  res.status(200).json({
    message: "Verification OTP sent successfully"
  });
});

router.post('/forgot-password' , async (req, res) => {
const { email } = req.body;
const result = await authService.forgotPassword(email);
res.status(200).json({ message: "If the account exists otp will be sent",data: result});});

router.patch('/reset-password', validation(validators.resetPassword), async (req, res) => {
  const { email, otp, newPassword } = req.validate.body;

  const result = await authService.resetPassword({ email, otp,newPassword});

  res.status(200).json({ message: "Password reset successfully",  data: result}); });




export default router



