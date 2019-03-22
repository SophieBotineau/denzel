const express = require('express');
const express_graphql = require('express-graphql');
const { buildASTSchema } = require('GraphQL');
const graphql = require("graphql-tag");
const mongoClient = require("mongodb").MongoClient;
const imdb = require("./imdb");
const DENZEL_IMDB_ID = "nm0000243";

//Connect to database
const CONNECTION_URL = "mongodb+srv://SophieB:Laure123@webdevtd-8bwam.mongodb.net/test?retryWrites=true";//penser a mettre le mdp en var d'environnement
const DATABASE_NAME = "Dataset";
const port = 9292;

// GraphQL schema
let schema = buildASTSchema(graphql`
    type Query {
        populate: String
        getRandom: Movie
        getMovieByID(id: String): Movie
        getMovies(id: [String], limit: Int): [Movie]
    },
    type Movie {
        link: String
        id: String
        metascore: Int
        poster: String
        rating: Float
        synopsis: String
        title: String
        votes: Float
        year: Int
        date: String
        review: String
    },
    type Mutation{
        updateMovie(id: String, date: String, review: String): Movie
    }
`);


// Root resolver
var root = {
    populate: async () => {
        const movies = await populate(DENZEL_IMDB_ID);
        const insertion = await collection.insertMany(movies);
        return {
            total: insertion.movie.n
        };
    },
};

getRandom: async () => {
    let options = {
        "limit": 1,
        "skip": Math.floor(Math.random() * await collection.countDocuments({"metascore": {$gte: 70}}))
    }
    let query = {
        "metascore": { $gte: 70}
    };
    return await collection.findOne(query, options);
};

getMovieByID: async (args) => {
    return await collection.findOne({"id": args.id})
};

getMovies: async (args) => {
    let options = {"limit": args.limit, "sort": [ ['metascore', 'desc']]
    };
    return await collection.find({"metascore": {$gte: args.metascore}}, options).toArray();
};

updateMovie: async (args) => {
    const post =  await collection.updateMany({"id": args.id}, {$set: {review: args.review, date: args.date}}, {"upsert": true});
    return await collection.findOne({"id": args.id});

};

async function populate(actor) {
    try {
        console.log(`📽️ fetching filmography of ${actor}...`);
        return await imdb(actor);
    } catch (e) {
        console.error(e);
    }
}

let app = express();
app.use('/graphQL', express_graphql({
    schema: schema,
    rootValue: root,
    graphQL: true
}));


//listen on port 9292 and connection to mongoDB atlas
app.listen(port, () => {

    mongoClient.connect(
        CONNECTION_URL,
        { useNewUrlParser: true },
        (error, client) => {
            if (error)
            {
                throw error;
            }
            database = client.db(DATABASE_NAME);
            collection = database.collection("movies");
            console.log(`Connected to ${DATABASE_NAME}`);
        }
    );
});