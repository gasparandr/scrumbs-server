import { Document } from "mongoose";


export interface IUser extends Document {
    firstName: string,
    lastName: string,
    profileImage: string,
    email: string,
    password: string,
    comparePassword(password): Promise<boolean>
}