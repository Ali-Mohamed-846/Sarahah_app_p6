import { emailOtpExpiration, providersEnum, tokenTypeEnum } from '../../common/constants.js'
import { decodeToken } from '../../common/Utils/token.utils.js'
import envConfig from '../../../config/config.js'
import UserRepository from "../../DB/Repositories/user.repository.js"
import HttpAppError from "../../common/Utils/Errors/app.error.js"
import { BadRequestException, ConflictException, NotFoundException } from "../../common/Utils/Errors/exception.error.js"
import { encrypt } from "../../common/utils/Security/encryption.security.js"
import { compareTwoHashes, hash } from "../../common/Utils/Security/hash.security.js"
import crypto from "node:crypto"
import { generateToken } from '../../common/Utils/token.utils.js'
import { OAuth2Client } from 'google-auth-library'

import { calculateTTL, del, expire, get, incr, set } from '../../common/Services/redis.services.js'
import { v4 as uuidv4 } from 'uuid'
import { uuid } from 'zod/mini'
import { eventEmitter, sendEmail } from '../../common/Services/email.services.js'

const userRepo = new UserRepository()

const handleSendingVerificationOtp = async ({ email, subject, purpose }) => {
  const otp = crypto.randomInt(100000, 1000000).toString()
  const hashedOtp = await hash(otp)

  eventEmitter.emit('sendMailEvent', {
    to: email,
    subject: subject,
    message: `<h1>This is your Verification OTP</h1>
        <h3>${otp}</h3>
        <h3>This OTP is valid for 5 minutes</h3>`
  })

  await set({
    key: `Email_Verification:${purpose}:${email}`,
    value: hashedOtp,
    options: { EX: emailOtpExpiration }
  })
}
export const registerUser = async (data) => {
  const { firstName, lastName, email, password, gender, age, phoneNumber, role } = data

  const isExistingUser = await userRepo.findUserByEmail(email)
  if (isExistingUser) {
    throw new ConflictException("Email already exists")
  }
  let encryptedPhone
  if (phoneNumber) encryptedPhone = encrypt(phoneNumber)
  const hashedPassword = await hash(password)
  await handleSendingVerificationOtp({ email, subject: "Email Verification", purpose: "register" })
  return userRepo.createDocument({ firstName, lastName, email, password: hashedPassword, gender, age, phoneNumber: encryptedPhone || undefined, role })

}

const buildTokens = (user) => {
  const tokensPayload = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };

  // generate access token
  const accessToken = generateToken(
    tokensPayload,
    envConfig.jwt.user.access_token_secret,
    { expiresIn: envConfig.jwt.user.access_token_expires_in, jwtid: uuidv4() },
  );

  const refreshToken = generateToken(
    tokensPayload,
    envConfig.jwt.user.refresh_token_secret,
    { expiresIn: envConfig.jwt.user.refresh_token_expires_in, jwtid: uuidv4() },
  );

  return { accessToken, refreshToken };
};

export const signin = async (data) => {

  const { email, password } = data

  const isBanned = await get(`login:${email}`)
  if (isBanned) {
    throw new BadRequestException("Too many failed attempts. Try again after 5 minutes.");
  }

  const user = await userRepo.findOneDocument({ email, provider: providersEnum.SYSTEM })

  if (!user) {
    throw new NotFoundException("Invalid email or password")
  }

  const isPasswordMatched = await compareTwoHashes(user.password, password)

  if (!isPasswordMatched) {

    const attempts = await incr(`attempts:${email}`);

    if (attempts >= 5) {

      await set({ key: `login:${email}`, value: "true", options: { EX: 300 } });


      await del(`attempts:${email}`);

      throw new BadRequestException("Try again after 5 minutes");
    }

    throw new NotFoundException("Invalid email or password")
  }


  await del(`attempts:${email}`);

  if (!user.isTwoStepVerification) {

     return { message: "User logged in successfully",token:{ ...buildTokens(user)} };

  } else {
    await handleSendingVerificationOtp({ email, subject: "Login Verification", purpose: "login" })
    return {
      message: "OTP sent to your email", status: "OTP_REQUIRED"
    }
  }

}


