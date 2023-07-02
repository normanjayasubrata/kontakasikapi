#generate user model
sequelize model:generate --name User --attributes user_id:string,firstname:string,lastname:string,phone:string,email:string,gender:string,province:string,city:string,district:string,vilage:string,postcode:integer,address:text,image_url:string

#generate contact model
sequelize model:generate --name Contact --attributes contact_id:string,firstname:string,lastname:string,phone:string,email:string,gender:string,birthplace:string,birthdate:date,province:string,city:string,district:string,vilage:string,postcode:integer,address:text,user_id:string

#generate contact_image model
sequelize model:generate --name ContactImage --attributes image_id:string,image_url:string,contact_id:string

#generate deleted contact
sequelize model:generate --name DeletedContact --attributes deleted_id:string,contact_id:string,firstname:string,lastname:string,phone:string,email:string,gender:string,birthplace:string,birthdate:date,province:string,city:string,district:string,vilage:string,postcode:integer,address:text,user_id:string


sequelize model:generate --name UserActivityLog --attributes userId:string,action:enum,oldData:jsonb,newData:jsonb,description:text --underscored