import bcrypt from 'bcrypt'

export const hash =(plainText)=>{
    return bcrypt.hash(plainText ,10)
}

export const compareTwoHashes = (hash, plainText)=>{
    return bcrypt.compare(plainText,hash)
}