export const refreshToken = async (userRefreshToken) => {
  const user = await decodeToken({
    token: userRefreshToken,
    tokentype: tokenTypeEnum.REFRESH_TOKEN
  })

  const accessToken = generateToken(
    { _id: user._id, email: user.email, role: user.role },
    envConfig.jwt.user.access_token_secret,
    { expiresIn: envConfig.jwt.user.access_token_expires_in, jwtid: uuidv4() }
  )

  return { accessToken }
}


const verifyIdToken = async (token) => {

  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: envConfig.GCP.client_id
    });
    const payload = ticket.getPayload();
    return payload
  }
  return verify();


}

const updateOrCreateUser = async (user, googleTokenPayload) => {
  const { sub, email, given_name, family_name } = googleTokenPayload

  if (user) {
    return userRepo.updateDocument(user._id, { googleSub: sub, email, firstName: given_name, lastName: family_name }, { new: true })
  }

  else {
    const hashedPassword = await hash(crypto.randomBytes(12).toString('hex'))
    return userRepo.createDocument({
      googleSub: sub,
      firstName: given_name,
      lastName: family_name,
      provider: providersEnum.GOOGLE,
      email,
      password: hashedPassword
    })
  }
}

export const googleRegister = async (token) => {
  const googleTokenPayload = await verifyIdToken(token)
  if (!googleTokenPayload || !googleTokenPayload.email_verified) throw new BadRequestException("Not Verified User Email", null, "GOOGLE_EMAIL_NOT_VERIFIED")
  const user = await userRepo.findOneDocument({ googleSub: googleTokenPayload.sub, provider: providersEnum.GOOGLE })
  const handledUser = await updateOrCreateUser(user, googleTokenPayload)
  return buildTokens(handledUser)

}

export const googleLogin = async (idToken) => {
  const googleTokenPayload = await verifyIdToken(idToken);

  if (!googleTokenPayload || !googleTokenPayload.email_verified) {
    throw new BadRequestException('Not verified user email', null, 'GOOGLE_EMAIL_NOT_VERIFIED',);
  }

  const user = await userRepo.findOneDocument({ googleSub: googleTokenPayload.sub, provider: providersEnum.GOOGLE, });

  if (!user) {
    throw new BadRequestException('User not found', null, 'USER_NOT_FOUND',);
  }

  return buildTokens(user);
};


export const logout = async (accessTokenData, refreshTokenData) => {
  const { exp: accessExpiration, jti: accessId } = accessTokenData;
  const { exp: refreshExpiration, jti: refreshId } = refreshTokenData;

  const accessTTL = calculateTTL(accessExpiration);
  const refreshTTL = calculateTTL(refreshExpiration);

  await Promise.all([
    set({ key: `bl_${tokenTypeEnum.ACCESS_TOKEN}_${accessId}`, value: 'true', options: { EX: accessTTL } }),
    set({ key: `bl_${tokenTypeEnum.REFRESH_TOKEN}_${refreshId}`, value: 'true', options: { EX: refreshTTL } })

  ]);

  return { accessTTL, refreshTTL };
};



export const confirmEmail = async (email, otp) => {
  if (!email || !otp) {
    throw new BadRequestException(
      "Email and OTP are required"
    );
  }

  const hashedOtp = await get(`Email_Verification:register:${email}`)
  if (!hashedOtp) {
    throw new BadRequestException("Invalid email or your otp is expired", null, 'OTP_EXPIRATION')
  }

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) {
    throw new BadRequestException("Invalid otp", null, 'OTP_INVALID')
  }
  await userRepo.findOneAndUpdateDocument({ email }, { isEmailVerified: true })
 await del(`Email_Verification:register:${email}`)
}


