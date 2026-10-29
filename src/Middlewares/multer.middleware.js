import multer from "multer";
import fs from "node:fs"; 
import crypto from "node:crypto"; 
import { allowedExtension } from "../common/constants.js";
export const multerUpload =({desiredPath})=>{
    const fullDestinationPath = `uploads/${desiredPath}`
    if(!fs.existsSync(fullDestinationPath)){
        fs.mkdirSync(fullDestinationPath ,{recursive:true}) 
    }
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,fullDestinationPath)
    },
filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(5).toString('hex') + '-' + Date.now();
    cb(null, `${uniqueSuffix}___${file.originalname}`);
}
})

const fileFilter = (req, file, cb) => {
    const [fileType, inputFileExtension] = file.mimetype.split("/");
    const fileExtensions = allowedExtension[fileType];

    if (fileExtensions && fileExtensions.includes(inputFileExtension)) {
        cb(null, true);
    } else {
        cb(new BadRequestException("Invalid file extension"), false);
    }
};


return multer({fileFilter,storage})
}