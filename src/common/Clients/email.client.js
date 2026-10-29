import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/email.config.js";


export const emailTransporter = nodemailer.createTransport(emailConfig);