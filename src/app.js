const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require("./imdb");
const DENZEL_IMDB_ID = "nm0000243";

const CONNECTION_URL = "mongodb+srv://SophieB:Laure123@webdevtd-8bwam.mongodb.net/test?retryWrites=true";//penser a mettre le mdp en var d'environnement
const DATABASE_NAME = "Dataset";
var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));


app.listen(9292, () => { //connexion a MongoDB sur le port 9292

    MongoClient.connect(
        CONNECTION_URL,
        { useNewUrlParser: true },
        (error, client) => {
            if (error)
            {
                throw error;
            }
            database = client.db(DATABASE_NAME);
            collection = database.collection("movies");
            console.log(`Connected to ${DATABASE_NAME} `);
        }
    );
});

app.get("/movies/populate", async (request, response) => { //Premier noeud d'API peuplant la bdd

    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, (err, result) => {
        if (err)
        {
            return response.status(500).send(err);

        }

        response.send(`Total movies added : ${movies.length}`);

    });

});

app.get("/movies", (request, response) => { //Affichage d un film recommande aleatoire

    collection
        .aggregate([
            { $match: { metascore: { $gte: 70 } } },

            { $sample: { size: 1 } }

        ])

        .toArray((error, result) => {

            if (error)
            {
                return response.status(500).send(error);
            }

            response.send(result);
        });
});


app.get("/movies/search", (request, response) => { //Permet de faire une recherche sur la bdd

    console.log(request.query.limit);
    collection.aggregate([

        {
            $match: { metascore: { $gte: Number(request.query.metascore) } }
        },

        { $sample: { size: Number(request.query.limit) } }

    ])

        .toArray((error, result) => {

            if (error)
            {
                return response.status(500).send(error);
            }
            response.send(result);
        });
});

app.get("/movies/:id", (request, response) => {
    collection.findOne({ id: request.params.id }, (err, result) => {
        if (err) {
            return response.status(500).send(err);

        }
        response.send(result);
    });

});

app.post("/movies/:id", (request, response) => {
    collection.updateMany({id: request.params.id}, {$set: {date :request.body.date, review : request.body.review}}, {"upsert": true},(error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        response.send(result)
    });
});
