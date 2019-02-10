
import { Router, Request, Response, NextFunction } from "express";

import Member from "../models/Member";
import Team from "../models/Team";





class TeamController {

    router: Router;


    constructor() {
        this.router = Router();
        this.routes();
    }



    public routes() {
        this.router.get( '/', this.getTeams );
        this.router.post( '/', this.createTeam );
        this.router.put( '/', this.updateTeam );
    }



    public getTeams(req: Request, res: Response, next: NextFunction) {
        const userId = req.app.get( "user" )._id;

        Team.find( { owner: userId } )
            .then( teams => {
                res.status( 200 ).json( { success: true, teams } );
            })
            .catch( next );
    }



    public createTeam = async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.app.get( "user" )._id;

        const { name, members } = req.body;

        if ( ! name ) {
            res.status( 422 ).json( { success: false, message: "Name property is required at team creation." } );
            return;
        }

        const team = new Team({
            name,
            owner: userId
        });

        await team.save();

        Member.update(
            { _id: { $in: members } },
            {  $push: { teams: team._id } },
            { multi: true }
        )
            .then( members => res.status( 200 ).json( { success: true, team, members } ) )
            .catch( next );

    };



    public updateTeam = async (req: Request, res: Response, next: NextFunction) => {
        const { id, name, members } = req.body;

        if ( ! id || ! name ) {
            res.status( 422 ).json( { success: false, message: "Invalid arguments provided for team update." } );
            return;
        }

        let addedMembers: string[]      = [];
        let removedMembers: string[]    = [];

        if ( members ) {
            const currentMembers    = await Member.find( { teams: { $in: id } } );
            const currentMemberIds  = currentMembers.map( m => (m as any)._id.toString() );

            addedMembers            = members.filter( (m: any) => currentMemberIds.indexOf( m ) === -1 );
            removedMembers          = currentMemberIds.filter( (m: any) => members.indexOf( m ) === -1 );


            await Promise.all([
                Member.update(
                    { _id: { $in: addedMembers } },
                    {  $push: { teams: id } },
                    { multi: true } ),

                Member.update(
                    { _id: { $in: removedMembers } },
                    {  $pull: { teams: id } },
                    { multi: true } )
            ]);
        }

        Team.findByIdAndUpdate( id, { name }, { "new" : true } )
            .then( team => res.status( 200 ).json( { success: true, team, addedMembers, removedMembers } ) )
            .catch( next );
    };



}



export default new TeamController().router;