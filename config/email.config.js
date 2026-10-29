import envConfig from "./config.js";
const {email} = envConfig
export const emailConfig = {
  
  service: "gmail", // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: email.user,
    pass: email.pass
  
}
}