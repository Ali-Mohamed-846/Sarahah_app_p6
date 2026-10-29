import User from "../models/users.model.js";
import BaseRepository from "./base.repository.js";

export default class UserRepository extends BaseRepository{
constructor(){
    super(User)
}
findUserByEmail(email){
    return this.findOneDocument({email})
}
findUserAndDelete(_Id){
    return this.model.findByIdAndDelete(_Id)
}
getAllUsers(){
    return this.model.find()
}
}