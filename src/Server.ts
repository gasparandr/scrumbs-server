
import * as dotenv from "dotenv"

import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import * as express from "express";
import * as helmet from "helmet";
import * as logger from "morgan";
import * as cors from "cors";
import * as ejs from "ejs";

import { Application, NextFunction, Request, Response, Router } from "express";

import Authentication from "./controllers/AuthenticationController";
import InvitationController from "./controllers/InvitationController";
import MemberController from "./controllers/MemberController";
import NoteController from "./controllers/NoteController";
import TeamController from "./controllers/TeamController";
import UserController from "./controllers/UserController";
import DataHelper from "./helpers/DataHelper";

dotenv.config();

const publicPath = __dirname.substr( 0, __dirname.indexOf( "build" ) ) + "public";


class Server {

    public app: Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
        this.errors();
    }



    public config() {

        const MONGO_URI = "mongodb://localhost/scrumbs-ts";

        mongoose.set( "useCreateIndex", true );
        mongoose.connect( MONGO_URI || process.env.MONGODB_URI, { useNewUrlParser: true } );


        this.app.set( "view engine", "ejs" );

        this.app.use( "*/public", express.static( publicPath ) );


        this.app.use( bodyParser.urlencoded( { extended: true } ) );
        this.app.use( bodyParser.json() );
        this.app.use( logger( "dev" ) );
        this.app.use( compression() );
        this.app.use( helmet() );
        this.app.use( cors() );

        this.app.use( Authentication.initialize() );


        this.app.all( process.env.API_BASE + "*", (req: Request, res: Response, next: NextFunction) => {

            //TODO: Remove @ release

            if ( req.path.includes( process.env.API_BASE + "data/populate" ) ) return next();
            if ( req.path.includes( process.env.API_BASE + "data/drop" ) ) return next();


            if ( req.path.includes( process.env.API_BASE + "authentication/" ) ) return next();


            return Authentication.authenticate( (err: any, user: any, info: any) => {

                if ( err ) { return next( err ); }

                if ( ! user ) {
                    if ( info.name === "TokenExpiredError" ) {
                        return res.status( 401 ).json( { message: "Your token has expired. Please generate a new one!" } );
                    } else {
                        return res.status( 401 ).json( { message: info.message } );
                    }
                }

                this.app.set( "user", user );

                return next();

            })(req, res, next);
        });

    }



    public routes() {
        let router: Router = Router();

        this.app.use( '/', router );

        this.app.use( process.env.API_BASE + "authentication", Authentication.router );


        this.app.use( process.env.API_BASE + "invitations", InvitationController );
        this.app.use( process.env.API_BASE + "members", MemberController );
        this.app.use( process.env.API_BASE + "notes", NoteController );
        this.app.use( process.env.API_BASE + "users", UserController );
        this.app.use( process.env.API_BASE + "teams", TeamController );


        this.app.use( process.env.API_BASE + "data", DataHelper );
    }



    public errors() {
        this.app.use( (err: any, req: Request, res: Response, next: NextFunction) => {
            res.status( 422 ).json( { success: false, message: err.message } );
        });
    }

}



export default new Server().app;