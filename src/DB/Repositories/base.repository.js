export default class BaseRepository{
model;
constructor(model){
    this.model=model
}



createDocument(data){
    return this.model.create(data)
}
findDocumentById(_id){
    return this.model.findById(_id).select("-password")
}
findOneDocument(filters={}){
    return this.model.findOne(filters)
}

findOneAndUpdateDocument(filters,updates,options){
    return this.model.findOneAndUpdate(filters,updates,options)
}
updateDocument(_id,data,options){

    return this.model.updateOne({ _id }, { $set: data }, options)
}


}