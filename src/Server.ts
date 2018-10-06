

import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import * as express from "express";
import * as logger from "morgan";
import * as helmet from "helmet";
import * as cors from "cors";

import UserController from "./controllers/UserController";
import DataHelper from "./helpers/DataHelper";





class Server {

    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }



    public config() {

        const MONGO_URI = "mongodb://localhost/scrumbs-ts";

        mongoose.connect( MONGO_URI || process.env.MONGODB_URI );


        this.app.use( bodyParser.urlencoded( { extended: true } ) );
        this.app.use( bodyParser.json() );
        this.app.use( logger( "dev" ) );
        this.app.use( compression() );
        this.app.use( helmet() );
        this.app.use( cors() );

        this.app.use( (err, req, res, next) => {
            res.status( 422 ).send( { error: err.message } );
        });

    }



    public routes() {
        let router: express.Router;
        router = express.Router();

        this.app.use( '/', router );
        this.app.use( "/api/v1/users", UserController );
        this.app.use( "/api/v1/db", DataHelper );
    }

}

export default new Server().app;