export const resendEmailVerification = async (email) => {

    if (!email) {
        throw new BadRequestException("Email is required");
    }

    const user = await userRepo.findOneDocument({email});

    if (!user) {
        throw new NotFoundException("User not found");
    }

    if (user.isEmailVerified) {
        throw new BadRequestException("Email is already verified");
    }

    await handleSendingVerificationOtp({
        email: user.email,
        subject: "Email Verification",
        purpose: "register"
    });

   
};



export const enableTwoStepVerification = async (accessTokenData) => {
  const { _id } = accessTokenData;
  const user = await userRepo.findDocumentById(_id)
   
    if (!user) {
        throw new NotFoundException("User not found");
    }

    if (user.isTwoStepVerification) {
        throw new BadRequestException("2-Step Verification is already enabled");
    }
  await handleSendingVerificationOtp({ email: user.email, subject: "2-Step Verification", purpose: "twostepverification" })
  
};


export const confirmTwoStepVerification = async (email, otp) => {
  if (!email || !otp) {
    throw new BadRequestException(
      "Email and OTP are required"
    );
  }

  const hashedOtp = await get(`Email_Verification:twostepverification:${email}`)
  if (!hashedOtp) {
    throw new BadRequestException("Invalid email or your otp is expired", null, 'OTP_EXPIRATION')
  }

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) {
    throw new BadRequestException("Invalid otp", null, 'OTP_INVALID')
  }
  await userRepo.findOneAndUpdateDocument({ email }, { isTwoStepVerification: true })
  await del(`Email_Verification:twostepverification:${email}`)
}





export const confirmLogin = async (email, otp) => {
  if (!email || !otp) {
    throw new BadRequestException(
      "Email and OTP are required"
    );
  }

  const hashedOtp = await get(`Email_Verification:login:${email}`)
  if (!hashedOtp) {
    throw new BadRequestException("Invalid email or your otp is expired", null, 'OTP_EXPIRATION')
  }

  const isValidOtp = await compareTwoHashes(hashedOtp, otp.toString())
  if (!isValidOtp) {
    throw new BadRequestException("Invalid otp", null, 'OTP_INVALID')
  }
  const user = await userRepo.findOneDocument({ email })
 await del(`Email_Verification:login:${email}`)
  return buildTokens(user)

}


export const forgotPassword = async (email) => {
    if (!email) {
        throw new BadRequestException("Email is required");
    }

    const user = await userRepo.findOneDocument({
        email,
        provider: providersEnum.SYSTEM
    });

    if (!user) {
        throw new BadRequestException(
            "If the account exists otp will be sent"
        );
    }

    await handleSendingVerificationOtp({
        email: user.email,
        subject: "Password Reset",
        purpose: "forgotpassword"
    });

  
};



export const resetPassword = async ({ email, otp, newPassword }) => {
    if (!email || !otp || !newPassword) {
        throw new BadRequestException(
            "Email, OTP and new password are required"
        );
    }

    const hashedOtp = await get(
        `Email_Verification:forgotpassword:${email}`
    );

    if (!hashedOtp) {
         throw new BadRequestException("Invalid email or your otp is expired", null, 'OTP_EXPIRATION')
    }

    const isValidOtp = await compareTwoHashes(
        hashedOtp,
        otp.toString()
    );

    if (!isValidOtp) {
        throw new BadRequestException(
            "Invalid OTP",
            null,
            "OTP_INVALID"
        );
    }

    const user = await userRepo.findOneDocument({
        email,
        provider: providersEnum.SYSTEM
    });

    if (!user) {
        throw new NotFoundException("User not found");
    }

    const hashedPassword = await hash(newPassword);

    await userRepo.findOneAndUpdateDocument(
        { email, provider: providersEnum.SYSTEM },
        { password: hashedPassword }
    );

    await del(`Email_Verification:forgotpassword:${email}`);

    
};
