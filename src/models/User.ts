

import { Schema, model, Model } from "mongoose";
import { IUser } from "./interfaces/IUser";
const bcrypt = require("bcrypt");


const SALT_WORK_FACTOR = 10;





const UserSchema = new Schema({

    firstName: {
        type: String,
        required: true,
        validate: {
            validator: (name) => name.length > 1 && name.length <= 30,
            message: "First name has to to be at least two characters in length, but not longer than 30."
        }
    },

    lastName: {
        type: String,
        required: true,
        validate: {
            validator: (name) => name.length > 1 && name.length <= 30,
            message: "First name has to to be at least two characters in length, but not longer than 30."
        }
    },

    profileImage: String,

    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (email) => {
                let emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
                return emailRegex.test( email );
            },
            message: "Please provide a valid email address."
        }
    },

    password: {
        type: String,
        required: true,
        validate: {
            validator: (password) => password.length > 4 && password.length < 75,
            message: "Password must contain 4 or more characters."
        }
    },

    resetPasswordToken: String,

    resetPasswordExpires: Date,

    confirmed: {
        type: Boolean,
        default: false
    }

});


UserSchema.pre( "save", function (next) {
    let user = (this as any);

    /** Only hash the password if it has been modified or new */

    if ( ! user.isModified("password") ) return next();

    /** Generate salt */
    bcrypt.genSalt( SALT_WORK_FACTOR, (err, salt) => {
        if ( err ) return next( err );

        /** Hash the password with the salt */
        bcrypt.hash( user.password, salt, (err, hash) => {
            if ( err ) return next( err );

            /** Override clear-text password */
            user.password = hash;
            next();
        });
    });
});



UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {

    let password = this.password;

    return new Promise((resolve, reject) => {

        bcrypt.compare(candidatePassword, password, (err, success) => {

            if (err) return reject(err);
            return resolve(success);

        });

    });

};



UserSchema.pre("save", function(next) {
    const self = (this as any);

    User.findOne( { email : self.email } , "email", function(err, result) {
        if( err ) {

            next( err );

        } else if( result && result._id.toString() !== self._id.toString() ) {

            console.warn( "result", result );
            self.invalidate( "email", "email must be unique" );

            next( new Error( "email must be unique" ) );
        } else {
            next();
        }
    });
});



const User: Model<IUser> = model<IUser>( "User", UserSchema );

export default User;